import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { InteractionManager, LogBox } from "react-native";
import { createStoresDb, getAllStores, resetStoresDb } from "@/utils/storesDb";
import { createStocksDb, resetStocksDb } from "@/utils/stocksDb";
import { createSalesDb, resetSalesDb } from "@/utils/salesDb";
import { createOrderListDb, resetOrderListDb } from "@/utils/orderListDb";
import { createSupplierDb, resetSuppliersDb } from "@/utils/supplierDb";
import { createHistoryDb, resetHistoryDb } from "@/utils/historyDb";
import { Store } from "@/types";

LogBox.ignoreLogs(["Warning: useInsertionEffect must not schedule updates"]);

type StoreContextType = {
  allStores: Store[];
  currentStore: Store | null;
  setCurrentStore: (store: Store | null) => void;
  addStoreToContext: (store: Store) => void;
  refreshAllStores: () => Promise<void>;
  isReady: boolean;
  hasNavigated: boolean;
};

const StoreContext = createContext<StoreContextType | null>(null);

let didInitDatabases = false;
let didNavigate = false;

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const router = useRouter();

  const isBootstrapping = useRef(false);
  const isRefreshing = useRef(false);

  const setCurrentStore = useCallback((store: Store | null) => {
    InteractionManager.runAfterInteractions(() => {
      setCurrentStoreState(store);

      if (store?.id) {
        AsyncStorage.setItem("activeStoreId", store.id.toString()).catch(
          (error) => {
            console.error("Error saving active store ID:", error);
          }
        );
      }
    });
  }, []);

  const addStoreToContext = useCallback((store: Store) => {
    InteractionManager.runAfterInteractions(() => {
      setAllStores((prev) => {
        const exists = prev.some((s) => s.id === store.id);
        if (exists) return prev;
        return [...prev, store];
      });
    });
  }, []);

  const refreshAllStores = useCallback(async () => {
    if (isRefreshing.current) return;

    isRefreshing.current = true;

    try {
      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(async () => {
          try {
            const stores = await getAllStores();
            setAllStores(stores);
            console.log("🔄 Refreshed all stores:", stores.length);
            resolve();
          } catch (error) {
            console.error("Error refreshing stores:", error);
            resolve();
            throw error;
          }
        });
      });
    } finally {
      isRefreshing.current = false;
    }
  }, []);

  const resetAllDb = useCallback(() => {
    resetStoresDb();
    resetHistoryDb();
    resetOrderListDb();
    resetSalesDb();
    resetStocksDb();
    resetSuppliersDb();
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      if (isBootstrapping.current) return;

      isBootstrapping.current = true;

      if (!didInitDatabases) {
        try {
          // resetAllDb();
          createStoresDb();
          createStocksDb();
          createSalesDb();
          createOrderListDb();
          createSupplierDb();
          createHistoryDb();
          console.log("▶︎ Databases initialized");
        } catch (e) {
          console.error("DB init error:", e);
        }
        didInitDatabases = true;
      }

      try {
        InteractionManager.runAfterInteractions(async () => {
          try {
            const stores = await getAllStores();
            setAllStores(stores);

            const storedId = await AsyncStorage.getItem("activeStoreId");
            const found = stores.find((s) => s.id === Number(storedId));
            if (found) setCurrentStoreState(found);

            console.log("📊 Bootstrap data:", {
              storesLength: stores.length,
              foundStore: !!found,
              didNavigate,
            });

            if (!didNavigate) {
              setTimeout(() => {
                if (stores.length === 0) {
                  router.replace("/(auth)/welcomeScreen");
                  console.log("🔄 Navigated to welcomeScreen");
                } else if (!found) {
                  router.replace("/(auth)/welcomeBackScreen");
                  console.log("🔄 Navigated to welcomeBackScreen");
                } else {
                  router.replace("/(app)");
                  console.log("🔄 Navigated to index/home");
                }
                didNavigate = true;
                setHasNavigated(true);
                console.log(
                  "✅ Navigation completed, hasNavigated set to true"
                );
              }, 100);
            }
          } catch (e) {
            console.error("Loading stores failed:", e);
          } finally {
            setIsReady(true);

            if (!didNavigate) {
              didNavigate = true;
              setHasNavigated(true);
            }
            isBootstrapping.current = false;
          }
        });
      } catch (e) {
        console.error("Bootstrap failed:", e);
        setIsReady(true);
        isBootstrapping.current = false;

        if (!didNavigate) {
          didNavigate = true;
          setHasNavigated(true);
        }
      }
    };

    bootstrap();
  }, []);

  return (
    <StoreContext.Provider
      value={{
        allStores,
        currentStore,
        setCurrentStore,
        addStoreToContext,
        refreshAllStores,
        isReady,
        hasNavigated,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
};

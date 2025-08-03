import { Store } from "@/types";
import { createHistoryDb, resetHistoryDb } from "@/utils/historyDb";
import { createOrderListDb, resetOrderListDb } from "@/utils/orderListDb";
import { createSalesDb, resetSalesDb } from "@/utils/salesDb";
import { createStocksDb, resetStocksDb } from "@/utils/stocksDb";
import { createStoresDb, getAllStores, resetStoresDb } from "@/utils/storesDb";
import { createSupplierDb, resetSuppliersDb } from "@/utils/supplierDb";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { InteractionManager } from "react-native";

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

// Module-level guard flags
let didInitDatabases = false;
let didNavigate = false;

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const router = useRouter();

  // Use refs to prevent concurrent operations
  const isBootstrapping = useRef(false);
  const isRefreshing = useRef(false);

  // Safe wrapper for setCurrentStore that defers state updates
  const setCurrentStore = useCallback((store: Store | null) => {
    InteractionManager.runAfterInteractions(() => {
      setCurrentStoreState(store);

      // Also update AsyncStorage if store has an ID
      if (store?.id) {
        AsyncStorage.setItem("activeStoreId", store.id.toString()).catch(
          (error) => {
            console.error("Error saving active store ID:", error);
          }
        );
      }
    });
  }, []);

  // Add store to context (for newly created stores)
  const addStoreToContext = useCallback((store: Store) => {
    InteractionManager.runAfterInteractions(() => {
      setAllStores((prev) => {
        // Check if store already exists to avoid duplicates
        const exists = prev.some((s) => s.id === store.id);
        if (exists) return prev;
        return [...prev, store];
      });
    });
  }, []);

  // Refresh all stores from database
  const refreshAllStores = useCallback(async () => {
    if (isRefreshing.current) return;

    isRefreshing.current = true;

    try {
      // Defer the database operation
      await new Promise<void>((resolve) => {
        InteractionManager.runAfterInteractions(async () => {
          try {
            const stores = await getAllStores();
            setAllStores(stores);
            console.log("🔄 Refreshed all stores:", stores.length);
            resolve();
          } catch (error) {
            console.error("Error refreshing stores:", error);
            resolve(); // Resolve even on error to prevent hanging
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
      // Prevent concurrent bootstrap operations
      if (isBootstrapping.current) return;

      isBootstrapping.current = true;

      // Only run database initialization once
      if (!didInitDatabases) {
        try {
          resetAllDb();
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
        // Defer all state updates and navigation
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

            // Handle navigation after a small delay to avoid render conflicts
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
              }, 100); // Small delay to ensure render cycle completes
            }
          } catch (e) {
            console.error("Loading stores failed:", e);
          } finally {
            setIsReady(true);
            // If we didn't navigate due to an error, still mark as navigated to prevent loops
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
  }, []); // empty deps = only on mount

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

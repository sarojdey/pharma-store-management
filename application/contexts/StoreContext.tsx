import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { createStoresDb, getAllStores, resetStoresDb } from "@/utils/storesDb";
import { createStocksDb, resetStocksDb } from "@/utils/stocksDb";
import { createSalesDb, resetSalesDb } from "@/utils/salesDb";
import { createOrderListDb, resetOrderListDb } from "@/utils/orderListDb";
import { createSupplierDb, resetSuppliersDb } from "@/utils/supplierDb";
import { createHistoryDb, resetHistoryDb } from "@/utils/historyDb";
import { Store } from "@/types";

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
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  const router = useRouter();

  // Add store to context (for newly created stores)
  const addStoreToContext = (store: Store) => {
    setAllStores((prev) => {
      // Check if store already exists to avoid duplicates
      const exists = prev.some((s) => s.id === store.id);
      if (exists) return prev;
      return [...prev, store];
    });
  };

  // Refresh all stores from database
  const refreshAllStores = async () => {
    try {
      const stores = await getAllStores();
      setAllStores(stores);
      console.log("🔄 Refreshed all stores:", stores.length);
    } catch (error) {
      console.error("Error refreshing stores:", error);
      throw error;
    }
  };

  const resetAllDb = () => {
    resetStoresDb();
    resetHistoryDb();
    resetOrderListDb();
    resetSalesDb();
    resetStocksDb();
    resetSuppliersDb();
  };

  useEffect(() => {
    const bootstrap = async () => {
      // Only run once, regardless of remounts
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
        const stores = await getAllStores();
        setAllStores(stores);

        const storedId = await AsyncStorage.getItem("activeStoreId");
        const found = stores.find((s) => s.id === Number(storedId));
        if (found) setCurrentStore(found);
        console.log("📊 Bootstrap data:", {
          storesLength: stores.length,
          foundStore: !!found,
          didNavigate,
        });
        if (!didNavigate) {
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
          console.log("✅ Navigation completed, hasNavigated set to true");
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

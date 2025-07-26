import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Store } from "@/types";
import { getAllStores } from "@/utils/storesDb";

interface StoreContextType {
  currentStoreId: number | null;
  currentStore: Store | null;
  allStores: Store[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentStore: (storeId: number) => Promise<void>;
  refreshStores: () => Promise<void>;
  clearCurrentStore: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY = "active_store_id";

interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider: React.FC<StoreProviderProps> = ({ children }) => {
  const [currentStoreId, setCurrentStoreId] = useState<number | null>(null);
  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load active store ID from AsyncStorage on app start
  const loadActiveStoreId = async (): Promise<number | null> => {
    try {
      const storedStoreId = await AsyncStorage.getItem(STORAGE_KEY);
      return storedStoreId ? parseInt(storedStoreId, 10) : null;
    } catch (error) {
      console.error("Error loading active store ID:", error);
      return null;
    }
  };

  // Save active store ID to AsyncStorage
  const saveActiveStoreId = async (storeId: number | null): Promise<void> => {
    try {
      if (storeId) {
        await AsyncStorage.setItem(STORAGE_KEY, storeId.toString());
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error("Error saving active store ID:", error);
    }
  };

  // Refresh stores from database
  const refreshStores = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const stores = await getAllStores();
      setAllStores(stores);
    } catch (error) {
      console.error("Error refreshing stores:", error);
      setError("Failed to load stores");
    } finally {
      setIsLoading(false);
    }
  };

  // Set current store by ID
  const setCurrentStore = async (storeId: number): Promise<void> => {
    try {
      setError(null);
      // Find the store in allStores
      const store = allStores.find((s: Store) => s.id === storeId);
      if (!store) {
        throw new Error(`Store with ID ${storeId} not found`);
      }
      setCurrentStoreId(storeId);
      setCurrentStoreState(store);
      await saveActiveStoreId(storeId);
      console.log(`Active store set to: ${store.name} (ID: ${storeId})`);
    } catch (error) {
      console.error("Error setting current store:", error);
      setError("Failed to set active store");
    }
  };

  // Clear current store
  const clearCurrentStore = async (): Promise<void> => {
    try {
      setCurrentStoreId(null);
      setCurrentStoreState(null);
      await saveActiveStoreId(null);
      console.log("Active store cleared");
    } catch (error) {
      console.error("Error clearing current store:", error);
    }
  };

  // Initialize on component mount
  useEffect(() => {
    const initializeStore = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load all stores first
        const stores = await getAllStores();
        setAllStores(stores);

        // If no stores exist, user needs to create one
        if (stores.length === 0) {
          console.log("No stores found. User needs to create a store.");
          setIsLoading(false);
          return;
        }

        // Try to load previously active store
        const savedStoreId = await loadActiveStoreId();

        if (savedStoreId) {
          // Check if saved store still exists
          const savedStore = stores.find((s: Store) => s.id === savedStoreId);
          if (savedStore) {
            setCurrentStoreId(savedStoreId);
            setCurrentStoreState(savedStore);
            console.log(
              `Restored active store: ${savedStore.name} (ID: ${savedStoreId})`
            );
          } else {
            // Saved store no longer exists, clear it and set first available
            await saveActiveStoreId(null);
            const firstStore = stores[0];
            setCurrentStoreId(firstStore.id!);
            setCurrentStoreState(firstStore);
            await saveActiveStoreId(firstStore.id!);
            console.log(
              `Saved store not found. Set to first available: ${firstStore.name}`
            );
          }
        } else {
          // No saved store, set to first available
          const firstStore = stores[0];
          setCurrentStoreId(firstStore.id!);
          setCurrentStoreState(firstStore);
          await saveActiveStoreId(firstStore.id!);
          console.log(
            `No saved store. Set to first available: ${firstStore.name}`
          );
        }
      } catch (error) {
        console.error("Error initializing store context:", error);
        setError("Failed to initialize stores");
      } finally {
        setIsLoading(false);
      }
    };

    initializeStore();
  }, []);

  // Update current store when allStores changes (for store name updates, etc.)
  useEffect(() => {
    if (currentStoreId && allStores.length > 0) {
      const updatedStore = allStores.find(
        (s: Store) => s.id === currentStoreId
      );
      if (updatedStore) {
        setCurrentStoreState(updatedStore);
      }
    }
  }, [allStores, currentStoreId]);

  const contextValue: StoreContextType = {
    currentStoreId,
    currentStore,
    allStores,
    isLoading,
    error,
    setCurrentStore,
    refreshStores,
    clearCurrentStore,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
};

// Custom hook to use the store context
export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
};

// Utility hook to get current store ID (throws error if no store is active)
export const useCurrentStoreId = (): number => {
  const { currentStoreId } = useStore();
  if (currentStoreId === null) {
    throw new Error("No active store. Please select a store first.");
  }
  return currentStoreId;
};

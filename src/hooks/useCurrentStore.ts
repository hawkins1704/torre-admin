import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

const STORE_KEY = 'currentStoreId';

export const useCurrentStore = () => {
  const [currentStoreId, setCurrentStoreId] = useState<Id<'stores'> | null>(null);

  useEffect(() => {
    const savedStoreId = localStorage.getItem(STORE_KEY);
    if (savedStoreId) {
      setCurrentStoreId(savedStoreId as Id<'stores'>);
    }
  }, []);

  const store = useQuery(
    api.stores.getById,
    currentStoreId ? { id: currentStoreId } : 'skip'
  );

  useEffect(() => {
    if (!currentStoreId) {
      return;
    }

    if (store === null) {
      localStorage.removeItem(STORE_KEY);
      setCurrentStoreId(null);
    }
  }, [currentStoreId, store]);

  return currentStoreId;
};


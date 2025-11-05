import { useState, useEffect } from 'react';
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

  return currentStoreId;
};


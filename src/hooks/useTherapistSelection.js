import { useState, useEffect, useRef, useMemo } from 'react';
import { useShopData } from '../contexts/DataContext.jsx';

export const useTherapistSelection = (
  selectedShop, 
  initialTherapistId, 
  restoredTherapistId, 
  selectedTherapistId, 
  setSelectedTherapistId
) => {
  const { getTherapistsByShopId } = useShopData();
  const hasAutoSelectedRef = useRef(false);

  const shopTherapists = useMemo(() => {
    return selectedShop ? getTherapistsByShopId(selectedShop.id) : [];
  }, [selectedShop?.id, getTherapistsByShopId]);

  useEffect(() => {
    hasAutoSelectedRef.current = false;
  }, [selectedShop?.id]);

  useEffect(() => {
    if (selectedTherapistId || hasAutoSelectedRef.current) return;
    if (shopTherapists.length === 0) return;

    if (restoredTherapistId && !shopTherapists.some(t => t.id === restoredTherapistId)) {
      return; 
    }

    let target = null;
    
    if (restoredTherapistId) {
      target = shopTherapists.find(t => t.id === restoredTherapistId);
    }
    
    if (!target && initialTherapistId) {
      target = shopTherapists.find(t => t.id === initialTherapistId);
    }

    if (target) {
      console.log(`🤖 Auto-selected: ${target.name}`);
      setSelectedTherapistId(target.id);
      hasAutoSelectedRef.current = true;
    }
  }, [shopTherapists, initialTherapistId, restoredTherapistId, selectedTherapistId, setSelectedTherapistId]);

  return { shopTherapists };
};

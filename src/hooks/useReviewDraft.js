import { useEffect, useMemo, useRef, useState } from 'react';

const DRAFT_VERSION = 1;

export const useReviewDraft = (shopId, shopName, formState, currentTherapistId) => {
  const { storyInputs, detailedRatings, setStoryInputs, setDetailedRatings } = formState;
  
  const [restoredTherapistId, setRestoredTherapistId] = useState(null);
  const hasRestoredRef = useRef(false);
  const lastRestoredKeyRef = useRef(null);
  const migratedRef = useRef(false);

  const draftKey = useMemo(() => shopId ? `review_draft_shop_${shopId}` : 'review_draft_unassigned', [shopId]);

  useEffect(() => {
    if (!shopId || migratedRef.current) return;
    const unassigned = localStorage.getItem('review_draft_unassigned');
    const targetKey = `review_draft_shop_${shopId}`;
    if (unassigned && !localStorage.getItem(targetKey)) {
      try {
        if (JSON.parse(unassigned).v === DRAFT_VERSION) {
          console.log(`📦 Migration: Unassigned -> ${shopName}`);
          localStorage.setItem(targetKey, unassigned);
          localStorage.removeItem('review_draft_unassigned');
        }
      } catch (e) { localStorage.removeItem('review_draft_unassigned'); }
    }
    migratedRef.current = true;
  }, [shopId, shopName]);

  useEffect(() => {
    if (lastRestoredKeyRef.current === draftKey) return;
    
    lastRestoredKeyRef.current = draftKey;
    hasRestoredRef.current = false;
    setRestoredTherapistId(null);

    try {
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.v !== DRAFT_VERSION) throw new Error("Version mismatch");
        
        setStoryInputs(parsed.storyInputs);
        setDetailedRatings(parsed.detailedRatings);
        
        if (parsed.selectedTherapistId) {
          setRestoredTherapistId(parsed.selectedTherapistId);
        }
        
        console.log(`📝 Restored: ${draftKey}`);
      }
    } catch (e) {
      console.warn("Draft reset:", e);
      localStorage.removeItem(draftKey);
    } finally {
      hasRestoredRef.current = true;
    }
  }, [draftKey, setStoryInputs, setDetailedRatings]);

  useEffect(() => {
    if (!hasRestoredRef.current) return;
    const handler = setTimeout(() => {
      const data = { 
        v: DRAFT_VERSION, 
        storyInputs, 
        detailedRatings, 
        selectedTherapistId: currentTherapistId
      };
      localStorage.setItem(draftKey, JSON.stringify(data));
    }, 500);
    return () => clearTimeout(handler);
  }, [storyInputs, detailedRatings, currentTherapistId, draftKey]);

  return { 
    restoredTherapistId,
    clearDraft: () => {
      localStorage.removeItem(draftKey);
      localStorage.removeItem('review_draft_unassigned');
    }
  };
};

import { useState, useCallback } from 'react';

export const useForceUpdate = () => {
  const [updateCounter, setUpdateCounter] = useState(0);
  
  const forceUpdate = useCallback(() => {
    setUpdateCounter(prev => prev + 1);
  }, []);
  
  return { updateCounter, forceUpdate };
};

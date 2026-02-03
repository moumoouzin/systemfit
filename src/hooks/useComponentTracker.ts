import { useEffect, useRef } from 'react';

let componentCounter = 0;

export const useComponentTracker = (componentName: string) => {
  const instanceId = useRef(++componentCounter);
  
  useEffect(() => {
    // console.log(`🟢 COMPONENT MOUNT: ${componentName} #${instanceId.current}`);
    
    return () => {
      // console.log(`🔴 COMPONENT UNMOUNT: ${componentName} #${instanceId.current}`);
    };
  }, [componentName]);

  useEffect(() => {
    // console.log(`🔄 COMPONENT RENDER: ${componentName} #${instanceId.current}`);
  });

  return instanceId.current;
};

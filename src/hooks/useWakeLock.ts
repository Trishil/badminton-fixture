import { useState, useEffect, useCallback } from 'react';

export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('wakeLock' in navigator);
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return false;
    try {
      const lock = await navigator.wakeLock.request('screen');
      setIsLocked(true);
      lock.addEventListener('release', () => {
        setIsLocked(false);
      });
      return true;
    } catch (err) {
      console.warn('Wake Lock request failed:', err);
      setIsLocked(false);
      return false;
    }
  }, []);

  return {
    isSupported,
    isLocked,
    requestWakeLock,
  };
}

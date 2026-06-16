import { useState, useEffect, useCallback, useRef, Dispatch, SetStateAction } from 'react';

function getStorageKey(userId: string, field: string): string {
  return `myasesoria_${userId}_${field}`;
}

export function usePersistedState<T>(
  userId: string | undefined,
  field: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const prevUserId = useRef(userId);

  const [state, setState] = useState<T>(() => {
    if (!userId) return defaultValue;
    const key = getStorageKey(userId, field);
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as T;
      }
    } catch {}
    return defaultValue;
  });

  // When userId changes, reload data from the new user's storage
  useEffect(() => {
    if (userId && userId !== prevUserId.current) {
      prevUserId.current = userId;
      const key = getStorageKey(userId, field);
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          setState(JSON.parse(stored) as T);
        } else {
          setState(defaultValue);
        }
      } catch {
        setState(defaultValue);
      }
    }
  }, [userId, field]);

  // Persist state changes to localStorage (but not on userId change)
  useEffect(() => {
    if (!userId) return;
    if (userId !== prevUserId.current) return;
    const key = getStorageKey(userId, field);
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [userId, field, state]);

  const setAndPersist: Dispatch<SetStateAction<T>> = useCallback((value) => {
    setState(value);
  }, []);

  return [state, setAndPersist];
}
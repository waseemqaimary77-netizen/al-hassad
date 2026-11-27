import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Action, AppState } from '../types/olympiad';
import { storage } from '../utils/storage';
import { appReducer } from '../utils/tournament';

interface AppStoreContextValue {
  state: AppState;
  dispatch: (action: Action) => AppState;
  saveFailed: boolean;
}

const AppStoreContext = createContext<AppStoreContextValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => storage.load());
  const [saveFailed, setSaveFailed] = useState(false);
  const stateRef = useRef(state);

  const dispatch = useCallback((action: Action) => {
    const nextState = appReducer(stateRef.current, action);
    if (nextState !== stateRef.current) {
      stateRef.current = nextState;
      setState(nextState);
      setSaveFailed(!storage.save(nextState));
    }
    return nextState;
  }, []);

  useEffect(
    () =>
      storage.subscribe((nextState) => {
        stateRef.current = nextState;
        setState(nextState);
      }),
    []
  );

  const value = useMemo(
    () => ({ state, dispatch, saveFailed }),
    [state, dispatch, saveFailed]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStoreContextValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error('AppStoreProvider مفقود');
  }
  return ctx;
}

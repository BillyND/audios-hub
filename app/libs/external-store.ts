import { useSyncExternalStore } from "react";

type State = object;
type Selector<T> = (state: T) => unknown;
type Listener = () => void;

type Store<T> = {
  getState: () => T;
  setState: (fn: (state: T) => T, withoutRender?: boolean) => void;
  subscribe: (listener: Listener) => () => void;
  resetState: () => void;
};

export const createStore = <T extends State>(initialState: T): Store<T> => {
  let state = initialState;
  const getState = () => state;
  const listeners = new Set<Listener>();

  const setState = (fn: (state: T) => T, withoutRender?: boolean) => {
    state = fn(state);

    if (!withoutRender) {
      listeners.forEach((listener) => listener());
    }
  };

  const resetState = () => {
    state = initialState;
  };

  const subscribe = (listener: Listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  return { getState, setState, subscribe, resetState };
};

export const useStore = <T extends State>(
  store: Store<T>,
  selector: Selector<T>
) => {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );
};

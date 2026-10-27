import { useReducer } from 'react';
import type { ReactNode } from 'react';
import type { AlgorithmLogEntry } from '../types';
import {
  AppContext,
  appReducer,
  buildInitialState,
  ticketQueue,
  passengerList,
  bookingBST,
} from './AppContext';

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, undefined, buildInitialState);

  const addLog = (operation: string, detail: string, type: AlgorithmLogEntry['type']) => {
    dispatch({ type: 'ADD_LOG', payload: { operation, detail, type } });
  };

  return (
    <AppContext.Provider value={{ state, dispatch, addLog, ticketQueue, passengerList, bst: bookingBST }}>
      {children}
    </AppContext.Provider>
  );
}

export default AppProvider;

import { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type {
  User, Booking, TicketRequest, Passenger, Flight, Seat,
  SeatPreferences, AlgorithmLogEntry, DsaStats
} from '../types';
import { Queue } from '../algorithms/Queue';
import { LinkedList } from '../algorithms/LinkedList';
import { BinarySearchTree } from '../algorithms/BST';
import { MOCK_PASSENGERS, SAMPLE_BOOKINGS, bookingIdToKey } from '../data/passengers';
import { generateLogId } from '../utils/idGenerator';
import { bookingStorage, logStorage, userStorage } from '../services/storageService';

// Module-level DSA singletons - live outside React, mutated by reducer
const ticketQueue  = new Queue<TicketRequest>();
const passengerList = new LinkedList<Passenger>();
const bookingBST   = new BinarySearchTree();

// Guard so seed only runs once even in dev double-invocation
let seeded = false;

// ---------------------------------------------------------------
// State
// ---------------------------------------------------------------
interface AppState {
  user: User | null;
  bookings: Booking[];
  queueSnapshot: TicketRequest[];
  linkedListSnapshot: Passenger[];
  bstSnapshot: number[];
  searchedFlights: Flight[];
  selectedFlight: Flight | null;
  selectedSeat: Seat | null;
  lastRecommendation: { seat: Seat; reasons: string[] } | null;
  preferences: SeatPreferences;
  algorithmLog: AlgorithmLogEntry[];
  dsaStats: DsaStats;
}

// ---------------------------------------------------------------
// Actions
// ---------------------------------------------------------------
type Action =
  | { type: 'LOGIN';          payload: User }
  | { type: 'LOGOUT' }
  | { type: 'ADD_BOOKING';    payload: Booking }
  | { type: 'CANCEL_BOOKING'; payload: string }
  | { type: 'QUEUE_ENQUEUE';  payload: TicketRequest }
  | { type: 'QUEUE_DEQUEUE' }
  | { type: 'QUEUE_CLEAR' }
  | { type: 'LL_INSERT';      payload: Passenger }
  | { type: 'LL_DELETE';      payload: string }
  | { type: 'LL_CLEAR' }
  | { type: 'BST_INSERT';     payload: number }
  | { type: 'BST_CLEAR' }
  | { type: 'SET_SEARCHED_FLIGHTS'; payload: Flight[] }
  | { type: 'SELECT_FLIGHT';  payload: Flight }
  | { type: 'SELECT_SEAT';    payload: Seat }
  | { type: 'SET_RECOMMENDATION'; payload: { seat: Seat; reasons: string[] } }
  | { type: 'SET_PREFERENCES'; payload: SeatPreferences }
  | { type: 'ADD_LOG';        payload: Omit<AlgorithmLogEntry, 'id' | 'timestamp'> }
  | { type: 'INCREMENT_SORT' }
  | { type: 'INCREMENT_AI' };

// ---------------------------------------------------------------
// Initial state builder
// ---------------------------------------------------------------
function buildInitialState(): AppState {
  if (!seeded) {
    seeded = true;
    MOCK_PASSENGERS.forEach(p => passengerList.insertAtTail(p));
    SAMPLE_BOOKINGS.forEach(b => bookingBST.insert(bookingIdToKey(b.bookingId), b as unknown as Record<string, unknown>));
  }

  const storedUser     = userStorage.get();
  const storedBookings = bookingStorage.get() || SAMPLE_BOOKINGS;
  const storedLog      = logStorage.get() || [];

  return {
    user: storedUser,
    bookings: storedBookings,
    queueSnapshot: ticketQueue.toArray(),
    linkedListSnapshot: passengerList.toArray(),
    bstSnapshot: bookingBST.inorderTraversal(),
    searchedFlights: [],
    selectedFlight: null,
    selectedSeat: null,
    lastRecommendation: null,
    preferences: { window: true, aisle: false, extraLegroom: false, frontRow: false, quietArea: false },
    algorithmLog: storedLog,
    dsaStats: {
      queueRequests: 0,
      passengerRecords: passengerList.toArray().length,
      bstNodes: bookingBST.inorderTraversal().length,
      flightsSorted: 0,
      aiRecommendations: 0,
      searchComparisons: 0,
      waitingListCount: 0,
    },
  };
}

// ---------------------------------------------------------------
// Reducer (pure - reads singletons' new state after mutation)
// ---------------------------------------------------------------
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {

    case 'LOGIN':
      userStorage.set(action.payload);
      return { ...state, user: action.payload };

    case 'LOGOUT':
      userStorage.clear();
      return { ...state, user: null };

    case 'ADD_BOOKING': {
      const newBookings = [action.payload, ...state.bookings];
      bookingStorage.set(newBookings);
      passengerList.insertAtTail(action.payload.passenger);
      bookingBST.insert(bookingIdToKey(action.payload.bookingId), action.payload as unknown as Record<string, unknown>);
      return {
        ...state,
        bookings: newBookings,
        linkedListSnapshot: passengerList.toArray(),
        bstSnapshot: bookingBST.inorderTraversal(),
        dsaStats: {
          ...state.dsaStats,
          passengerRecords: passengerList.toArray().length,
          bstNodes: bookingBST.inorderTraversal().length,
        },
      };
    }

    case 'CANCEL_BOOKING': {
      const newBookings = state.bookings.map(b =>
        b.bookingId === action.payload ? { ...b, status: 'cancelled' as const } : b
      );
      bookingStorage.set(newBookings);
      passengerList.deleteByKey(p => p.bookingId === action.payload);
      return {
        ...state,
        bookings: newBookings,
        linkedListSnapshot: passengerList.toArray(),
        dsaStats: { ...state.dsaStats, passengerRecords: passengerList.toArray().length },
      };
    }

    case 'QUEUE_ENQUEUE':
      ticketQueue.enqueue(action.payload);
      return {
        ...state,
        queueSnapshot: ticketQueue.toArray(),
        dsaStats: { ...state.dsaStats, queueRequests: state.dsaStats.queueRequests + 1 },
      };

    case 'QUEUE_DEQUEUE':
      ticketQueue.dequeue();
      return { ...state, queueSnapshot: ticketQueue.toArray() };

    case 'QUEUE_CLEAR':
      ticketQueue.clear();
      return { ...state, queueSnapshot: [] };

    case 'LL_INSERT':
      passengerList.insertAtTail(action.payload);
      return {
        ...state,
        linkedListSnapshot: passengerList.toArray(),
        dsaStats: { ...state.dsaStats, passengerRecords: passengerList.toArray().length },
      };

    case 'LL_DELETE':
      passengerList.deleteByKey(p => p.passengerId === action.payload);
      return {
        ...state,
        linkedListSnapshot: passengerList.toArray(),
        dsaStats: { ...state.dsaStats, passengerRecords: passengerList.toArray().length },
      };

    case 'LL_CLEAR':
      passengerList.clear();
      return { ...state, linkedListSnapshot: [], dsaStats: { ...state.dsaStats, passengerRecords: 0 } };

    case 'BST_INSERT':
      bookingBST.insert(action.payload, {});
      return {
        ...state,
        bstSnapshot: bookingBST.inorderTraversal(),
        dsaStats: { ...state.dsaStats, bstNodes: bookingBST.inorderTraversal().length },
      };

    case 'BST_CLEAR':
      bookingBST.clear();
      return { ...state, bstSnapshot: [], dsaStats: { ...state.dsaStats, bstNodes: 0 } };

    case 'SET_SEARCHED_FLIGHTS':
      return { ...state, searchedFlights: action.payload };

    case 'SELECT_FLIGHT':
      return { ...state, selectedFlight: action.payload, selectedSeat: null };

    case 'SELECT_SEAT':
      return { ...state, selectedSeat: action.payload };

    case 'SET_RECOMMENDATION':
      return { ...state, lastRecommendation: action.payload };

    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload };

    case 'INCREMENT_SORT':
      return { ...state, dsaStats: { ...state.dsaStats, flightsSorted: state.dsaStats.flightsSorted + 1 } };

    case 'INCREMENT_AI':
      return { ...state, dsaStats: { ...state.dsaStats, aiRecommendations: state.dsaStats.aiRecommendations + 1 } };

    case 'ADD_LOG': {
      const entry: AlgorithmLogEntry = {
        id: generateLogId(),
        timestamp: new Date(),
        ...action.payload,
      };
      const newLog = [entry, ...state.algorithmLog].slice(0, 50);
      logStorage.add(entry);
      return { ...state, algorithmLog: newLog };
    }

    default:
      return state;
  }
}

// ---------------------------------------------------------------
// Context
// ---------------------------------------------------------------
interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addLog: (operation: string, detail: string, type: AlgorithmLogEntry['type']) => void;
  ticketQueue: Queue<TicketRequest>;
  passengerList: LinkedList<Passenger>;
  bst: BinarySearchTree;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

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

export function useApp() {
  const ctx = useContext(AppContext);
  if (ctx === undefined) {
    throw new Error('useApp must be used inside <AppProvider>');
  }
  return ctx;
}

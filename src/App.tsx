import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppProvider';
import { useApp } from './context/AppContext';
import AppLayout from './layouts/AppLayout';

import LandingPage          from './pages/LandingPage';
import LoginPage            from './pages/LoginPage';
import UserDashboard        from './pages/UserDashboard';
import FlightSearch         from './pages/FlightSearch';
import FlightResults        from './pages/FlightResults';
import QueuePage            from './pages/QueuePage';
import SeatSelection        from './pages/SeatSelection';
import AIRecommendation     from './pages/AIRecommendation';
import BookingConfirmation  from './pages/BookingConfirmation';
import MyBookings           from './pages/MyBookings';
import LinkedListPage       from './pages/LinkedListPage';
import BSTPage              from './pages/BSTPage';
import SelectionSortPage    from './pages/SelectionSortPage';
import SearchPerformanceLab from './pages/SearchPerformanceLab';
import DSADashboard         from './pages/DSADashboard';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  if (!state.user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard"              element={<UserDashboard />} />
        <Route path="/flights/search"         element={<FlightSearch />} />
        <Route path="/flights/results"        element={<FlightResults />} />
        <Route path="/flights/:flightNumber/seats" element={<SeatSelection />} />
        <Route path="/recommendation"         element={<AIRecommendation />} />
        <Route path="/dsa/ai"                 element={<AIRecommendation />} />
        <Route path="/booking/confirm"        element={<BookingConfirmation />} />
        <Route path="/bookings"               element={<MyBookings />} />
        <Route path="/dsa/queue"              element={<QueuePage />} />
        <Route path="/dsa/linked-list"        element={<LinkedListPage />} />
        <Route path="/dsa/bst"               element={<BSTPage />} />
        <Route path="/dsa/sort"              element={<SelectionSortPage />} />
        <Route path="/dsa/search-lab"        element={<SearchPerformanceLab />} />
        <Route path="/dsa/dashboard"         element={<DSADashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}


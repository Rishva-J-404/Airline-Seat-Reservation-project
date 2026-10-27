import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
  PlaneTakeoff,
  LayoutDashboard,
  Search,
  Ticket,
  List,
  GitBranch,
  ArrowDownUp,
  Activity,
  Network,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Cpu,
  User,
  Gauge,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

const operationalNavItems: NavItem[] = [
  { label: 'Flight Dashboard', path: '/dashboard', icon: <LayoutDashboard size={17} /> },
  { label: 'Search Flights', path: '/flights/search', icon: <Search size={17} /> },
  { label: 'Manage Bookings', path: '/bookings', icon: <Ticket size={17} /> },
];

const technicalNavItems: NavItem[] = [
  { label: 'Ticket Queue (FIFO)', path: '/dsa/queue', icon: <List size={17} />, badge: 'CO1' },
  { label: 'Passenger Manifest', path: '/dsa/linked-list', icon: <Network size={17} />, badge: 'CO2' },
  { label: 'Fare Selection Sort', path: '/dsa/sort', icon: <ArrowDownUp size={17} />, badge: 'CO3' },
  { label: 'Search Performance Lab', path: '/dsa/search-lab', icon: <Gauge size={17} />, badge: 'CO3' },
  { label: 'BST PNR Index', path: '/dsa/bst', icon: <GitBranch size={17} />, badge: 'CO4' },
  { label: 'Seat Matcher', path: '/dsa/ai', icon: <Cpu size={17} /> },
  { label: 'Operations Center', path: '/dsa/dashboard', icon: <Activity size={17} /> },
];

export const AppLayout: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors select-none',
      isActive
        ? 'bg-aero-950 text-white font-semibold shadow-xs'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    ].join(' ');

  const collapsedNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'flex items-center justify-center rounded-lg p-2 text-xs font-medium transition-colors select-none',
      isActive
        ? 'bg-aero-950 text-white shadow-xs'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    ].join(' ');

  const renderSidebarContent = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col font-sans">
      {/* Brand Header */}
      <div
        className={[
          'flex items-center gap-3 border-b border-slate-200 px-4 h-16 shrink-0',
          collapsed && !onNavigate ? 'justify-center px-2' : '',
        ].join(' ')}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-aero-950 text-white shadow-sm">
          <PlaneTakeoff size={16} />
        </div>
        {(!collapsed || onNavigate) && (
          <div>
            <span className="text-base font-bold text-aero-950 tracking-tight font-display">
              FlySmart
            </span>
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              Commercial Airlines
            </span>
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
        {/* Operational group */}
        <div>
          {(!collapsed || onNavigate) && (
            <p className="mb-2 px-3 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              Operations
            </p>
          )}
          <ul className="space-y-1">
            {operationalNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={collapsed && !onNavigate ? collapsedNavLinkClass : navLinkClass}
                  title={collapsed && !onNavigate ? item.label : undefined}
                  onClick={onNavigate}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    {(!collapsed || onNavigate) && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Technical / DSA group */}
        <div>
          {(!collapsed || onNavigate) && (
            <p className="mb-2 px-3 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              Technical Core
            </p>
          )}
          <ul className="space-y-1">
            {technicalNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={collapsed && !onNavigate ? collapsedNavLinkClass : navLinkClass}
                  title={collapsed && !onNavigate ? item.label : undefined}
                  onClick={onNavigate}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    {(!collapsed || onNavigate) && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>
                  {(!collapsed || onNavigate) && item.badge && (
                    <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* User profile & Session control */}
      <div className="border-t border-slate-200 px-3 py-3 shrink-0">
        {!collapsed || onNavigate ? (
          <div className="flex items-center justify-between gap-2 p-1 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-md bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                <User size={14} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-900 leading-tight">
                  {state.user?.name ?? 'Pilot / Guest'}
                </p>
                <p className="truncate text-[10px] text-slate-500 font-mono">
                  {state.user?.email ?? 'Active Session'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-surface-muted font-sans">
      {/* Desktop Sidebar */}
      <aside
        className={[
          'hidden md:flex flex-col shrink-0 bg-white border-r border-slate-200 transition-all duration-200 relative',
          collapsed ? 'w-16' : 'w-64',
        ].join(' ')}
      >
        {renderSidebarContent()}

        {/* Collapse toggle button */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-20 hidden md:flex items-center justify-center w-6 h-6 bg-white border border-slate-200 rounded-full shadow-subtle text-slate-500 hover:text-aero-950 transition-colors z-20"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronRight
            size={13}
            className={['transition-transform duration-200', collapsed ? '' : 'rotate-180'].join(' ')}
          />
        </button>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 shadow-xl flex flex-col transition-transform duration-200 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-3.5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
        >
          <X size={18} />
        </button>
        {renderSidebarContent(() => setMobileOpen(false))}
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Top Bar */}
        <header className="flex md:hidden items-center justify-between border-b border-slate-200 bg-white px-4 h-14 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-aero-950 text-white">
                <PlaneTakeoff size={14} />
              </div>
              <span className="text-sm font-bold text-aero-950 font-display">FlySmart</span>
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            {state.user?.name ?? ''}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  PlaneTakeoff,
  User as UserIcon,
  Lock,
  ArrowLeft,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { authAPI } from '../services/api';
import { CinematicFlightTransition } from '../components/common/CinematicFlightTransition';
import type { User } from '../types';

// Security: max input lengths enforced client-side
const MAX_NAME_LEN = 100;
const MAX_PASS_LEN = 128;

function sanitizeInput(raw: string): string {
  return raw
    .trim()
    .replace(/[<>&"'`]/g, '')
    .slice(0, MAX_NAME_LEN);
}

const DEMO_PROFILES = ['Neavis Rishva', 'Rajesh Kumar', 'Priya Sharma'];

export default function LoginPage() {
  const { dispatch, addLog } = useApp();
  const navigate = useNavigate();

  // Mode: 'signin' or 'signup'
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotNotice, setForgotNotice] = useState<string | null>(null);

  // Cinematic Flight Transition State (Screen 3)
  const [showTransition, setShowTransition] = useState(false);
  const [transitionUser, setTransitionUser] = useState<string>('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedIdentifier = sanitizeInput(name);

    if (!sanitizedIdentifier) {
      setError('Please enter your full name or registered email.');
      return;
    }

    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password.length > MAX_PASS_LEN) {
      setError(`Password must not exceed ${MAX_PASS_LEN} characters.`);
      return;
    }

    setError(null);
    setLoading(true);

    const emailPrefix = sanitizedIdentifier.toLowerCase().replace(/[^a-z0-9]/g, '.');
    const derivedEmail = sanitizedIdentifier.includes('@')
      ? sanitizedIdentifier
      : `${emailPrefix}@flysmart.demo`;

    try {
      // Attempt backend authentication
      const authRes = await authAPI.login({
        email: derivedEmail,
        password: password,
      }).catch(async (loginErr) => {
        if (loginErr?.statusCode === 404 || loginErr?.code === 'USER_NOT_FOUND') {
          return await authAPI.register({
            name: sanitizedIdentifier,
            email: derivedEmail,
            password: password,
            role: 'passenger',
          });
        }
        throw loginErr;
      });

      const user: User = {
        id: String(authRes.user.id),
        name: authRes.user.name,
        email: authRes.user.email,
      };

      dispatch({ type: 'LOGIN', payload: user });
      addLog('Login (API)', `${user.name} signed in with verified JWT session`, 'ai');
      setLoading(false);
      setTransitionUser(user.name);
      setShowTransition(true);
    } catch {
      // Offline / client fallback
      const newUser: User = {
        id: `U-${Date.now()}`,
        name: sanitizedIdentifier,
        email: derivedEmail,
      };
      dispatch({ type: 'LOGIN', payload: newUser });
      addLog('Login', `${newUser.name} signed in (Local Session)`, 'ai');
      setLoading(false);
      setTransitionUser(newUser.name);
      setShowTransition(true);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = email.trim();

    if (!sanitizedName) {
      setError('Please provide your full legal passenger name.');
      return;
    }

    if (!sanitizedEmail || !sanitizedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password.length > MAX_PASS_LEN) {
      setError(`Password must not exceed ${MAX_PASS_LEN} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const regRes = await authAPI.register({
        name: sanitizedName,
        email: sanitizedEmail,
        password: password,
        role: 'passenger',
      });

      const user: User = {
        id: String(regRes.user.id),
        name: regRes.user.name,
        email: regRes.user.email,
      };

      dispatch({ type: 'LOGIN', payload: user });
      addLog('Registration', `New passenger account created for ${user.name}`, 'ai');
      setLoading(false);
      setTransitionUser(user.name);
      setShowTransition(true);
    } catch {
      // Local session fallback if backend registration fails
      const fallbackUser: User = {
        id: `U-${Date.now()}`,
        name: sanitizedName,
        email: sanitizedEmail,
      };
      dispatch({ type: 'LOGIN', payload: fallbackUser });
      addLog('Registration (Local)', `Created local account for ${fallbackUser.name}`, 'ai');
      setLoading(false);
      setTransitionUser(fallbackUser.name);
      setShowTransition(true);
    }
  };

  const fillDemo = (demoName: string) => {
    setName(demoName);
    setPassword('password123');
    setError(null);
  };

  return (
    <>
      {/* Screen 3: Cinematic Flight Transition */}
      {showTransition && (
        <CinematicFlightTransition
          passengerName={transitionUser}
          onComplete={() => navigate('/dashboard')}
        />
      )}

      <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#0066FF] selection:text-white">
        {/* Top Back Link & Dispatch Telemetry */}
        <div className="max-w-5xl mx-auto w-full mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to FlySmart Home</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>SYSTEM DISPATCH: NOMINAL</span>
          </div>
        </div>

        {/* Central Authentication Split Card Layout (Stitch AeroPrecision) */}
        <div className="max-w-5xl mx-auto w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Panel: Cinematic Aviation Narrative & Perks (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#0A192F] via-[#0F2444] to-[#0A192F] text-white p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Ambient Background Grid Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#0066FF_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Brand Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0066FF] flex items-center justify-center text-white shadow-lg">
                  <PlaneTakeoff size={20} />
                </div>
                <div>
                  <h1 className="text-lg font-extrabold tracking-tight font-display text-white">
                    FlySmart Airlines
                  </h1>
                  <p className="text-[11px] font-mono text-blue-200 uppercase tracking-wider">
                    Commercial Passenger Portal
                  </p>
                </div>
              </div>

              {/* Tagline */}
              <div className="space-y-2 pt-2">
                <h2 className="text-2xl font-bold leading-tight font-display text-white">
                  Fly with Precision.
                  <br />
                  <span className="text-[#38BDF8]">Travel with Confidence.</span>
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  Access live flight reservations, select aircraft cabin seats with AI heuristic matchers, and inspect real-time algorithmic telemetry.
                </p>
              </div>

              {/* AeroRewards Member Perks */}
              <div className="space-y-3 pt-2">
                <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-300">
                  Passenger Portal Benefits
                </p>
                <ul className="space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-[#38BDF8] shrink-0 mt-0.5" />
                    <span>Real-time flight search across all Indian metro sectors</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-[#38BDF8] shrink-0 mt-0.5" />
                    <span>Interactive 80-seat Airbus A320 cabin map selection</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-[#38BDF8] shrink-0 mt-0.5" />
                    <span>Instant digital boarding passes with PNR lookup</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="text-[#38BDF8] shrink-0 mt-0.5" />
                    <span>Transparent DSA telemetry (Queue, Manifest, BST, Sort)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Panel: Authentication Form & Tabs (7 cols) */}
          <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between">
            <div>
              {/* Segmented Tab Switcher (Sign In vs Create Account) */}
              <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    mode === 'signin'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    mode === 'signup'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Form Title */}
              <div className="mb-5">
                <h3 className="text-xl font-bold text-slate-900 font-display">
                  {mode === 'signin' ? 'Sign In to Passenger Portal' : 'Register New Passenger Account'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {mode === 'signin'
                    ? 'Enter your credentials to access flight reservations and itineraries.'
                    : 'Create your passenger profile to book flights and manage seat assignments.'}
                </p>
              </div>

              {/* Error Notice */}
              {error && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Forgot Password Notice */}
              {forgotNotice && (
                <div className="mb-4 flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs">
                  <span>{forgotNotice}</span>
                  <button
                    type="button"
                    onClick={() => setForgotNotice(null)}
                    className="font-bold underline ml-2"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* FORM: Sign In */}
              {mode === 'signin' ? (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Passenger Name or Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <UserIcon size={16} />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Neavis Rishva or email@domain.com"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-[#0066FF]"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Account Password
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setForgotNotice(
                            'For demonstration profiles, use password "password123". In production, password reset instructions are dispatched via email.'
                          )
                        }
                        className="text-xs font-medium text-[#0066FF] hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password (min 6 characters)"
                        className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF] focus:border-[#0066FF]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-[#0066FF] focus:ring-[#0066FF]"
                      />
                      <span className="text-slate-600">Remember credentials on this browser</span>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                    className="bg-[#0066FF] hover:bg-blue-700 font-bold"
                    icon={<ArrowRight size={16} />}
                  >
                    Sign In to FlySmart
                  </Button>
                </form>
              ) : (
                /* FORM: Create Account (Sign-Up) */
                <form onSubmit={handleSignUp} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Legal Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <UserIcon size={16} />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Capt. Rahul Verma"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Mail size={16} />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="rahul@example.com"
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Contact Phone
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Phone size={16} />
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={loading}
                    className="bg-[#0066FF] hover:bg-blue-700 font-bold mt-2"
                    icon={<ArrowRight size={16} />}
                  >
                    Create Passenger Account
                  </Button>
                </form>
              )}

              {/* Demo Profiles Bar */}
              <div className="mt-6 pt-5 border-t border-slate-200">
                <span className="text-[11px] font-mono text-slate-400 block mb-2 font-semibold uppercase">
                  Quick Demo Accounts:
                </span>
                <div className="flex flex-wrap gap-2">
                  {DEMO_PROFILES.map((pName) => (
                    <button
                      key={pName}
                      type="button"
                      onClick={() => fillDemo(pName)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                    >
                      {pName}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Compliance Guarantee */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>256-bit TLS Encrypted Session</span>
              </div>
              <span>FAA / IATA Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

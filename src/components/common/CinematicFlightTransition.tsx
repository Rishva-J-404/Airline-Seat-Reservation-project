import React, { useEffect, useRef, useState } from 'react';
import { Plane, ChevronRight, ShieldCheck } from 'lucide-react';

interface CinematicFlightTransitionProps {
  passengerName: string;
  onComplete: () => void;
}

export const CinematicFlightTransition: React.FC<CinematicFlightTransitionProps> = ({
  passengerName,
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fadingOut, setFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      onComplete();
    }
  }, [onComplete]);

  // Main Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let startTime: number | null = null;
    const TOTAL_DURATION = 4800; // 4.8 seconds

    // Set high-DPI canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Generate stars
    const stars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];
    const numStars = Math.min(180, Math.floor(window.innerWidth / 10));
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * (window.innerHeight * 0.8),
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 0.02 + 0.005,
      });
    }

    // Contrail particles
    const contrails: { x: number; y: number; radius: number; alpha: number }[] = [];

    const render = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const t = Math.min(1, elapsed / TOTAL_DURATION);

      setProgress(Math.round(t * 100));

      const width = canvas.width;
      const height = canvas.height;

      // 1. Deep night sky background with atmospheric gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#020617'); // Pitch space dark
      skyGrad.addColorStop(0.5, '#050D1A'); // Deep stratosphere
      skyGrad.addColorStop(0.85, '#0A192F'); // Deep Aero Navy
      skyGrad.addColorStop(1, '#0C203F'); // Soft horizon blue
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle earth curve glow at bottom
      const earthGrad = ctx.createRadialGradient(
        width / 2,
        height * 1.6,
        height * 0.5,
        width / 2,
        height * 1.6,
        height * 0.95
      );
      earthGrad.addColorStop(0, 'rgba(0, 102, 255, 0.12)');
      earthGrad.addColorStop(1, 'rgba(0, 102, 255, 0)');
      ctx.fillStyle = earthGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Twinkling stars
      stars.forEach((star) => {
        const twinkle = Math.sin(timestamp * star.speed) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(240, 245, 255, ${star.alpha * twinkle})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Aircraft Flight Path Physics (Cubic Bezier trajectory)
      // Enters from lower left (x: -5%, y: 90%), ascends toward center (x: 48%, y: 52%), cruises up and right to distance (x: 108%, y: 15%)
      const p0 = { x: -width * 0.08, y: height * 0.88 };
      const p1 = { x: width * 0.28, y: height * 0.68 };
      const p2 = { x: width * 0.62, y: height * 0.42 };
      const p3 = { x: width * 1.08, y: height * 0.12 };

      // Bezier point computation
      const u = 1 - t;
      const planeX =
        u * u * u * p0.x +
        3 * u * u * t * p1.x +
        3 * u * t * t * p2.x +
        t * t * t * p3.x;
      const planeY =
        u * u * u * p0.y +
        3 * u * u * t * p1.y +
        3 * u * t * t * p2.y +
        t * t * t * p3.y;

      // Tangent / flight angle
      const dx =
        3 * u * u * (p1.x - p0.x) +
        6 * u * t * (p2.x - p1.x) +
        3 * t * t * (p3.x - p2.x);
      const dy =
        3 * u * u * (p1.y - p0.y) +
        6 * u * t * (p2.y - p1.y) +
        3 * t * t * (p3.y - p2.y);
      const angle = Math.atan2(dy, dx);

      // Scale: starts medium, enlarges during flyby, scales smaller into the distance
      const scaleCurve =
        t < 0.45 ? 0.75 + (t / 0.45) * 0.45 : 1.2 - ((t - 0.45) / 0.55) * 0.65;
      const currentScale = Math.max(0.4, scaleCurve);

      // 4. Generate Contrail behind engines
      if (t > 0.05 && t < 0.95 && Math.random() < 0.8) {
        contrails.push({
          x: planeX - Math.cos(angle) * 45 * currentScale,
          y: planeY - Math.sin(angle) * 45 * currentScale,
          radius: 3 * currentScale,
          alpha: 0.35,
        });
      }

      // Render expanding contrails
      for (let i = contrails.length - 1; i >= 0; i--) {
        const c = contrails[i];
        c.radius += 0.35;
        c.alpha -= 0.0035;
        if (c.alpha <= 0) {
          contrails.splice(i, 1);
          continue;
        }
        ctx.fillStyle = `rgba(220, 235, 255, ${c.alpha})`;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5. Draw Commercial Passenger Airliner (Realistic Vector)
      ctx.save();
      ctx.translate(planeX, planeY);
      ctx.rotate(angle);
      ctx.scale(currentScale, currentScale);

      // Aircraft Fuselage & Wings
      // Shadow / soft ambient glow
      ctx.shadowColor = 'rgba(0, 102, 255, 0.4)';
      ctx.shadowBlur = 16;

      // Fuselage Body
      ctx.fillStyle = '#F8FAFC'; // Aviation white
      ctx.beginPath();
      ctx.moveTo(42, 0); // Nose cone
      ctx.quadraticCurveTo(20, -7, -25, -7);
      ctx.lineTo(-42, -5);
      ctx.lineTo(-50, 0); // Tail cone
      ctx.lineTo(-42, 5);
      ctx.lineTo(-25, 7);
      ctx.quadraticCurveTo(20, 7, 42, 0);
      ctx.closePath();
      ctx.fill();

      // Cockpit Windshield (Glossy glass)
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.moveTo(34, -2.5);
      ctx.lineTo(26, -5);
      ctx.lineTo(26, 5);
      ctx.lineTo(34, 2.5);
      ctx.closePath();
      ctx.fill();

      // Main Swept Wings
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.moveTo(6, -6);
      ctx.lineTo(-14, -48); // Left wingtip
      ctx.lineTo(-22, -48);
      ctx.lineTo(-14, -6);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(6, 6);
      ctx.lineTo(-14, 48); // Right wingtip
      ctx.lineTo(-22, 48);
      ctx.lineTo(-14, 6);
      ctx.closePath();
      ctx.fill();

      // Winglet Accents (FlySmart Azure)
      ctx.fillStyle = '#0066FF';
      ctx.fillRect(-22, -50, 8, 4);
      ctx.fillRect(-22, 46, 8, 4);

      // Horizontal Stabilizers (Tail Wings)
      ctx.fillStyle = '#CBD5E1';
      ctx.beginPath();
      ctx.moveTo(-36, -3);
      ctx.lineTo(-48, -18);
      ctx.lineTo(-52, -18);
      ctx.lineTo(-44, -3);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-36, 3);
      ctx.lineTo(-48, 18);
      ctx.lineTo(-52, 18);
      ctx.lineTo(-44, 3);
      ctx.closePath();
      ctx.fill();

      // Jet Engines (Turbofans on pylons)
      ctx.fillStyle = '#475569';
      ctx.fillRect(-6, -22, 16, 7);
      ctx.fillRect(-6, 15, 16, 7);

      // Jet Exhaust Glow
      ctx.fillStyle = 'rgba(255, 180, 50, 0.7)';
      ctx.beginPath();
      ctx.arc(-7, -18.5, 3.5, 0, Math.PI * 2);
      ctx.arc(-7, 18.5, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // 6. Navigation Lights & Anti-Collision Beacon Strobes
      // Port wingtip: Constant Red
      ctx.fillStyle = '#EF4444';
      ctx.shadowColor = '#EF4444';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(-18, -48, 3, 0, Math.PI * 2);
      ctx.fill();

      // Starboard wingtip: Constant Green
      ctx.fillStyle = '#10B981';
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(-18, 48, 3, 0, Math.PI * 2);
      ctx.fill();

      // White Strobe Beacon (Flashes at 1.2Hz)
      const strobeTime = Math.floor(timestamp / 750) % 2 === 0;
      if (strobeTime) {
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(-50, 0, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Check for completion
      if (t < 1) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        setFadingOut(true);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setFadingOut(true);
    setTimeout(onComplete, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden bg-[#020617] text-white font-sans transition-opacity duration-500 ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      role="dialog"
      aria-label="Flight Departure Transition"
    >
      {/* Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Top Telemetry Overlay */}
      <header className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0066FF] flex items-center justify-center text-white shadow-lg">
            <Plane size={18} className="transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-wide font-display text-white">
                FLYSIGNAL DISPATCH
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              Commercial Flight FS-201 • Transponder 4281
            </p>
          </div>
        </div>

        {/* Skip Transition Button */}
        <button
          onClick={handleSkip}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-slate-200 transition-colors backdrop-blur-md"
          title="Proceed directly to flight dashboard"
        >
          <span>Skip to Dashboard</span>
          <ChevronRight size={14} />
        </button>
      </header>

      {/* Bottom Telemetry HUD Bar */}
      <footer className="absolute bottom-0 inset-x-0 p-6 z-10">
        <div className="max-w-4xl mx-auto rounded-xl bg-slate-900/60 border border-white/10 p-4 backdrop-blur-md shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono">
                Authentication Confirmed: <span className="text-white font-bold">{passengerName}</span>
              </p>
              <p className="text-[11px] text-slate-500">
                Initializing flight schedules, cabin manifests, and algorithmic ticket queues...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="text-right hidden md:block">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono block">
                FLIGHT LEVEL
              </span>
              <span className="text-xs font-mono font-bold text-white">FL320 • 32,000 FT</span>
            </div>
            <div className="w-32 bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#0066FF] h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

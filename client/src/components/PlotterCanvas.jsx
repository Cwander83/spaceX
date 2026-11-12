import { useEffect, useRef } from 'react';
import { getTrajectoryProfile } from '../lib/telemetry.js';

export default function PlotterCanvas({ launch, motionPaused }) {
  const canvasRef = useRef(null);
  const profileRef = useRef(getTrajectoryProfile(launch));
  const curveRef = useRef({ ...profileRef.current.curve });
  const progressRef = useRef(0.72);
  const pausedRef = useRef(motionPaused);

  useEffect(() => {
    profileRef.current = getTrajectoryProfile(launch);
  }, [launch]);

  useEffect(() => {
    pausedRef.current = motionPaused;
  }, [motionPaused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let rafId = 0;
    let lastTick = performance.now();

    function drawFrame(now) {
      const dt = Math.min(0.05, (now - lastTick) / 1000);
      lastTick = now;

      if (!pausedRef.current) {
        progressRef.current = (progressRef.current + dt * 0.14) % 1;
      }

      const profile = profileRef.current;
      const target = profile.curve;
      const current = curveRef.current;
      const blend = pausedRef.current ? 1 : Math.min(1, dt * 8);

      Object.keys(target).forEach((key) => {
        current[key] += (target[key] - current[key]) * blend;
      });

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (
        w > 0 &&
        h > 0 &&
        (canvas.width !== Math.round(w * dpr) ||
          canvas.height !== Math.round(h * dpr))
      ) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      if (w > 0 && h > 0) {
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        // Millimeter graph paper grid lines
        const minorStep = 24;
        ctx.strokeStyle = 'rgba(20, 19, 17, 0.08)';
        ctx.lineWidth = 1;
        for (let x = 44; x < w - 16; x += minorStep) {
          ctx.beginPath();
          ctx.moveTo(x + 0.5, 14);
          ctx.lineTo(x + 0.5, h - 28);
          ctx.stroke();
        }
        for (let y = 14; y < h - 28; y += minorStep) {
          ctx.beginPath();
          ctx.moveTo(44, y + 0.5);
          ctx.lineTo(w - 18, y + 0.5);
          ctx.stroke();
        }

        // Major Plotter X/Y Axes
        ctx.strokeStyle = '#141311';
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(44.5, 14);
        ctx.lineTo(44.5, h - 28.5);
        ctx.lineTo(w - 18, h - 28.5);
        ctx.stroke();

        // Axis ticks & annotations
        ctx.fillStyle = '#4e4a42';
        ctx.font = '10px ui-monospace, monospace';
        ctx.fillText('400', 14, 24);
        ctx.fillText('200', 14, h * 0.48);
        ctx.fillText('KM', 18, h - 32);
        ctx.fillText('T+0', 46, h - 12);
        ctx.fillText('500 KM', w * 0.34, h - 12);
        ctx.fillText('1000 KM', w * 0.62, h - 12);
        ctx.fillText('1500 KM', Math.max(w * 0.84, w - 76), h - 12);

        // Earth curvature datum arc
        ctx.beginPath();
        ctx.arc(w * 0.52, h * 2.95, h * 2.24, Math.PI * 1.36, Math.PI * 1.64);
        ctx.strokeStyle = 'rgba(20, 19, 17, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const p0 = { x: 64, y: h - 42 };
        const p1 = { x: w * current.p1x, y: h * current.p1y };
        const p2 = { x: w * current.p2x, y: h * current.p2y };
        const p3 = { x: w * current.p3x, y: h * current.p3y };

        const pointAt = (t) => {
          const mt = 1 - t;
          return {
            x:
              mt * mt * mt * p0.x +
              3 * mt * mt * t * p1.x +
              3 * mt * t * t * p2.x +
              t * t * t * p3.x,
            y:
              mt * mt * mt * p0.y +
              3 * mt * mt * t * p1.y +
              3 * mt * t * t * p2.y +
              t * t * t * p3.y,
          };
        };

        // Dashed carbon predicted track
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = 'rgba(20, 19, 17, 0.42)';
        ctx.lineWidth = 1.25;
        ctx.stroke();
        ctx.setLineDash([]);

        // Active Signal Vermilion ink trace
        const traceColor = profile.isNominal ? '#c8371d' : '#8c1d13';
        const progress = progressRef.current;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        const steps = 48;
        for (let i = 1; i <= steps; i += 1) {
          const pt = pointAt((i / steps) * progress);
          ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = traceColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Event tick mark at MECO / Stage Sep Fault
        const eventPt = pointAt(0.38);
        ctx.strokeStyle = '#141311';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(eventPt.x, eventPt.y - 6);
        ctx.lineTo(eventPt.x, eventPt.y + 6);
        ctx.stroke();
        ctx.fillStyle = '#141311';
        ctx.font = 'bold 10px ui-monospace, monospace';
        ctx.fillText(profile.eventLabel, eventPt.x + 6, eventPt.y - 9);

        // Mechanical Drum-Plotter Crosshair Pen Head
        const pen = pointAt(progress);
        ctx.strokeStyle = 'rgba(200, 55, 29, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pen.x, 14);
        ctx.lineTo(pen.x, h - 28);
        ctx.moveTo(44, pen.y);
        ctx.lineTo(w - 18, pen.y);
        ctx.stroke();

        ctx.strokeStyle = traceColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pen.x - 5, pen.y - 5, 10, 10);
        ctx.fillStyle = traceColor;
        ctx.fillRect(pen.x - 2, pen.y - 2, 4, 4);

        ctx.restore();
      }

      rafId = requestAnimationFrame(drawFrame);
    }

    rafId = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="orbital-canvas"
      className="plotter-canvas"
      aria-label="Vellum drum-plotter rocket ascent trajectory chart"
    />
  );
}

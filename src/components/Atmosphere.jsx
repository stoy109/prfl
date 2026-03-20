import React, { useRef, useEffect, useState } from 'react';

function getParticleCount() {
  return window.matchMedia('(max-width: 768px)').matches ? 80 : 300;
}

export function Atmosphere({ intensity, motionScale, mode, osuEvent }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const [particleCount, setParticleCount] = useState(getParticleCount);
  const particlesRef = useRef([]);
  const whistlesRef = useRef([]); // For Whistle hit sparkles
  const tRef = useRef(0);
  const lastWhistleRef = useRef(false);
  const intensityRef = useRef(intensity);
  const motionScaleRef = useRef(motionScale);
  const modeRef = useRef(mode);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    motionScaleRef.current = motionScale;
  }, [motionScale]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const handleChange = () => setParticleCount(getParticleCount());
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      z: Math.random() * 1000 + 1,
      ox: 0,
      oy: 0
    }));
  }, [particleCount]);

  // Add Whistle sparkle when event fires (once per whistle, not every frame)
  useEffect(() => {
    if (osuEvent.hasWhistle && !lastWhistleRef.current) {
      lastWhistleRef.current = true;
      for (let i = 0; i < 5; i++) {
        whistlesRef.current.push({
          x: (window.innerWidth * 0.5) + (Math.random() * 200 - 100),
          y: (window.innerHeight * 0.5) + (Math.random() * 200 - 100),
          life: 1.0,
          dx: (Math.random() * 4 - 2),
          dy: (Math.random() * 4 - 2)
        });
      }
    }
    if (!osuEvent.hasWhistle) lastWhistleRef.current = false;
  }, [osuEvent.hasWhistle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 2 : 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      tRef.current += 0.016;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const cx = width / 2;
      const cy = height / 2;
      const activeIntensity = intensityRef.current;
      const activeMotionScale = motionScaleRef.current;
      const activeMode = modeRef.current;

      // Dark background trail factor
      const trailFactor = activeIntensity > 1.0 || activeMode.includes('BUILD_UP') ? 0.3 : 0.85;
      ctx.fillStyle = `rgba(2, 6, 23, ${trailFactor})`; // Slate-950
      ctx.fillRect(0, 0, width, height);

      // Modes
      const isRest = activeMode.startsWith('REST') || activeMode === 'MELODY_ONLY';
      const isVerse = activeMode.startsWith('VERSE');
      const isPreBuildUp = activeMode.startsWith('PRE_BUILD');
      const isBuildUp = activeMode.includes('BUILD_UP');
      const isDrop = activeMode.startsWith('DROP');

      const speed = 2 * (1 + activeIntensity * 5) * (1 + activeMotionScale);

      for (let i = 0; i < particleCount; i++) {
        let p = particlesRef.current[i];
        
        p.ox = p.x;
        p.oy = p.y;
        
        if (isPreBuildUp) {
          // Signal warning: jitter + slight centripetal pull (autonomous).
          const dx = cx - p.x;
          const dy = cy - p.y;
          const jitter = (Math.random() - 0.5) * 6 * Math.min(1, activeIntensity);
          p.x += dx * 0.01 * activeIntensity + jitter;
          p.y += dy * 0.01 * activeIntensity - jitter;
          p.z -= speed * 0.6;
        } else if (isBuildUp) {
          // Vertical streams
          p.y -= speed * 3.5;
          p.x += Math.sin(tRef.current + i * 0.05) * (0.4 + activeIntensity);
        } else {
          // Normal Z movement towards camera
          p.z -= speed;
          if (isVerse) {
            // Verse: slow vertical drift downwards (stable transmission feel).
            p.y += (0.6 + activeIntensity) * (0.8 + activeMotionScale);
          } else if (isRest) {
            // Rest: very slow drift.
            p.y += 0.2;
          } else if (isDrop) {
            // Drop: slight turbulence without cursor coupling.
            p.x += (Math.random() - 0.5) * (0.8 + activeIntensity);
            p.y += (Math.random() - 0.5) * (0.6 + activeIntensity);
          }
        }

        // Reset Out of Bounds
        if (
          p.z <= 0 ||
          p.y < -200 ||
          p.y > height + 200 ||
          p.x < -200 ||
          p.x > width + 200 ||
          (isPreBuildUp && Math.abs(cx - p.x) < 5 && Math.abs(cy - p.y) < 5)
        ) {
            p.z = 1000;
            p.x = Math.random() * width;
            p.y = isBuildUp ? height + Math.random() * 200 : Math.random() * height;
            p.ox = p.x;
            p.oy = p.y;
        }

        // Calculate mapped positions
        const x = (p.x - cx) * (1000 / p.z) + cx;
        const y = (p.y - cy) * (1000 / p.z) + cy;

        const ox = (p.ox - cx) * (1000 / p.z) + cx;
        const oy = (p.oy - cy) * (1000 / p.z) + cy;

        const size = Math.max(0.5, (1 - p.z / 1000) * 3);
        const alpha = Math.max(0.1, 1 - p.z / 1000);

        ctx.beginPath();
        if (activeIntensity > 0.8 || isBuildUp) {
          // Warp lines or vertical lines
          ctx.moveTo(ox, oy);
          ctx.lineTo(x, y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = size * 0.5;
          ctx.stroke();
        } else {
          // Normal stars
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Render Whistles
      for (let i = whistlesRef.current.length - 1; i >= 0; i--) {
        let w = whistlesRef.current[i];
        w.x += w.dx;
        w.y += w.dy;
        w.life -= 0.05; // Fade out fast (<200ms)
        
        if (w.life <= 0) {
          whistlesRef.current.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 255, 255, ${w.life})`;
          ctx.arc(w.x, w.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [particleCount]);

  return (
    <canvas 
      ref={canvasRef} 
      className="canvas-bg" 
    />
  );
}

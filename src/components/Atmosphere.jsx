import React, { useRef, useEffect } from 'react';

const PARTICLE_COUNT = 300;

export function Atmosphere({ intensity, motionScale, mousePos, mode, osuEvent }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const particlesRef = useRef([]);
  const whistlesRef = useRef([]); // For Whistle hit sparkles

  useEffect(() => {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      z: Math.random() * 1000 + 1,
      ox: 0,
      oy: 0
    }));
  }, []);

  // Add Whistle sparkle when event fires
  useEffect(() => {
    if (osuEvent.hasWhistle) {
      for(let i=0; i<5; i++) {
        whistlesRef.current.push({
          x: mousePos.x + (Math.random() * 100 - 50),
          y: mousePos.y + (Math.random() * 100 - 50),
          life: 1.0,
          dx: (Math.random() * 4 - 2),
          dy: (Math.random() * 4 - 2)
        });
      }
    }
  }, [osuEvent, mousePos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      // Dark background trail factor
      const trailFactor = intensity > 1.0 || mode.includes('BUILD_UP') ? 0.3 : 0.8;
      ctx.fillStyle = `rgba(2, 6, 23, ${trailFactor})`; // Slate-950
      ctx.fillRect(0, 0, width, height);

      // Modes
      const isPreBuildUp = mode.includes('BUILD_UP_1') || mode === 'PRE_DROP_2';
      const isBuildUp = mode === 'BUILD_UP_2' || mode === 'BUILD_UP_1' && intensity > 0.4;
      
      const targetMouseX = mousePos.x - cx;
      const targetMouseY = mousePos.y - cy;
      
      const speed = 2 * (1 + intensity * 5) * (1 + motionScale);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        let p = particlesRef.current[i];
        
        p.ox = p.x;
        p.oy = p.y;
        
        if (isPreBuildUp) {
          // Centripetal: move towards center X/Y
          const dx = cx - p.x;
          const dy = cy - p.y;
          p.x += dx * 0.05 * intensity;
          p.y += dy * 0.05 * intensity;
          p.z -= speed * 0.5; // slow down forward motion
        } else if (isBuildUp) {
          // Vertical streams
          p.y -= speed * 3;
        } else {
          // Normal Z movement towards camera
          p.z -= speed;
        }

        // Mouse suction (if close)
        if (!isPreBuildUp && !isBuildUp) {
           const dxM = mousePos.x - p.x;
           const dyM = mousePos.y - p.y;
           const distM = Math.sqrt(dxM*dxM + dyM*dyM);
           if (distM < 200) {
              p.x += dxM * 0.02;
              p.y += dyM * 0.02;
           }
        }

        // Reset Out of Bounds
        if (p.z <= 0 || p.y < 0 || (isPreBuildUp && Math.abs(cx - p.x) < 5 && Math.abs(cy - p.y) < 5)) {
            p.z = 1000;
            p.x = Math.random() * width - (isBuildUp ? 0 : targetMouseX);
            p.y = isBuildUp ? height + Math.random() * 100 : Math.random() * height - targetMouseY;
            p.ox = p.x;
            p.oy = p.y;
        }

        // Calculate mapped positions
        const x = (p.x - cx) * (1000 / p.z) + cx + (targetMouseX * p.z / 2000);
        const y = (p.y - cy) * (1000 / p.z) + cy + (targetMouseY * p.z / 2000);

        const ox = (p.ox - cx) * (1000 / p.z) + cx + (targetMouseX * p.z / 2000);
        const oy = (p.oy - cy) * (1000 / p.z) + cy + (targetMouseY * p.z / 2000);

        const size = Math.max(0.5, (1 - p.z / 1000) * 3);
        const alpha = Math.max(0.1, 1 - p.z / 1000);

        ctx.beginPath();
        if (intensity > 0.8 || isBuildUp) {
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

        if (!isPreBuildUp && !isBuildUp) {
            p.x = (x - cx - targetMouseX * p.z/2000) * p.z / 1000 + cx;
            p.y = (y - cy - targetMouseY * p.z/2000) * p.z / 1000 + cy;
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
  }, [intensity, motionScale, mousePos, mode]);

  return (
    <canvas 
      ref={canvasRef} 
      className="canvas-bg" 
    />
  );
}

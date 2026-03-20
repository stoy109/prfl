import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function BootOverlay({ actived, onActivate }) {
  const [rain, setRain] = useState([]);

  useEffect(() => {
    if (actived) return;

    let lastTime = 0;
    const handleMouseMove = (e) => {
      const now = Date.now();
      if (now - lastTime > 30) { // throttle to 30ms ~30fps
        setRain(prev => [
          ...prev.slice(-15), // keep array small
          { id: Math.random(), x: e.clientX, y: e.clientY, text: Math.random() > 0.5 ? '0' : '1' }
        ]);
        lastTime = now;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [actived]);

  if (actived) return null;

  const titleChars = "DYP OS".split("");

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="boot-overlay"
      onClick={onActivate}
    >
      <AnimatePresence>
        {rain.map((r) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0.8, x: r.x, y: r.y }}
            animate={{ opacity: 0, y: r.y + 100 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'linear' }}
            style={{ color: '#6366f1', position: 'absolute', fontFamily: 'var(--font-tech)', fontSize: '0.75rem', pointerEvents: 'none', zIndex: 101 }} // Indigo-500
          >
            {r.text}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="boot-title" style={{ display: 'flex', gap: '0.25rem' }}>
        {titleChars.map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
          >
            {/* Occasionally glitch a character */}
            <motion.span
              animate={{ color: Math.random() > 0.95 ? '#f43f5e' : '#fff' }}
              transition={{ repeat: Infinity, duration: 0.1 }}
            >
              {char}
            </motion.span>
          </motion.span>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="boot-subtitle"
      >
        Click anywhere to synchronize
      </motion.div>
    </motion.div>
  );
}

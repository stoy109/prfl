import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Youtube, Video, Box, Gamepad2, Instagram, Github } from 'lucide-react';

const icons = { Youtube, Video, Box, Gamepad2, Instagram, Github };

export function SocialNode({ platform, url, color, icon, behavior, mode, osuEvent, index, total, orbitPhase }) {
  const nodeRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const frozenAngleRef = useRef(null);
  
  // DVD-like bouncing for BUILD_UP_1
  const [position, setPosition] = useState({ x: (Math.random() - 0.5) * window.innerWidth * 0.8, y: (Math.random() - 0.5) * window.innerHeight * 0.8 });
  const velocityRef = useRef({ x: (Math.random() - 0.5) * 8, y: (Math.random() - 0.5) * 8 });

  useEffect(() => {
    if (mode === 'BUILD_UP_1') {
      const interval = setInterval(() => {
        const v = velocityRef.current;
        setPosition((prev) => {
          let newX = prev.x + v.x;
          let newY = prev.y + v.y;
          let newVelX = v.x;
          let newVelY = v.y;

          const maxX = window.innerWidth / 2 - 50;
          const maxY = window.innerHeight / 2 - 50;

          if (newX > maxX || newX < -maxX) {
            newVelX = -newVelX;
            newX = Math.max(-maxX, Math.min(maxX, newX));
          }
          if (newY > maxY || newY < -maxY) {
            newVelY = -newVelY;
            newY = Math.max(-maxY, Math.min(maxY, newY));
          }

          velocityRef.current = { x: newVelX, y: newVelY };
          return { x: newX, y: newY };
        });
      }, 16);

      return () => clearInterval(interval);
    }
  }, [mode]);
  
  const IconComponent = icons[icon] || Box;

  // Elliptical Orbit & Pre-Build Up Merging
  const baseAngle = (index / total) * Math.PI * 2;
  const isMerging = mode.includes('BUILD_UP_1') || mode === 'PRE_DROP_2';
  
  // Base Orbit Radius - increased for better spacing
  const a = window.innerWidth > 768 ? 350 : 200;
  const b = window.innerWidth > 768 ? 130 : 80;  
  const c = window.innerWidth > 768 ? 90 : 55; // Y orbit amplitude

  const liveAngle = baseAngle + orbitPhase;
  const effectiveAngle = (hovered && frozenAngleRef.current !== null) ? frozenAngleRef.current : liveAngle;

  const targetX = isMerging ? 0 : Math.cos(effectiveAngle) * a;
  const targetZ = isMerging ? 0 : Math.sin(effectiveAngle) * b;
  const targetY = isMerging ? 0 : (Math.sin(effectiveAngle + Math.PI / 3) * c) + (targetZ * 0.25);

  // Ghost position (where it "should" be)
  const ghostX = isMerging ? 0 : Math.cos(liveAngle) * a;
  const ghostZ = isMerging ? 0 : Math.sin(liveAngle) * b;
  const ghostY = isMerging ? 0 : (Math.sin(liveAngle + Math.PI / 3) * c) + (ghostZ * 0.25);

  // UI Vibration during Build Up - stable across renders
  const isBuildUp = mode.includes('BUILD_UP_2') || mode.includes('BUILD_UP_1');
  const vibrateRef = useRef({ x: Math.random() * 6 - 3, y: Math.random() * 6 - 3 });
  const vibrateX = isBuildUp ? vibrateRef.current.x : 0;
  const vibrateY = isBuildUp ? vibrateRef.current.y : 0;

  // Rest state Blur Exception
  const isResting = mode.startsWith('REST') || mode === 'MELODY_ONLY' || mode === 'LOST_MELODY';
  const blurValue = isResting && !hovered ? 'blur(4px)' : 'blur(0px)';
  const restOpacity = isResting ? 0.2 : 1;

  // Z-index based on current z position for proper depth perception
  const zIndex = mode === 'BUILD_UP_1' ? 100 : Math.round((targetZ + b) * 10);

  return (
    <>
      {hovered && (
        <motion.div
          className="social-node-ghost"
          initial={{ opacity: 0 }}
          animate={{ 
            x: ghostX, 
            y: ghostY, 
            z: ghostZ,
            opacity: 0.25 
          }}
          transition={{ type: 'linear', duration: 0 }}
          style={{ 
            zIndex: zIndex - 1,
            filter: 'blur(2px)'
          }}
        >
          <IconComponent size={32} color={color} />
        </motion.div>
      )}
      <motion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        ref={nodeRef}
        onMouseEnter={() => {
          setHovered(true);
          frozenAngleRef.current = liveAngle;
        }}
        onMouseLeave={() => {
          setHovered(false);
          frozenAngleRef.current = null;
        }}
        initial={{ x: 0, y: 0, z: 0 }}
        animate={{
          x: mode === 'BUILD_UP_1' ? position.x + vibrateX : targetX + vibrateX,
          y: mode === 'BUILD_UP_1' ? position.y + vibrateY : targetY + vibrateY,
          z: mode === 'BUILD_UP_1' ? 0 : targetZ,
          scale: hovered ? 1.05 : (osuEvent.hasClap ? 1.08 : 1),
          opacity: restOpacity,
          boxShadow: osuEvent.hasClap ? `0 0 40px #6366f1, 0 0 10px ${color}` : (hovered ? `0 0 20px ${color}` : `0 0 5px rgba(99,102,241,0.2)`),
          borderColor: osuEvent.hasClap ? '#6366f1' : (hovered ? color : `rgba(99,102,241,0.4)`),
          filter: `${blurValue} ${osuEvent.hasFinish ? 'drop-shadow(2px 0 0 #f43f5e) drop-shadow(-2px 0 0 #00f2fe)' : ''}`
        }}
        whileHover={{ opacity: 1 }}
        transition={{ 
          type: 'spring', 
          stiffness: 300, 
          damping: 30 
        }}
        className="social-node"
        style={{ zIndex, pointerEvents: 'auto' }}
      >
        <IconComponent 
          size={32} 
          color={hovered ? '#fff' : 'rgba(255,255,255,0.8)'} 
          style={{ transition: 'color 0.2s' }}
        />
        {hovered && (
          <span className="node-label" style={{ color: color, textShadow: `0 0 10px ${color}` }}>
            {platform}
          </span>
        )}
      </motion.a>
    </>
  );
}

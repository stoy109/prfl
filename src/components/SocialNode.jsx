import React, { useRef, useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Youtube, Video, Box, Gamepad2, Instagram } from 'lucide-react';
import '../index.css';

const icons = { Youtube, Video, Box, Gamepad2, Instagram };

export function SocialNode({ platform, url, color, icon, behavior, mode, osuEvent, mousePos, index, total }) {
  const nodeRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  
  const IconComponent = icons[icon] || Box;

  // Elliptical Orbit & Pre-Build Up Merging
  const angle = (index / total) * Math.PI * 2;
  const isMerging = mode.includes('BUILD_UP_1') || mode === 'PRE_DROP_2';
  
  // Base Orbit Radius
  const a = window.innerWidth > 768 ? 300 : 150; 
  const b = window.innerWidth > 768 ? 100 : 50;  

  const targetX = isMerging ? 0 : Math.cos(angle) * a;
  const targetZ = isMerging ? 0 : Math.sin(angle) * b;
  const targetY = isMerging ? 0 : targetZ * 0.5;

  // UI Vibration during Build Up
  const isBuildUp = mode.includes('BUILD_UP_2') || mode.includes('BUILD_UP_1');
  const vibrateX = isBuildUp ? (Math.random() * 6 - 3) : 0;
  const vibrateY = isBuildUp ? (Math.random() * 6 - 3) : 0;

  // Rest state Blur Exception
  const isResting = mode === 'REST' || mode === 'LOST_MELODY';
  const blurValue = isResting && !hovered ? 'blur(4px)' : 'blur(0px)';

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      ref={nodeRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ x: 0, y: 0, z: 0 }}
      animate={{
        x: targetX + vibrateX,
        y: targetY + vibrateY,
        z: targetZ,
        scale: hovered ? 1.05 : (osuEvent.hasClap ? 1.08 : 1),
        boxShadow: osuEvent.hasClap ? `0 0 40px #6366f1, 0 0 10px ${color}` : (hovered ? `0 0 20px ${color}` : `0 0 5px rgba(99,102,241,0.2)`),
        borderColor: osuEvent.hasClap ? '#6366f1' : (hovered ? color : `rgba(99,102,241,0.4)`),
        filter: `${blurValue} ${osuEvent.hasFinish ? 'drop-shadow(2px 0 0 #f43f5e) drop-shadow(-2px 0 0 #00f2fe)' : ''}`
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 30 
      }}
      className="social-node"
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
  );
}

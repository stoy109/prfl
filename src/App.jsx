import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSatelliteSync } from './hooks/useSatelliteSync';
import { BootOverlay } from './components/BootOverlay';
import { Atmosphere } from './components/Atmosphere';
import { NodeGallery } from './components/NodeGallery';
import { LyricDisplay } from './components/LyricDisplay';
import { PostProcess } from './components/PostProcess';
import './index.css';

function App() {
  const [activated, setActivated] = useState(false);
  const [mousePos, setMousePos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  
  const {
    currentTime,
    currentStructure,
    intensity,
    motionScale,
    mode,
    play,
    osuEvent,
    volume,
    setVolume
  } = useSatelliteSync();

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleActivate = () => {
    setActivated(true);
    play();
  };

  // KINETIC OFFSET on Drop Frame
  const isDrop = mode === 'DROP_1' || mode === 'DROP_2';
  
  // Normal bitmask -> App container scale pulse 1.0 -> 1.01
  const scalePulse = osuEvent.hasNormal ? 1.01 : 1.0;
  
  // Finish bitmask -> Chromatic aberration flash in App container space (simulated by shaking x/y and using text-shadow in CSS, or simple CSS transform)
  const kineticShakeX = (isDrop || osuEvent.hasFinish) ? (Math.random() * 20 - 10) * (osuEvent.isHit ? 1 : 0) : 0;
  const kineticShakeY = (isDrop || osuEvent.hasFinish) ? (Math.random() * 10 - 5) * (osuEvent.isHit ? 1 : 0) : 0;

  return (
    <>
      <div className="scanlines"></div>
      
      <AnimatePresence>
        {!activated && <BootOverlay actived={activated} onActivate={handleActivate} />}
      </AnimatePresence>

      <PostProcess mode={mode} osuEvent={osuEvent}>
        <motion.div
          animate={{ 
            x: kineticShakeX, 
            y: kineticShakeY,
            scale: scalePulse
          }}
          transition={{ 
            type: osuEvent.sampleSet === 1 ? 'spring' : 'tween', 
            stiffness: 500, damping: 20, duration: 0.1 
          }}
          className="app-container"
        >
          {activated && (
            <>
              <Atmosphere intensity={intensity} motionScale={motionScale} mousePos={mousePos} mode={mode} osuEvent={osuEvent} />
              
              <div className="hud-info" style={{ 
                 opacity: mode === 'OUTRO' ? 0 : 1, 
                 transition: 'opacity 1s' 
              }}>
                <div>SYS.STAT: {currentStructure.label}</div>
                <div>ENERGY: {(intensity * 100).toFixed(0)}%</div>
                <div>MASK: {osuEvent.mask.toString(2).padStart(4, '0')}</div>
              </div>

              <NodeGallery mode={mode} osuEvent={osuEvent} mousePos={mousePos} intensity={intensity} />
              
              <LyricDisplay currentTime={currentTime} mode={mode} />

              <div className="volume-control" style={{ 
                 opacity: mode === 'OUTRO' ? 0 : 1, 
                 transition: 'opacity 1s',
                 pointerEvents: mode === 'OUTRO' ? 'none' : 'auto' 
              }}>
                <input
                  aria-label="Volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                />
              </div>
            </>
          )}
          
          {mode === 'OUTRO' && currentTime > 310 && (
             <div className="tv-shutdown"></div>
          )}
        </motion.div>
      </PostProcess>
    </>
  );
}

export default App;

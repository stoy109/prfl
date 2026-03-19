import React, { useEffect, useState } from 'react';
import '../index.css';

export function PostProcess({ children, mode, osuEvent }) {
  const [finishFlash, setFinishFlash] = useState(false);

  const isResting = mode === 'REST' || mode === 'LOST_MELODY';
  const isDrop = mode === 'DROP_1' || mode === 'DROP_2';
  
  // Finish hit causes Chromatic Aberration flash
  useEffect(() => {
    if (osuEvent.hasFinish) {
      setFinishFlash(true);
      const timer = setTimeout(() => setFinishFlash(false), 100);
      return () => clearTimeout(timer);
    }
  }, [osuEvent]);

  // Rest: Grayscale and blur
  const filterStyle = [
    isResting ? 'blur(4px)' : 'blur(0px)',
    isResting ? 'grayscale(100%) contrast(0.5)' : 'grayscale(0%) contrast(1)',
    mode === 'DROP_2' ? 'hue-rotate(90deg)' : 'hue-rotate(0deg)'
  ].join(' ');

  // Global vignette: vignette yang sangat kabur pada Rest, bloom pada Drop
  let vignetteRadius = '80%';
  let bloom = '0px';

  if (mode.includes('BUILD_UP')) {
    vignetteRadius = '40%';
  } else if (isDrop) {
    vignetteRadius = '120%';
    bloom = '10px';
  } else if (isResting) {
    vignetteRadius = '30%'; // Extremely tight vignette
  }

  // Grid distortion via scale and skew during drops
  const gridTransform = isDrop && osuEvent.isHit ? 'perspective(600px) rotateX(60deg) scale(2.1) skew(2deg)' : 'perspective(600px) rotateX(60deg) scale(2) skew(0deg)';

  return (
    <div
      className="post-process-wrapper"
      style={{
        filter: filterStyle,
        transition: 'filter 0.5s ease-out',
        textShadow: finishFlash ? '2px 0 0 rgba(244,63,94,0.8), -2px 0 0 rgba(0,242,254,0.8)' : `0 0 ${bloom} rgba(99,102,241,0.5)`,
        transform: finishFlash ? 'scale(1.02)' : 'scale(1)'
      }}
    >
      <div 
        className="vignette-overlay"
        style={{
          background: `radial-gradient(circle at center, transparent ${vignetteRadius}, #020617 120%)`
        }}
      />
      
      {/* Void Grid */}
      {mode !== 'REST' && mode !== 'LOST_MELODY' && mode !== 'OUTRO' && (
        <div 
          className="void-grid" 
          style={{ 
            opacity: mode.includes('BUILD_UP') ? 0.2 : 0.05,
            filter: mode.includes('BUILD_UP') ? 'hue-rotate(60deg)' : 'none',
            transform: gridTransform,
            transition: 'opacity 2s, filter 2s, transform 0.1s'
          }}
        />
      )}
      
      {children}
    </div>
  );
}

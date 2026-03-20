import React, { useEffect, useRef, useState } from 'react';
import { SocialNode } from './SocialNode';
import { DiscordProfile } from './DiscordProfile';
import { useLanyard } from '../hooks/useLanyard';
import { LINKS_DATA } from '../constants';

export function NodeGallery({ mode, osuEvent, mousePos, intensity }) {
  const lanyardData = useLanyard('394962164231962625');
  const [orbitPhase, setOrbitPhase] = useState(0);
  const rafRef = useRef(null);
  const lastRef = useRef(null);
  const boostRef = useRef(0);

  useEffect(() => {
    const tick = (now) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = Math.min(0.05, (now - lastRef.current) / 1000);
      lastRef.current = now;

      // Small beat impact: kick orbit speed slightly, then decay.
      boostRef.current *= Math.pow(0.01, dt);

      const baseSpeed = 0.35; // rad/s
      const speed = baseSpeed * (1 + boostRef.current);
      setOrbitPhase((p) => p + speed * dt);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!osuEvent?.isHit) return;
    const bump =
      osuEvent.hasFinish ? 0.08 :
      osuEvent.hasClap ? 0.05 :
      osuEvent.hasWhistle ? 0.04 :
      osuEvent.hasNormal ? 0.03 :
      0.02;
    boostRef.current = Math.min(0.15, boostRef.current + bump);
  }, [osuEvent]);

  return (
    <div className="gallery-container">
      <div className="orbit-scroller">
        {/* The Central Profile */}
        <DiscordProfile 
          lanyardData={lanyardData} 
          osuEvent={osuEvent} 
          mode={mode} 
          intensity={intensity} 
        />

        {/* Orbiting Social Nodes */}
        {LINKS_DATA.map((link, index) => (
          <SocialNode
            key={link.platform}
            index={index}
            total={LINKS_DATA.length}
            platform={link.platform}
            url={link.url}
            color={link.color}
            icon={link.icon}
            behavior={link.behavior}
            mode={mode}
            osuEvent={osuEvent}
            mousePos={mousePos}
            orbitPhase={orbitPhase}
          />
        ))}
      </div>
    </div>
  );
}

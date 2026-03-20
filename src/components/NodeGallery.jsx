import React, { useEffect, useRef, useState } from 'react';
import { SocialNode } from './SocialNode';
import { DiscordProfile } from './DiscordProfile';
import { useLanyard } from '../hooks/useLanyard';
import { LINKS_DATA } from '../constants';

export function NodeGallery({ mode, osuEvent, intensity }) {
  const lanyardData = useLanyard('394962164231962625');
  const [orbitPhase, setOrbitPhase] = useState(0);
  const scrollerRef = useRef(null);
  const rafRef = useRef(null);
  const lastRef = useRef(null);
  const boostRef = useRef(0);
  const inputVelocityRef = useRef(0);
  const dragPhaseDeltaRef = useRef(0);
  const lastWheelTsRef = useRef(0);
  const manualControlRef = useRef(false);
  const resumeAutoAtRef = useRef(0);
  const suppressClickRef = useRef(false);
  const dragRef = useRef({
    active: false,
    pointerId: null,
    lastX: 0,
    lastT: 0,
    moved: false
  });

  const WHEEL_TO_SPEED = 100;
  const DRAG_DELTA_TO_PHASE = 0.010;
  const DRAG_VELOCITY_TO_SPEED = 0.010;
  const MAX_INPUT_SPEED = 4.5;
  const AUTO_RESUME_MS_WHEEL = 420;
  const AUTO_RESUME_MS_DRAG = 220;

  useEffect(() => {
    const tick = (now) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = Math.min(0.05, (now - lastRef.current) / 1000);
      lastRef.current = now;

      if (
        manualControlRef.current &&
        !dragRef.current.active &&
        now >= resumeAutoAtRef.current
      ) {
        manualControlRef.current = false;
      }

      // Small beat impact: kick orbit speed slightly, then decay.
      boostRef.current *= Math.pow(0.01, dt);
      inputVelocityRef.current *= Math.pow(0.003, dt);
      inputVelocityRef.current = Math.max(-MAX_INPUT_SPEED, Math.min(MAX_INPUT_SPEED, inputVelocityRef.current));

      const baseSpeed = 0.35; // rad/s
      const autoSpeed = manualControlRef.current ? 0 : baseSpeed * (1 + boostRef.current);
      const speed = autoSpeed + inputVelocityRef.current;
      const dragDelta = dragPhaseDeltaRef.current;
      dragPhaseDeltaRef.current = 0;
      setOrbitPhase((p) => p + speed * dt + dragDelta);
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
  }, [osuEvent.isHit, osuEvent.hasFinish, osuEvent.hasClap, osuEvent.hasWhistle, osuEvent.hasNormal]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const onWheel = (e) => {
      e.preventDefault();
      const now = performance.now();
      manualControlRef.current = true;
      resumeAutoAtRef.current = now + AUTO_RESUME_MS_WHEEL;
      const dtMs = Math.max(8, now - (lastWheelTsRef.current || now - 16));
      lastWheelTsRef.current = now;
      const delta = e.deltaY;

      // Convert wheel intensity/cadence directly into orbit velocity.
      const velocityImpulse = (delta / dtMs) * WHEEL_TO_SPEED;
      inputVelocityRef.current += velocityImpulse;
      inputVelocityRef.current = Math.max(-MAX_INPUT_SPEED, Math.min(MAX_INPUT_SPEED, inputVelocityRef.current));
    };

    const onPointerDown = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      // Let interactive elements (like social links) receive normal click behavior.
      if (e.target instanceof Element) {
        const interactiveTarget = e.target.closest('a, button, input, textarea, select, label, [role="button"]');
        if (interactiveTarget) return;
      }

      manualControlRef.current = true;
      dragRef.current.active = true;
      dragRef.current.pointerId = e.pointerId;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastT = performance.now();
      dragRef.current.moved = false;
      scroller.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!dragRef.current.active || dragRef.current.pointerId !== e.pointerId) return;
      const now = performance.now();
      const dtMs = Math.max(8, now - dragRef.current.lastT);
      const dx = e.clientX - dragRef.current.lastX;

      if (Math.abs(dx) > 1) dragRef.current.moved = true;
      if (Math.abs(dx) > 6) suppressClickRef.current = true;

      // Inverted direction: drag right rotates orbit left, drag left rotates orbit right.
      dragPhaseDeltaRef.current -= dx * DRAG_DELTA_TO_PHASE;

      const velocity = (-dx / dtMs) * DRAG_VELOCITY_TO_SPEED;
      inputVelocityRef.current = Math.max(-MAX_INPUT_SPEED, Math.min(MAX_INPUT_SPEED, velocity));

      dragRef.current.lastX = e.clientX;
      dragRef.current.lastT = now;
    };

    const endDrag = (e) => {
      if (dragRef.current.pointerId !== e.pointerId) return;
      dragRef.current.active = false;
      dragRef.current.pointerId = null;
      dragRef.current.lastX = 0;
      dragRef.current.lastT = 0;
      dragRef.current.moved = false;
      resumeAutoAtRef.current = performance.now() + AUTO_RESUME_MS_DRAG;
      if (scroller.hasPointerCapture(e.pointerId)) {
        scroller.releasePointerCapture(e.pointerId);
      }
    };

    scroller.addEventListener('wheel', onWheel, { passive: false });
    scroller.addEventListener('pointerdown', onPointerDown);
    scroller.addEventListener('pointermove', onPointerMove);
    scroller.addEventListener('pointerup', endDrag);
    scroller.addEventListener('pointercancel', endDrag);

    return () => {
      scroller.removeEventListener('wheel', onWheel);
      scroller.removeEventListener('pointerdown', onPointerDown);
      scroller.removeEventListener('pointermove', onPointerMove);
      scroller.removeEventListener('pointerup', endDrag);
      scroller.removeEventListener('pointercancel', endDrag);
    };
  }, []);

  return (
    <div className="gallery-container">
      <div
        className="orbit-scroller"
        ref={scrollerRef}
        onClickCapture={(e) => {
          if (!suppressClickRef.current) return;
          e.preventDefault();
          e.stopPropagation();
          suppressClickRef.current = false;
        }}
      >
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
            orbitPhase={orbitPhase}
          />
        ))}
      </div>
    </div>
  );
}

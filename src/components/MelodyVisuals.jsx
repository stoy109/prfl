import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import melodyEvents from '../melody_events.json';

function buildTimeIndex(events, bucketScale = 2) {
  const index = new Map();
  for (const e of events) {
    const key = Math.floor(e.time * bucketScale);
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(e);
  }
  return index;
}

function queryTimeRange(index, currentTime, duration, bucketScale = 2) {
  const startBucket = Math.floor((currentTime - duration) * bucketScale);
  const endBucket = Math.floor(currentTime * bucketScale);
  const result = [];
  for (let k = startBucket; k <= endBucket; k++) {
    const bucket = index.get(k) || [];
    for (const e of bucket) {
      if (currentTime >= e.time && currentTime < e.time + duration) {
        result.push(e);
      }
    }
  }
  return result;
}

const RADAR_INDEX = buildTimeIndex(melodyEvents.radar || [], 2);
const SPOTLIGHT_INDEX = buildTimeIndex(melodyEvents.spotlight || [], 10);
const STARBURST_INDEX = buildTimeIndex(melodyEvents.starBurst || [], 2);

const CONNECTED_SLIDER_GAP_MS = 50;
const SLIDER_GAP_SEC = CONNECTED_SLIDER_GAP_MS / 1000;

/** Merge overlapping or connected sliders (gap < 50ms) into continuous ranges */
function useMergedSliderRanges() {
  return useMemo(() => {
    const sliders = melodyEvents.sliders || [];
    if (sliders.length === 0) return [];
    const merged = [];
    let [start, end] = [sliders[0].startTime, sliders[0].endTime];
    for (let i = 1; i < sliders.length; i++) {
      const s = sliders[i];
      if (s.startTime - end <= SLIDER_GAP_SEC) {
        end = Math.max(end, s.endTime);
      } else {
        merged.push({ startTime: start, endTime: end });
        [start, end] = [s.startTime, s.endTime];
      }
    }
    merged.push({ startTime: start, endTime: end });
    return merged;
  }, []);
}

/** Check if currentTime is inside any merged slider range */
function isInSliderRange(currentTime, mergedRanges) {
  return mergedRanges.some(
    (r) => currentTime >= r.startTime && currentTime <= r.endTime
  );
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)');
    const handleChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);
  return isMobile;
}

export function MelodyVisuals({ currentTime, mode, intensity }) {
  const isMobile = useIsMobile();
  const mergedSliderRanges = useMergedSliderRanges();
  const sliderActive = isInSliderRange(currentTime, mergedSliderRanges);

  const [activeSpotlights, setActiveSpotlights] = useState(0);
  const lastSpotlightTimeRef = useRef(-1);

  // Spotlight: cycling index on each hit (effect, not useMemo side effect)
  useEffect(() => {
    const hits = queryTimeRange(SPOTLIGHT_INDEX, currentTime, 0.1, 10);
    if (hits.length > 0 && hits[0].time !== lastSpotlightTimeRef.current) {
      lastSpotlightTimeRef.current = hits[0].time;
      setActiveSpotlights((prev) => (prev + 1) % 5);
    }
  }, [currentTime]);

  const spotlightRotation = useRef(
    Array.from({ length: 5 }, () => (Math.random() * 40 - 20))
  );

  // Radar rings: events where currentTime is within [event.time, event.time + 1.5]
  const radarRings = useMemo(
    () => queryTimeRange(RADAR_INDEX, currentTime, 1.5),
    [currentTime]
  );

  // StarBurst: spawn particles for events in window [event.time, event.time + 0.8]
  const starBurstTriggers = useMemo(
    () => queryTimeRange(STARBURST_INDEX, currentTime, 0.8),
    [currentTime]
  );

  const hasRecentSpotlightHit = useMemo(
    () => queryTimeRange(SPOTLIGHT_INDEX, currentTime, 0.3, 10).length > 0,
    [currentTime]
  );

  return (
    <>
      {/* 1. Radar Satellite Beep (X=103) - Expanding rings from avatar center */}
      <div
        className="melody-radar-layer"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AnimatePresence mode="popLayout">
          {radarRings.map((e, i) => (
            <RadarRing key={`${e.time}-${i}`} startTime={e.time} currentTime={currentTime} />
          ))}
        </AnimatePresence>
        {/* Center ping - sharp high-fidelity center flash */}
        <AnimatePresence>
          {radarRings.some((e) => currentTime >= e.time && currentTime < e.time + 0.15) && (
            <motion.div
              key="radar-ping"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="radar-ping"
              style={{
                position: 'absolute',
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 0 15px 2px rgba(129, 140, 248, 0.8), 0 0 30px rgba(129, 140, 248, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                zIndex: 2,
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* 2. Concert Spotlight (X=308) - 5 sweeping light beams */}
      <div
        className="melody-spotlight-layer"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 14,
          overflow: 'hidden',
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <SpotlightBeam
            key={i}
            index={i}
            isActive={i === activeSpotlights}
            baseRotation={spotlightRotation.current[i]}
            hasRecentHit={hasRecentSpotlightHit && i === activeSpotlights}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* 3. Star Burst Sparkle (X=205) - Particle explosions */}
      <div
        className="melody-starburst-layer"
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AnimatePresence mode="popLayout">
          {starBurstTriggers.map((e, i) => (
            <StarBurst key={`sb-${e.time}-${i}`} startTime={e.time} currentTime={currentTime} mode={mode} intensity={intensity} isMobile={isMobile} />
          ))}
        </AnimatePresence>
      </div>

      {/* 4. Temporal Slider (Type 128) - Grayscale + motion blur overlay */}
      <AnimatePresence>
        {sliderActive && (
          <TemporalSliderOverlay currentTime={currentTime} mergedRanges={mergedSliderRanges} isMobile={isMobile} />
        )}
      </AnimatePresence>
    </>
  );
}

function RadarRing({ startTime, currentTime }) {
  const duration = 1.2;
  const elapsed = currentTime - startTime;
  const progress = Math.min(1, elapsed / duration);

  if (progress < 0 || progress >= 1) return null;

  // Water drop easing: fast initial expansion, then decelerating
  const easedProgress = 1 - Math.pow(1 - progress, 4);
  
  // High fidelity scaling: starts small, ends very large
  const scale = 0.5 + easedProgress * 12;
  
  // Fade out using quadratic curve for that "water drop" vanishing feel
  const opacity = Math.pow(1 - progress, 2);
  
  // Thinning out as it expands
  const strokeWidth = 2 * (1 - progress);

  return (
    <motion.div
      className="radar-ring"
      style={{
        position: 'absolute',
        width: 100,
        height: 100,
        willChange: 'transform, opacity',
        pointerEvents: 'none',
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {/* Subtle outer glow for the ring */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="rgba(129, 140, 248, 0.3)"
          strokeWidth={strokeWidth * 4}
          style={{ vectorEffect: 'non-scaling-stroke', filter: 'blur(3px)' }}
        />
        {/* Main sharp HD ring */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="rgba(129, 140, 248, 0.9)"
          strokeWidth={strokeWidth}
          style={{ vectorEffect: 'non-scaling-stroke' }}
        />
        {/* Inner core brightness */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth={strokeWidth * 0.5}
          style={{ vectorEffect: 'non-scaling-stroke' }}
        />
      </svg>
    </motion.div>
  );
}

function SpotlightBeam({ index, isActive, baseRotation, hasRecentHit, isMobile }) {
  const angle = (index / 5) * 360;
  const opacity = isActive && hasRecentHit ? 0.8 : 0.15;
  const blurAmount = isMobile ? 40 : 100;

  return (
    <motion.div
      className="spotlight-beam"
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: '150%',
        height: 200,
        background: `linear-gradient(to bottom, transparent 0%, rgba(99, 102, 241, 0.2) 30%, rgba(99, 102, 241, 0.5) 50%, transparent 100%)`,
        filter: `blur(${blurAmount}px)`,
        transformOrigin: 'center center',
        transform: `translate(-50%, -50%) rotate(${angle + baseRotation}deg)`,
        opacity,
        pointerEvents: 'none',
      }}
      animate={{
        opacity,
        rotate: angle + baseRotation,
      }}
      transition={{ duration: 0.15 }}
    />
  );
}

const BASE_STAR_COUNT = 18;
const DROP_STAR_COUNT = 32;
const BASE_STAR_COUNT_MOBILE = 10;
const DROP_STAR_COUNT_MOBILE = 18;

function StarBurst({ startTime, currentTime, mode, intensity, isMobile }) {
  const isDrop = mode && (mode.includes('DROP') || mode.includes('BUILD_UP_FINAL'));
  const multiplier = isDrop ? (1.5 + intensity) : 1.0;
  const explosionDuration = isDrop ? 0.8 : 0.6;
  const starCount = isDrop
    ? (isMobile ? DROP_STAR_COUNT_MOBILE : DROP_STAR_COUNT)
    : (isMobile ? BASE_STAR_COUNT_MOBILE : BASE_STAR_COUNT);

  const elapsed = currentTime - startTime;
  if (elapsed < 0 || elapsed > explosionDuration) return null;

  const particles = useMemo(() => {
    return Array.from({ length: starCount }, (_, i) => {
      const angle = (i / starCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = (80 + Math.random() * 120) * multiplier;
      const size = (4 + Math.random() * 6) * multiplier;
      return { angle, speed, size, id: i };
    });
  }, [isDrop, multiplier, starCount]);

  return (
    <div
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      {particles.map((p) => {
        // Use a power ease for a explosive start then slowing down
        const progress = elapsed / explosionDuration;
        const easedElapsed = 1 - Math.pow(1 - progress, 2);
        
        const dist = p.speed * easedElapsed * explosionDuration;
        const x = Math.cos(p.angle) * dist;
        const y = Math.sin(p.angle) * dist;
        const rotate = elapsed * 360;
        const opacity = Math.max(0, 1 - progress);

        return (
          <motion.div
            key={p.id}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: p.size,
              height: p.size,
              opacity,
              transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
            }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1, opacity }}
            transition={{ duration: 0.1 }}
          >
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgb(255,255,255)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: isDrop ? 'drop-shadow(0 0 5px rgba(255,255,255,0.8))' : 'none' }}
            >
              <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
            </svg>
          </motion.div>
        );
      })}
    </div>
  );
}

function TemporalSliderOverlay({ currentTime, mergedRanges, isMobile }) {
  const activeRange = mergedRanges.find(
    (r) => currentTime >= r.startTime && currentTime <= r.endTime
  );
  const duration = activeRange ? activeRange.endTime - activeRange.startTime : 1;
  const progress = activeRange
    ? (currentTime - activeRange.startTime) / duration
    : 0;

  const hueShift = progress * 330;
  const invertAmount = 0.05;
  const backdropFilter = isMobile
    ? `grayscale(100%) hue-rotate(${hueShift}deg) invert(${invertAmount})`
    : `grayscale(100%) blur(3px) hue-rotate(${hueShift}deg) invert(${invertAmount})`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 25,
        pointerEvents: 'none',
        backdropFilter,
        WebkitBackdropFilter: backdropFilter,
      }}
      className="temporal-slider-overlay temporal-slider-shake"
    />
  );
}

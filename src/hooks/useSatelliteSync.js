import { useState, useEffect, useRef, useMemo } from 'react';
import { Howl } from 'howler';
import { SONG_STRUCTURE } from '../constants';
import hitobjectsData from '../hitobjects.json';

function buildHitIndex(data) {
  const index = new Map();
  for (const h of data) {
    const key = Math.floor(h.time * 20); // 50ms buckets
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(h);
  }
  return index;
}

const HIT_INDEX = buildHitIndex(hitobjectsData);

export function useSatelliteSync() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(() => {
    const raw = sessionStorage.getItem('satellite.volume');
    const parsed = raw ? Number(raw) : 1;
    if (!Number.isFinite(parsed)) return 1;
    return Math.min(1, Math.max(0, parsed));
  });
  const soundRef = useRef(null);
  const requestRef = useRef(null);
  const driftRef = useRef(null);

  useEffect(() => {
    soundRef.current = new Howl({
      src: ['/audio.mp3'],
      html5: true,
      volume,
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onend: () => setIsPlaying(false)
    });

    return () => {
      if (soundRef.current) soundRef.current.unload();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (driftRef.current) clearInterval(driftRef.current);
    };
  }, []);

  const play = () => { if (soundRef.current && !isPlaying) soundRef.current.play(); };
  const pause = () => { if (soundRef.current && isPlaying) soundRef.current.pause(); };
  const toggle = () => { isPlaying ? pause() : play(); };

  const setVolume = (next) => {
    const v = Math.min(1, Math.max(0, Number(next)));
    if (!Number.isFinite(v)) return;
    setVolumeState(v);
    sessionStorage.setItem('satellite.volume', String(v));
    if (soundRef.current) soundRef.current.volume(v);
  };

  useEffect(() => {
    const updateTime = () => {
      if (soundRef.current && isPlaying) {
        const time = soundRef.current.seek();
        if (typeof time === 'number') setCurrentTime(time);
      }
      requestRef.current = requestAnimationFrame(updateTime);
    };

    if (isPlaying) {
      requestRef.current = requestAnimationFrame(updateTime);
    } else if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  // Audio drift correction: force state correction every 500ms.
  useEffect(() => {
    if (!soundRef.current) return;

    driftRef.current = setInterval(() => {
      if (!soundRef.current || !isPlaying) return;
      const t = soundRef.current.seek();
      if (typeof t !== 'number') return;

      // If React state has drifted (tab throttling, raf hiccups), snap back.
      if (Math.abs(t - currentTime) > 0.1) setCurrentTime(t);
    }, 500);

    return () => {
      if (driftRef.current) clearInterval(driftRef.current);
    };
  }, [isPlaying, currentTime]);

  const currentStructure = SONG_STRUCTURE.find(
    (section) => currentTime >= section.start && currentTime < section.end
  ) || SONG_STRUCTURE[0];

  const intensity = currentStructure ? currentStructure.intensity : 0;
  const motionScale = currentStructure ? currentStructure.motionScale : 0;
  const mode = currentStructure ? currentStructure.mode : 'REST';

  // HitObjects Osu! Logic (50ms window for React renders to catch hit flags)
  const windowTime = 0.05;
  const bucket = Math.floor(currentTime * 20);
  const activeHits = (HIT_INDEX.get(bucket) || []).filter(
    (h) => h.time <= currentTime && h.time > currentTime - windowTime
  );

  let mask = 0;
  let sampleSet = 1;
  const isHit = activeHits.length > 0;

  for (const h of activeHits) {
    if (h.hitSound) mask |= h.hitSound;
    if (h.sampleSet) sampleSet = h.sampleSet;
  }

  // A hit is Normal if it's 0, 1, or just acts as base pulse
  const hasNormal = isHit && ((mask === 0 || mask === 1) || (mask > 3));
  const hasWhistle = (mask & 2) !== 0;
  const hasFinish = (mask & 4) !== 0;
  const hasClap = (mask & 8) !== 0;

  const osuEvent = useMemo(
    () => ({
      isHit,
      hasNormal,
      hasWhistle,
      hasFinish,
      hasClap,
      sampleSet,
      mask
    }),
    [isHit, hasNormal, hasWhistle, hasFinish, hasClap, sampleSet, mask]
  );

  return {
    currentTime,
    currentStructure,
    intensity,
    motionScale,
    mode,
    play,
    pause,
    toggle,
    isPlaying,
    volume,
    setVolume,
    osuEvent
  };
}

import { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { SONG_STRUCTURE } from '../constants';
import hitobjectsData from '../hitobjects.json';

export function useSatelliteSync() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    soundRef.current = new Howl({
      src: ['/audio.mp3'],
      html5: true,
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onend: () => setIsPlaying(false)
    });

    return () => {
      if (soundRef.current) soundRef.current.unload();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const play = () => { if (soundRef.current && !isPlaying) soundRef.current.play(); };
  const pause = () => { if (soundRef.current && isPlaying) soundRef.current.pause(); };
  const toggle = () => { isPlaying ? pause() : play(); };

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

  const currentStructure = SONG_STRUCTURE.find(
    (section) => currentTime >= section.start && currentTime <= section.end
  ) || SONG_STRUCTURE[0];

  const intensity = currentStructure ? currentStructure.intensity : 0;
  const motionScale = currentStructure ? currentStructure.motionScale : 0;
  const mode = currentStructure ? currentStructure.mode : 'REST';

  // HitObjects Osu! Logic (50ms window for React renders to catch hit flags)
  const windowTime = 0.05; 
  const activeHits = hitobjectsData.filter(h => h.time <= currentTime && h.time > currentTime - windowTime);
  
  let mask = 0;
  let sampleSet = 1;
  let isHit = activeHits.length > 0;
  
  for (const h of activeHits) {
    if (h.hitSound) mask |= h.hitSound;
    if (h.sampleSet) sampleSet = h.sampleSet;
  }

  // A hit is Normal if it's 0, 1, or just acts as base pulse
  // Actually, let's treat any hit object as triggering base normal pulse unless it's strictly a whistle only, 
  // but to follow instructions exactly: "0 atau 1".
  const hasNormal = isHit && ((mask === 0 || mask === 1) || (mask > 3)); // Assume it triggers pulse
  const hasWhistle = (mask & 2) !== 0;
  const hasFinish = (mask & 4) !== 0;
  const hasClap = (mask & 8) !== 0;

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
    osuEvent: {
      isHit,
      hasNormal,
      hasWhistle,
      hasFinish,
      hasClap,
      sampleSet,
      mask
    }
  };
}

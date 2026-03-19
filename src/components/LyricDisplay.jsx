import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LYRIC_TIMINGS } from '../constants';
import '../index.css';

export function LyricDisplay({ currentTime, mode }) {
  const activeLyricIndex = useMemo(() => {
    let index = -1;
    for (let i = 0; i < LYRIC_TIMINGS.length; i++) {
        const lyric = LYRIC_TIMINGS[i];
        const nextLyric = LYRIC_TIMINGS[i + 1];
        
        if (currentTime >= lyric.time) {
            if (!nextLyric || currentTime < nextLyric.time) {
                const duration = nextLyric ? Math.min(nextLyric.time - lyric.time, 4) : 4; 
                if (currentTime < lyric.time + duration) {
                    index = i;
                }
            }
        }
    }
    return index;
  }, [currentTime]);

  const activeLyric = activeLyricIndex !== -1 ? LYRIC_TIMINGS[activeLyricIndex] : null;
  const isVerse2 = mode === 'VERSE_2' || mode === 'LOST_MELODY';

  return (
    <div className="lyric-container">
      <AnimatePresence mode="wait">
        {activeLyric && activeLyric.text && mode !== 'OUTRO' && (
          <motion.div
            key={activeLyricIndex}
            initial={{ opacity: 0, y: 10, letterSpacing: '0.2em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '0.05em' }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`lyric-text ${isVerse2 ? 'lyric-ink-bleed' : ''}`}
          >
            {activeLyric.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

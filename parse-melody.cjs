/**
 * parse-melody.cjs
 * Parses melody-specific lanes from .osu file and outputs to src/melody_events.json
 * ONLY touches melody_events.json - NEVER modifies hitobjects.json
 *
 * Lane mapping (X coordinate):
 *   X=103  → Radar Satellite Beep (Lane F)
 *   X=205  → Star Burst Sparkle (Lane Space)
 *   X=308  → Concert Spotlight (Lane J)
 *   Type 128 → Temporal Slider (Hold notes)
 */

const fs = require('fs');
const path = require('path');

const OSU_FILE = 'Camellia - S.A.T.E.L.L.I.T.E. (Blocko) [New Difficulty].md';
const OUTPUT_PATH = path.join(__dirname, 'src', 'melody_events.json');

const osuPath = path.join(__dirname, OSU_FILE);
const content = fs.readFileSync(osuPath, 'utf8');
const lines = content.split('\n').map((l) => l.trim());

let parseMode = null;
const radar = [];      // X=103
const spotlight = [];  // X=308
const starBurst = [];  // X=205
const sliders = [];    // Type 128

for (const line of lines) {
  if (!line || line.startsWith('//')) continue;
  if (line === '[HitObjects]') {
    parseMode = 'hitobjects';
    continue;
  }
  if (line.startsWith('[')) {
    parseMode = null;
    continue;
  }

  if (parseMode === 'hitobjects') {
    const parts = line.split(',');
    if (parts.length < 5) continue;

    const x = parseInt(parts[0], 10);
    const time = parseFloat(parts[2]);
    const type = parseInt(parts[3], 10);

    // Melody lane hits (circles, type 1 or similar)
    const timeSec = time / 1000;

    if (x === 103) {
      radar.push({ time: timeSec });
    } else if (x === 205) {
      starBurst.push({ time: timeSec });
    } else if (x === 308) {
      spotlight.push({ time: timeSec });
    }

    // Sliders / Hold notes (type 128)
    if (type === 128 && parts.length >= 6) {
      const extended = parts[5].split(':');
      const endTimeMs = parseFloat(extended[0], 10);
      const endTimeSec = endTimeMs / 1000;
      sliders.push({
        startTime: timeSec,
        endTime: endTimeSec,
      });
    }
  }
}

// Sort all arrays by time
radar.sort((a, b) => a.time - b.time);
spotlight.sort((a, b) => a.time - b.time);
starBurst.sort((a, b) => a.time - b.time);
sliders.sort((a, b) => a.startTime - b.startTime);

const output = {
  radar,
  spotlight,
  starBurst,
  sliders,
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
console.log(`Parsed melody events and saved to ${OUTPUT_PATH}`);
console.log(`  Radar (X=103): ${radar.length}`);
console.log(`  Spotlight (X=308): ${spotlight.length}`);
console.log(`  StarBurst (X=205): ${starBurst.length}`);
console.log(`  Sliders (Type 128): ${sliders.length}`);

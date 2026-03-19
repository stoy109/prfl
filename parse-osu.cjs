const fs = require('fs');

const osuData = fs.readFileSync('CameSattelite.md', 'utf8');

const lines = osuData.split('\n').map(l => l.trim());

let parseMode = null;
const timingPoints = [];
const hitObjects = [];

for (const line of lines) {
  if (!line || line.startsWith('//')) continue; // skip empty and comments
  if (line === '[TimingPoints]') {
    parseMode = 'timing';
    continue;
  }
  if (line === '[HitObjects]') {
    parseMode = 'hitobjects';
    continue;
  }
  if (line.startsWith('[')) {
    parseMode = null;
    continue;
  }

  if (parseMode === 'timing') {
    const parts = line.split(',');
    if (parts.length >= 8) {
      timingPoints.push({
        time: parseFloat(parts[0]),
        sampleSet: parseInt(parts[3]) // 1 = Normal, 2 = Soft, 3 = Drum
      });
    }
  } else if (parseMode === 'hitobjects') {
    const parts = line.split(',');
    if (parts.length >= 5) {
      hitObjects.push({
        time: parseFloat(parts[2]),
        hitSound: parseInt(parts[4])
      });
    }
  }
}

// Sort just in case
timingPoints.sort((a, b) => a.time - b.time);
hitObjects.sort((a, b) => a.time - b.time);

// Match hitObjects to their timing points to get sampleSet
const finalEvents = [];

let currentTimingIndex = 0;
for (const obj of hitObjects) {
  // Advance timing point if necessary
  while (
    currentTimingIndex + 1 < timingPoints.length && 
    timingPoints[currentTimingIndex + 1].time <= obj.time
  ) {
    currentTimingIndex++;
  }

  const sampleSet = timingPoints.length > 0 ? timingPoints[currentTimingIndex].sampleSet : 1;

  finalEvents.push({
    time: obj.time / 1000, // convert ms to seconds
    hitSound: obj.hitSound,
    sampleSet: sampleSet
  });
}

// Write to JSON
fs.writeFileSync('src/hitobjects.json', JSON.stringify(finalEvents));
console.log(`Parsed ${finalEvents.length} hit objects and saved to src/hitobjects.json`);

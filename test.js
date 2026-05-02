import { WORLDS, generateHeightmap } from './src/worlds.js';

let error = false;
for (let i = 0; i < WORLDS.length; i++) {
  try {
    const map = generateHeightmap(WORLDS[i], 128);
    for (let j = 0; j < map.length; j++) {
      if (isNaN(map[j])) {
        console.error("NaN found at world", i, "idx", j);
        error = true;
      }
      if (map[j] === undefined) {
        console.error("undefined found at world", i, "idx", j);
        error = true;
      }
    }
  } catch (e) {
    console.error("Error generating world", i, e);
    error = true;
  }
}
if (!error) console.log("All maps generated perfectly without NaNs.");

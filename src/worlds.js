export const WORLDS = [
  {
    id: 10,
    name: "THE CITY",
    colorBase: "#1a1a2e",
    colorHigh: "#00fff5",
    fog: "#0a0a1a",
    fogNear: 20,
    fogFar: 60,
    sky: "#0f0520",
    camY: 35,
  },
  {
    id: 9,
    name: "VOLCANIC RIDGE",
    colorBase: "#ff4400",
    colorHigh: "#1a1210",
    fog: "#1a0800",
    fogNear: 30,
    fogFar: 70,
    sky: "#1a0500",
    camY: 30,
  },
  {
    id: 8,
    name: "OCEAN ARCHIPELAGO",
    colorBase: "#004466",
    colorHigh: "#2d6a4f",
    fog: "#87ceeb",
    fogNear: 40,
    fogFar: 90,
    sky: "#5eadd0",
    camY: 12,
  },
  {
    id: 7,
    name: "MOUNTAIN RANGE",
    colorBase: "#3d2b1f",
    colorHigh: "#e8e8e8",
    fog: "#c8d8e8",
    fogNear: 50,
    fogFar: 100,
    sky: "#b8d4e8",
    camY: 40,
  },
  {
    id: 6,
    name: "DARK FOREST",
    colorBase: "#061206",
    colorHigh: "#4ade80",
    fog: "#0a1f0a",
    fogNear: 15,
    fogFar: 45,
    sky: "#0f1f0a",
    camY: 16,
  },
  {
    id: 5,
    name: "DESERT DUNES",
    colorBase: "#c4922a",
    colorHigh: "#e8c872",
    fog: "#d4a060",
    fogNear: 35,
    fogFar: 80,
    sky: "#c4842a",
    camY: 22,
  },
  {
    id: 4,
    name: "RIVER VALLEY",
    colorBase: "#2a4858",
    colorHigh: "#4a7c59",
    fog: "#a8c8a8",
    fogNear: 45,
    fogFar: 95,
    sky: "#7ab89a",
    camY: 20,
  },
  {
    id: 3,
    name: "FROZEN TUNDRA",
    colorBase: "#a8c4d8",
    colorHigh: "#e8ecf0",
    fog: "#c8d4e0",
    fogNear: 30,
    fogFar: 70,
    sky: "#b0b8c8",
    camY: 12,
  },
  {
    id: 2,
    name: "COASTAL CLIFF",
    colorBase: "#3a2a1a",
    colorHigh: "#c49a6c",
    fog: "#e8a840",
    fogNear: 40,
    fogFar: 85,
    sky: "#e8a860",
    camY: 24,
  },
  {
    id: 1,
    name: "THE HILL",
    colorBase: "#6aaa5a",
    colorHigh: "#c8b44a",
    fog: "#ffe8c0",
    fogNear: 60,
    fogFar: 120,
    sky: "#f0d888",
    camY: 18,
  },
  {
    id: 0,
    name: "FINALE",
    colorBase: "#1a73e8",
    colorHigh: "#fbbc05",
    fog: "#1a73e8",
    fogNear: 60,
    fogFar: 200,
    sky: "#1a73e8",
    camY: 30,
  },
];

export function generateHeightmap(world, res) {
  const map = new Float32Array(res * res);

  // Generate bitmap mask using canvas for precise number silhouettes
  const canvas = document.createElement("canvas");
  canvas.width = res;
  canvas.height = res;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, res, res);

  // Large blurred numbers for rolling hills shape
  ctx.filter = "blur(1px)";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (world.id === 0) {
    ctx.textAlign = "left";
    const fontSize = res * 0.25;
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, 'Arial Black', sans-serif`;
    const wI = ctx.measureText("I").width;
    const wO = ctx.measureText("O").width;
    
    ctx.font = `900 ${fontSize * 0.7}px system-ui, -apple-system, 'Arial Black', sans-serif`;
    const wSlash = ctx.measureText("/").width;
    
    const gap = res * 0.015;
    const totalW = wI + gap + wSlash + gap + wO;
    
    let x = (res - totalW) / 2;
    
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, 'Arial Black', sans-serif`;
    ctx.fillText("I", x, res / 2);
    x += wI + gap;
    
    ctx.font = `900 ${fontSize * 0.7}px system-ui, -apple-system, 'Arial Black', sans-serif`;
    ctx.fillText("/", x, res / 2);
    x += wSlash + gap - res * 0.01; // slight optical adjustment for the slash overhang
    
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, 'Arial Black', sans-serif`;
    ctx.fillText("O", x, res / 2);
    
    ctx.textAlign = "center"; // restore
  } else {
    const text = world.id.toString();
    let fontSize = res * 0.45;
    if (text.length === 2) fontSize = res * 0.35;
    if (text.length > 2) fontSize = res * 0.25;
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, 'Arial Black', sans-serif`;
    ctx.fillText(text, res / 2, res / 2);
  }

  const imgData = ctx.getImageData(0, 0, res, res).data;

  for (let i = 0; i < res; i++) {
    for (let j = 0; j < res; j++) {
      const idx = i * res + j;
      const nx = j / res - 0.5,
        ny = i / res - 0.5;
      const dist = Math.sqrt(nx * nx + ny * ny);
      const mask = imgData[idx * 4] / 255.0; // Number shape mask 0..1

      let h = 0;

      // New detailed noise octaves for 256 res
      const n1 = Math.sin(nx * 15) * Math.cos(ny * 15);
      const n2 = Math.sin(nx * 35 + ny * 20) * Math.cos(ny * 35 - nx * 20);
      const n3 = Math.sin(nx * 75) * Math.cos(ny * 75);
      const n4 = Math.sin(nx * 150) * Math.cos(ny * 150);

      if (world.id === 10) {
        // The City - sharp geometric distinct text
        h =
          mask > 0.4
            ? 15 + Math.floor(Math.abs(n1 * 5)) + Math.abs(n3)
            : Math.floor(Math.abs(n2 * 3)) + Math.abs(n4 * 2);
      } else if (world.id === 9) {
        // Volcanic Ridge - number is a high flat plateau to stand out, surrounded by low lava
        h =
          mask > 0.4
            ? 20 + Math.abs(n3 * 2)
            : 2 + Math.abs(n1 * 5) + Math.abs(n2 * 2);
      } else if (world.id === 8) {
        // Ocean Archipelago - number is a group of steep islands
        h = mask > 0.2 ? 6 + n1 * 2 + n2 : 0.5;
      } else if (world.id === 7) {
        // Mountain Range - number rises as extremely high peaks
        h = mask * 25 + Math.abs(n1 * 10) + Math.abs(n2 * 5) + n3 * 2;
      } else if (world.id === 6) {
        // Dark Forest - number is an empty clearing with spikes of trees outside
        h = mask > 0.4 ? 2 + n2 : n4 > 0.5 ? 12 : 3 + n1 * 2;
      } else if (world.id === 5) {
        // Desert Dunes - huge dune the shape of the number
        h =
          mask * 15 +
          Math.abs(Math.sin(nx * 30 + n1 * 2)) * 4 +
          n2 +
          Math.abs(n4 * 0.5);
      } else if (world.id === 4) {
        // River Valley - number is a deep canyon
        h = mask > 0.3 ? 1 + n3 : 10 + Math.abs(n1 * 5) + Math.abs(n2 * 3);
      } else if (world.id === 3) {
        // Frozen Tundra - number is sharp ice spikes
        h = mask > 0.4 ? 10 + n2 * 2 + Math.abs(n4 * 3) : 3 + n1;
      } else if (world.id === 2) {
        // Coastal Cliff - number forms a massive coastal drop-off
        h = mask > 0.5 ? 15 + n2 * 2 : 1 + n3;
      } else if (world.id === 1) {
        // The Hill - very peaceful, pronounced smooth hill
        h = mask * 12 + n1 * 2 + n2 * 1;
      } else if (world.id === 0) {
        // Finale I/O
        h =
          mask > 0.4
            ? 25 + Math.abs(n2 * 3) + Math.abs(n4)
            : Math.abs(n1 * 3) + Math.abs(n3) + Math.abs(n4 * 0.5);
      }

      map[idx] = h > 0 ? h : 0;
    }
  }
  return map;
}

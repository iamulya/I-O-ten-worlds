import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import { WORLDS, generateHeightmap } from "./worlds.js";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog("#000", 10, 50);

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  1,
  300,
);
camera.position.set(0, 12, 26);

const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
dirLight.position.set(50, 80, 30);
scene.add(dirLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 0.8);
scene.add(hemiLight);

const res = 256;
const geom = new THREE.PlaneGeometry(100, 100, res - 1, res - 1);
geom.rotateX(-Math.PI / 2);

const colors = new Float32Array(res * res * 3);
geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
geom.computeVertexNormals();

const mat = new THREE.MeshStandardMaterial({
  vertexColors: true,
  flatShading: true,
  roughness: 0.85,
  metalness: 0.1,
  side: THREE.DoubleSide,
});
const terrain = new THREE.Mesh(geom, mat);
scene.add(terrain);

// Water Plane
const waterGeom = new THREE.PlaneGeometry(100, 100, 32, 32);
waterGeom.rotateX(-Math.PI / 2);
const waterMat = new THREE.MeshStandardMaterial({
  color: 0x006699,
  transparent: true,
  opacity: 0.8,
  roughness: 0.1,
  metalness: 0.8,
  flatShading: true,
});
const water = new THREE.Mesh(waterGeom, waterMat);
water.position.y = 0.8;
water.visible = false;
scene.add(water);

// Lone Tree
const treeGrp = new THREE.Group();
const canopy = new THREE.Mesh(
  new THREE.ConeGeometry(0.8, 2.5, 6),
  new THREE.MeshStandardMaterial({
    color: 0x2d5a27,
    flatShading: true,
    roughness: 0.8,
  }),
);
canopy.position.y = 1.25 + 0.6;
const trunk = new THREE.Mesh(
  new THREE.CylinderGeometry(0.15, 0.2, 1.2, 5),
  new THREE.MeshStandardMaterial({
    color: 0x5a3a1a,
    flatShading: true,
    roughness: 1.0,
  }),
);
trunk.position.y = 0.6;
treeGrp.add(canopy);
treeGrp.add(trunk);
treeGrp.position.set(0, -5, 0); // start hidden below
treeGrp.visible = false;
scene.add(treeGrp);

// Pre-compute maps
const maps = WORLDS.map((w) => generateHeightmap(w, res));
window._test_maps = maps;

let currentWorldIdx = 0;
let time = 0;
let state = "MATERIALIZE"; // INIT, MATERIALIZE, FLYOVER, REVEAL_RISE, REVEAL_HOLD, REVEAL_DESCEND, DISSOLVE
let stateTime = 0;
let transitionProgress = 0;

const posAttr = geom.attributes.position;
const colAttr = geom.attributes.color;
const origY = new Float32Array(posAttr.count);
const delays = new Float32Array(posAttr.count);

for (let i = 0; i < delays.length; i++) {
  delays[i] = Math.random() * 0.05;
}

const colorBase = new THREE.Color();
const colorHigh = new THREE.Color();
const fogColTarget = new THREE.Color();

function updateHUD() {
  document.getElementById("progress-bar").style.width =
    (currentWorldIdx + 1) * 10 + "%";
}

function processVertex(i, dt, isDissolve) {
  const w = WORLDS[currentWorldIdx];
  const targetMap = maps[currentWorldIdx];
  const yTar = isDissolve ? -5 : targetMap[i];

  // Spring physics (approx)
  let yIdx = i * 3 + 1; // y pos in flat position array
  let currentY = posAttr.array[yIdx];

  if (stateTime > delays[i]) {
    currentY += (yTar - currentY) * dt * 20.0; // simple P-controller instead of strict spring
  }
  posAttr.array[yIdx] = currentY;

  // Colors
  if (!isDissolve && state !== "VOID") {
    const nx = (i % res) / res - 0.5;
    const ny = Math.floor(i / res) / res - 0.5;
    let maxH = 8;
    if (w.id === 10) maxH = 25;
    else if (w.id === 9) maxH = 25;
    else if (w.id === 7) maxH = 35;
    else if (w.id === 5) maxH = 20;
    else if (w.id === 2) maxH = 17;
    const hRatio = Math.max(0, Math.min(1, currentY / maxH));

    let rTarget, gTarget, bTarget;

    if (w.id === 0) {
      if (currentY > 15) {
        // Bright white for the perfectly discernible I/O text
        rTarget = 1;
        gTarget = 1;
        bTarget = 1;
      } else {
        // Finale color cycle for the background floor
        const t = (((time * 2 + nx * 5 + ny * 5) % 4) + 4) % 4;
        if (t < 1) {
          rTarget = 1;
          gTarget = 0.2;
          bTarget = 0.2;
        } // Red
        else if (t < 2) {
          rTarget = 0.2;
          gTarget = 0.7;
          bTarget = 0.3;
        } // Green
        else if (t < 3) {
          rTarget = 0.9;
          gTarget = 0.7;
          bTarget = 0.1;
        } // Yellow
        else {
          rTarget = 0.2;
          gTarget = 0.4;
          bTarget = 0.9;
        } // Blue
      }
    } else {
      rTarget = THREE.MathUtils.lerp(colorBase.r, colorHigh.r, hRatio);
      gTarget = THREE.MathUtils.lerp(colorBase.g, colorHigh.g, hRatio);
      bTarget = THREE.MathUtils.lerp(colorBase.b, colorHigh.b, hRatio);
    }

    colAttr.array[i * 3] = THREE.MathUtils.lerp(
      colAttr.array[i * 3],
      rTarget,
      dt * 15,
    );
    colAttr.array[i * 3 + 1] = THREE.MathUtils.lerp(
      colAttr.array[i * 3 + 1],
      gTarget,
      dt * 15,
    );
    colAttr.array[i * 3 + 2] = THREE.MathUtils.lerp(
      colAttr.array[i * 3 + 2],
      bTarget,
      dt * 15,
    );
  }
}

updateHUD();
colorBase.set(WORLDS[0].colorBase);
colorHigh.set(WORLDS[0].colorHigh);
fogColTarget.set(WORLDS[0].fog);
scene.background = new THREE.Color(WORLDS[0].sky);
scene.fog.color.set(WORLDS[0].fog);

// Start everything below initially
for (let i = 0; i < posAttr.count; i++) posAttr.array[i * 3 + 1] = -5;

const clock = new THREE.Clock();
function animate() {
  try {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1);
    time += dt;
    stateTime += dt;

    const w = WORLDS[currentWorldIdx];

    // State machine transitions
    if (state === "MATERIALIZE" && stateTime > 0.1) {
      state = "FLYOVER";
      stateTime = 0;
    } else if (state === "FLYOVER" && stateTime > 0.15) {
      state = "REVEAL_RISE";
      stateTime = 0;
    } else if (state === "REVEAL_RISE" && stateTime > 0.2) {
      state = "REVEAL_HOLD";
      stateTime = 0;
    } else if (state === "REVEAL_HOLD" && stateTime > 0.25) {
      if (currentWorldIdx === 10) {
        state = "DONE";
        stateTime = 0;
      } else {
        state = "REVEAL_DESCEND";
        stateTime = 0;
      }
    } else if (state === "REVEAL_DESCEND" && stateTime > 0.1) {
      state = "DISSOLVE";
      stateTime = 0;
    } else if (state === "DISSOLVE" && stateTime > 0.05) {
      state = "VOID";
      stateTime = 0;
    } else if (state === "VOID" && stateTime > 0.05) {
      currentWorldIdx = (currentWorldIdx + 1) % WORLDS.length;
      updateHUD();
      colorBase.set(WORLDS[currentWorldIdx].colorBase);
      colorHigh.set(WORLDS[currentWorldIdx].colorHigh);
      fogColTarget.set(WORLDS[currentWorldIdx].fog);
      scene.background = new THREE.Color(WORLDS[currentWorldIdx].sky);
      for (let i = 0; i < delays.length; i++) delays[i] = Math.random() * 0.05;
      camera.position.z = 26;
      state = "MATERIALIZE";
      stateTime = 0;
    }

    // Vertices / Terrain logic
    const isDissolve = state === "DISSOLVE" || state === "VOID";
    for (let i = 0; i < posAttr.count; i++) {
      processVertex(i, dt, isDissolve);
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    geom.computeVertexNormals();

    // Water animation
    if (w.id === 8 || w.id === 4 || w.id === 2) {
      water.visible = true;
      water.position.y = 1.5;
      water.material.opacity = isDissolve
        ? THREE.MathUtils.lerp(water.material.opacity, 0, dt * 5)
        : THREE.MathUtils.lerp(water.material.opacity, 0.7, dt * 2);

      const wPos = waterGeom.attributes.position;
      for (let i = 0; i < wPos.count; i++) {
        const x = wPos.array[i * 3];
        const z = wPos.array[i * 3 + 2];
        wPos.array[i * 3 + 1] =
          Math.sin(x * 2 + time * 2) * 0.1 + Math.cos(z * 2 + time) * 0.1;
      }
      wPos.needsUpdate = true;
      waterGeom.computeVertexNormals();
    } else {
      water.visible = false;
      water.material.opacity = 0;
    }

    // Tree animation
    if (w.id === 1) {
      treeGrp.visible = true;
      const treeTargetY = isDissolve ? -5 : 5; // Hill peak approx
      treeGrp.position.y += (treeTargetY - treeGrp.position.y) * dt * 15.0;
    } else {
      treeGrp.visible = false;
      treeGrp.position.y = -5;
    }

    // Camera / Environment logic
    let camTargetY = w.camY;
    let camTargetPitch = (-30 * Math.PI) / 180;
    let camTargetZ = 26;
    let fogFarTarget = w.fogFar;

    if (state === "MATERIALIZE") {
      camTargetZ = 26 - stateTime * 30;
    } else if (state === "FLYOVER") {
      camTargetZ = 26 - 0.1 * 30 - stateTime * 30;
    } else if (
      state === "REVEAL_RISE" ||
      state === "REVEAL_HOLD" ||
      state === "REVEAL_DESCEND" ||
      state === "DONE"
    ) {
      const prog =
        state === "REVEAL_RISE"
          ? stateTime / 0.2
          : state === "REVEAL_DESCEND"
            ? 1.0 - stateTime / 0.1
            : 1.0;
      camTargetY = THREE.MathUtils.lerp(
        w.camY,
        Math.max(50, w.camY + 20),
        THREE.MathUtils.smootherstep(prog, 0, 1),
      );
      camTargetPitch = THREE.MathUtils.lerp(
        (-30 * Math.PI) / 180,
        (-90 * Math.PI) / 180,
        THREE.MathUtils.smootherstep(prog, 0, 1),
      );
      camTargetZ = THREE.MathUtils.lerp(
        18.5, // Approx end of FLYOVER (26 - 0.25*30)
        0,
        THREE.MathUtils.smootherstep(prog, 0, 1),
      );
    } else if (state === "DISSOLVE") {
      camTargetZ = 0;
      fogFarTarget = 5;
    } else if (state === "VOID") {
      camTargetZ = 0;
    }

    camera.position.z += (camTargetZ - camera.position.z) * dt * 10.0;
    camera.position.y += (camTargetY - camera.position.y) * dt * 10.0;
    camera.position.x = Math.sin(time / 1.2) * 1.0; // gentle sway

    // Smooth camera rotation
    const curRot = camera.rotation.x;
    camera.rotation.set(curRot + (camTargetPitch - curRot) * dt * 10.0, 0, 0);

    // Fog interpolation
    scene.fog.color.lerp(fogColTarget, dt * 10.0);
    scene.fog.near += (w.fogNear - scene.fog.near) * dt * 10.0;
    scene.fog.far += (fogFarTarget - scene.fog.far) * dt * 20.0; // faster fog far transition

    renderer.render(scene, camera);
  } catch (e) {
    console.error(e);
    throw e;
  }
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

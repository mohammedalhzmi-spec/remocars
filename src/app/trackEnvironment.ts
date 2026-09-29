import * as THREE from 'three';
import { TrackLayout } from '../data/trackLayouts';

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const t = THREE.MathUtils.clamp((value - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

function hashCell(x: number, z: number, seed: number): number {
  const value = Math.sin(x * 127.1 + z * 311.7 + seed * 74.7) * 43758.5453123;
  return (value - Math.floor(value)) * 2 - 1;
}

function valueNoise(x: number, z: number, seed: number): number {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const tx = x - x0;
  const tz = z - z0;
  const sx = tx * tx * (3 - 2 * tx);
  const sz = tz * tz * (3 - 2 * tz);
  const a = THREE.MathUtils.lerp(hashCell(x0, z0, seed), hashCell(x0 + 1, z0, seed), sx);
  const b = THREE.MathUtils.lerp(hashCell(x0, z0 + 1, seed), hashCell(x0 + 1, z0 + 1, seed), sx);
  return THREE.MathUtils.lerp(a, b, sz);
}

function terrainColor(trackId: string, height: number, variation: number): THREE.Color {
  const normalized = THREE.MathUtils.clamp(0.5 + variation * 0.34 + height * 0.012, 0, 1);
  let low: number;
  let high: number;
  if (trackId.includes('snow') || trackId.includes('mountain')) {
    low = 0x59656b;
    high = 0xe6edf0;
  } else if (trackId.includes('volcano')) {
    low = 0x332426;
    high = 0x865444;
  } else if (trackId.includes('desert') || trackId.includes('canyon')) {
    low = 0x806043;
    high = 0xd9b77d;
  } else if (trackId.includes('neon') || trackId.includes('drift')) {
    low = 0x111b2a;
    high = 0x344455;
  } else if (trackId.includes('city')) {
    low = 0x353e47;
    high = 0x74818a;
  } else if (trackId.includes('forest') || trackId.includes('river')) {
    low = 0x263e2b;
    high = 0x58754a;
  } else {
    low = 0x385a49;
    high = 0x82916c;
  }
  return new THREE.Color(low).lerp(new THREE.Color(high), normalized);
}

export function createTerrainMesh(curve: THREE.CatmullRomCurve3, layout: TrackLayout, trackId: string): THREE.Mesh {
  const segments = 112;
  const extent = 720;
  const geometry = new THREE.PlaneGeometry(extent, extent, segments, segments);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(position.count * 3);
  const seed = trackId.split('').reduce((total, character) => total + character.charCodeAt(0), 0);
  const samples = Array.from({ length: 144 }, (_, index) => curve.getPointAt(index / 144));
  const snow = trackId.includes('snow') || trackId.includes('mountain');
  const desert = trackId.includes('desert') || trackId.includes('canyon');
  const volcano = trackId.includes('volcano');
  const city = trackId.includes('neon') || trackId.includes('drift') || trackId.includes('city');
  const forest = trackId.includes('forest') || trackId.includes('river');
  const amplitude = snow ? 34 : desert ? 16 : forest ? 13 : volcano ? 23 : city ? 5 : 18;

  for (let index = 0; index < position.count; index++) {
    const x = position.getX(index);
    const z = -position.getY(index);
    const broad = valueNoise(x * 0.009, z * 0.009, seed);
    const medium = valueNoise(x * 0.027, z * 0.027, seed + 31);
    const fine = valueNoise(x * 0.075, z * 0.075, seed + 79);
    const variation = broad * 0.58 + medium * 0.29 + fine * 0.13;

    let nearestSquared = Number.POSITIVE_INFINITY;
    for (const sample of samples) {
      const dx = sample.x - x;
      const dz = sample.z - z;
      const distanceSquared = dx * dx + dz * dz;
      if (distanceSquared < nearestSquared) nearestSquared = distanceSquared;
    }
    const distance = Math.sqrt(nearestSquared);
    const shoulderBlend = smoothstep(layout.width * 0.62, layout.width * 2.45, distance);
    let height = amplitude * variation + (snow ? 12 : desert ? 5 : forest ? 2.5 : volcano ? 8 : city ? -1.2 : 3);
    if (snow) height = 9 + Math.max(0, broad) * 30 + medium * 8 + fine * 2;
    if (desert) height = 5 + broad * 10 + Math.sin((x + z * 0.35) * 0.018) * 3 + fine * 1.5;
    if (volcano) height = 8 + Math.max(0, broad) * 19 + medium * 7 + Math.sin((x - z * 0.4) * 0.023) * 2;
    height = THREE.MathUtils.lerp(-0.2, height, shoulderBlend);

    if (trackId.includes('coastal')) {
      const islandBlend = 1 - smoothstep(190, 292, Math.hypot(x, z));
      height = THREE.MathUtils.lerp(-5.2, height, islandBlend);
    }

    position.setZ(index, height);
    const color = terrainColor(trackId, height, variation);
    const shade = 0.91 + (fine + 1) * 0.045;
    color.multiplyScalar(shade);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0, side: THREE.DoubleSide });
  const terrain = new THREE.Mesh(geometry, material);
  terrain.receiveShadow = true;
  terrain.frustumCulled = false;
  return terrain;
}

export function createSkyDome(topColor: number, horizonColor: number): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(850, 32, 20);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(position.count * 3);
  const top = new THREE.Color(topColor);
  const horizon = new THREE.Color(horizonColor);
  for (let index = 0; index < position.count; index++) {
    const height = THREE.MathUtils.clamp(position.getY(index) / 850, 0, 1);
    const color = horizon.clone().lerp(top, smoothstep(0.02, 0.92, height));
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const sky = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, depthWrite: false, fog: false }));
  sky.renderOrder = -10;
  sky.frustumCulled = false;
  return sky;
}

export function createCoastalWater(): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(1200, 1200, 1, 1);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.MeshPhysicalMaterial({ color: 0x286579, metalness: 0.08, roughness: 0.28, clearcoat: 0.85, clearcoatRoughness: 0.18 });
  const water = new THREE.Mesh(geometry, material);
  water.position.y = -4.5;
  water.receiveShadow = true;
  return water;
}

export function createSurfaceTexture(base: string, seed: number, grainCount = 26000): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);
  context.fillStyle = base;
  context.fillRect(0, 0, 512, 512);
  let state = seed || 1;
  const random = () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
  for (let index = 0; index < grainCount; index++) {
    const shade = Math.floor(48 + random() * 150);
    const alpha = 0.025 + random() * 0.11;
    context.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${alpha})`;
    const size = 0.35 + random() * 1.6;
    context.fillRect(random() * 512, random() * 512, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

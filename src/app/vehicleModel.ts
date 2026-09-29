import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Car, CarCustomization } from '../types';

function createSideDecal(customization: CarCustomization, accent: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 192;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.CanvasTexture(canvas);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.globalAlpha = 0.82;
  context.fillStyle = accent;
  if (customization.pattern === 'stripes') {
    for (let x = -120; x < 700; x += 112) {
      context.beginPath();
      context.moveTo(x, 0); context.lineTo(x + 48, 0); context.lineTo(x - 48, 192); context.lineTo(x - 96, 192);
      context.closePath(); context.fill();
    }
  } else if (customization.pattern === 'flames') {
    for (let x = 0; x < 512; x += 82) {
      context.beginPath();
      context.moveTo(x, 192); context.quadraticCurveTo(x - 34, 104, x + 14, 24);
      context.quadraticCurveTo(x + 18, 92, x + 68, 58); context.quadraticCurveTo(x + 45, 130, x + 82, 192);
      context.closePath(); context.fill();
    }
  } else if (customization.pattern === 'geometric') {
    for (let x = 0; x < 640; x += 64) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x + 32, 0); context.lineTo(x + 64, 96); context.lineTo(x + 32, 192); context.lineTo(x, 192); context.lineTo(x + 32, 96); context.closePath(); context.fill();
    }
  }
  context.globalAlpha = 1;
  if (customization.decalDataUrl) {
    const image = new Image();
    image.onload = () => {
      context.save(); context.globalAlpha = 0.92;
      context.drawImage(image, 124, 18, 264, 156);
      context.restore(); texture.needsUpdate = true;
    };
    image.src = customization.decalDataUrl;
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createPlateTexture(text: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 192;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#f4f5f0'; context.fillRect(0, 0, 512, 192);
    context.strokeStyle = '#111827'; context.lineWidth = 12; context.strokeRect(6, 6, 500, 180);
    context.fillStyle = '#111827'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.direction = 'rtl';
    context.font = 'bold 76px Arial, sans-serif'; context.fillText((text.trim() || 'ريم 2026').slice(0, 12), 256, 104, 470);
    context.font = '24px Arial, sans-serif'; context.fillStyle = '#4b5563'; context.fillText('REMOCAR', 256, 164, 460);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function makeVehicle(color: string, secondaryColor: string, modelType: Car['modelType'], customization?: CarCustomization): THREE.Group {
  const group = new THREE.Group();
  const paint = new THREE.Color(color);
  const darkPaint = new THREE.Color(secondaryColor);
  const bodyLength = modelType === 'sport' ? 4.65 : modelType === 'monster' ? 4.1 : 4.0;
  const bodyWidth = modelType === 'monster' ? 2.55 : modelType === 'sport' ? 2.0 : 2.15;
  const wheelRadius = modelType === 'monster' ? 0.62 : modelType === 'sport' ? 0.39 : 0.43;
  const paintMat = new THREE.MeshPhysicalMaterial({ color: paint, metalness: 0.68, roughness: 0.24, clearcoat: 0.9, clearcoatRoughness: 0.15 });
  const trimMat = new THREE.MeshStandardMaterial({ color: darkPaint, metalness: 0.35, roughness: 0.27 });
  const rubberMat = new THREE.MeshStandardMaterial({ color: 0x0b0d12, roughness: 0.92 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xaab4c2, metalness: 0.85, roughness: 0.22 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x152c42, metalness: 0.2, roughness: 0.12, transparent: true, opacity: 0.88, clearcoat: 1 });

  const add = (geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number], castShadow = true) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };

  // Low-poly coachwork with layered fenders, sculpted bonnet, glass and front/rear trim.
  add(new RoundedBoxGeometry(bodyWidth, 0.62, bodyLength, 4, 0.14), paintMat, [0, 0.68, 0]);
  add(new RoundedBoxGeometry(bodyWidth * 0.82, 0.2, bodyLength * 0.29, 3, 0.075), paintMat, [0, 1.03, 0.92]);
  add(new THREE.BoxGeometry(bodyWidth * 0.75, 0.12, bodyLength * 0.24), trimMat, [0, 0.52, bodyLength * 0.44]);
  add(new THREE.BoxGeometry(bodyWidth * 0.76, 0.12, bodyLength * 0.22), trimMat, [0, 0.53, -bodyLength * 0.44]);

  if (customization) {
    const decalMaterial = new THREE.MeshBasicMaterial({ map: createSideDecal(customization, secondaryColor), transparent: true, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
    for (const side of [-1, 1]) {
      const decal = new THREE.Mesh(new THREE.PlaneGeometry(bodyLength * 0.38, 0.34), decalMaterial);
      decal.position.set(side * (bodyWidth / 2 + 0.012), 0.72, -0.1);
      decal.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      group.add(decal);
    }
    const plateMaterial = new THREE.MeshBasicMaterial({ map: createPlateTexture(customization.plateText), side: THREE.DoubleSide });
    const frontPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.28), plateMaterial);
    frontPlate.position.set(0, 0.61, bodyLength / 2 + 0.048);
    group.add(frontPlate);
    const rearPlate = frontPlate.clone();
    rearPlate.position.z = -bodyLength / 2 - 0.048;
    rearPlate.rotation.y = Math.PI;
    group.add(rearPlate);
  }

  const cabin = add(new RoundedBoxGeometry(bodyWidth * 0.73, 0.62, bodyLength * 0.39, 4, 0.12), glassMat, [0, 1.33, -0.18]);
  cabin.scale.x = 0.98;
  add(new THREE.BoxGeometry(bodyWidth * 0.78, 0.08, bodyLength * 0.43), trimMat, [0, 1.65, -0.18]);

  // Wheel arches, rubber tyres and metallic hubs.
  const wheelPositions: [number, number][] = [
    [-bodyWidth * 0.51, bodyLength * 0.29], [bodyWidth * 0.51, bodyLength * 0.29],
    [-bodyWidth * 0.51, -bodyLength * 0.29], [bodyWidth * 0.51, -bodyLength * 0.29],
  ];
  for (const [x, z] of wheelPositions) {
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.32, 24), rubberMat);
    tire.rotation.z = Math.PI / 2;
    tire.position.set(x, wheelRadius, z);
    tire.castShadow = true;
    group.add(tire);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius * 0.57, wheelRadius * 0.57, 0.34, 12), rimMat);
    rim.rotation.z = Math.PI / 2;
    rim.position.copy(tire.position);
    group.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(wheelRadius * 0.16, wheelRadius * 0.16, 0.36, 12), trimMat);
    hub.rotation.z = Math.PI / 2;
    hub.position.copy(tire.position);
    group.add(hub);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(wheelRadius * 1.06, 0.08, 8, 18, Math.PI), paintMat);
    arch.rotation.y = Math.PI;
    arch.position.set(x * 0.86, wheelRadius + 0.08, z);
    arch.castShadow = true;
    group.add(arch);
  }

  const headlight = new THREE.MeshStandardMaterial({ color: 0xfff6dc, emissive: 0xffd98a, emissiveIntensity: 1.6 });
  const tailLight = new THREE.MeshStandardMaterial({ color: 0xff304f, emissive: 0xff143b, emissiveIntensity: 1.4 });
  for (const x of [-bodyWidth * 0.34, bodyWidth * 0.34]) {
    add(new THREE.BoxGeometry(0.46, 0.13, 0.09), headlight, [x, 0.78, bodyLength * 0.5], false);
    add(new THREE.BoxGeometry(0.38, 0.14, 0.09), tailLight, [x, 0.79, -bodyLength * 0.5], false);
    add(new THREE.BoxGeometry(0.13, 0.1, bodyLength * 0.27), trimMat, [x * 1.14, 0.54, 0]);
  }
  add(new THREE.BoxGeometry(0.9, 0.2, 0.1), new THREE.MeshStandardMaterial({ color: 0x11151a, metalness: 0.55 }), [0, 0.64, bodyLength * 0.5], false);
  add(new THREE.BoxGeometry(0.7, 0.18, 0.08), trimMat, [0, 0.62, -bodyLength * 0.5], false);

  if (modelType === 'sport' || modelType === 'drift' || modelType === 'cyber') {
    const wing = add(new THREE.BoxGeometry(bodyWidth * 1.04, 0.11, 0.42), trimMat, [0, 1.24, -bodyLength * 0.44]);
    wing.castShadow = true;
    for (const x of [-0.66, 0.66]) add(new THREE.BoxGeometry(0.08, 0.34, 0.08), trimMat, [x, 1.1, -bodyLength * 0.42]);
  }
  if (modelType === 'monster') {
    add(new THREE.BoxGeometry(1.5, 0.13, 1.4), trimMat, [0, 1.94, -0.12]);
  }
  if (modelType === 'cyber') {
    const neon = new THREE.MeshBasicMaterial({ color: paint });
    add(new THREE.BoxGeometry(bodyWidth * 0.96, 0.06, 0.08), neon, [0, 0.52, 0]);
  }

  group.traverse((object) => {
    if (object instanceof THREE.Mesh) object.userData.pickable = false;
  });
  return group;
}

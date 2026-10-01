import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Car } from '../types';
import { makeVehicle } from '../app/vehicleModel';
import { VehicleArtwork } from './VehicleArtwork';

interface CarShowroomProps { car: Car; compact?: boolean; }

export const CarShowroom: React.FC<CarShowroomProps> = ({ car, compact = false }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; rotation: number } | null>(null);
  const vehicleRef = useRef<THREE.Group | null>(null);
  const [rendererUnavailable, setRendererUnavailable] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    } catch {
      setRendererUnavailable(true);
      return;
    }
    setRendererUnavailable(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.replaceChildren(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = null;
    scene.add(new THREE.HemisphereLight(0xdbeafe, 0x2b1721, 1.9));
    const key = new THREE.DirectionalLight(0xffe4b2, 3.2);
    key.position.set(-6, 10, 8);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.PointLight(new THREE.Color(car.color), 18, 18);
    rim.position.set(4, 3, -3);
    scene.add(rim);
    const fill = new THREE.PointLight(0x38bdf8, 8, 15);
    fill.position.set(-5, 2, -1);
    scene.add(fill);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x101724, roughness: 0.38, metalness: 0.28 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.28;
    floor.receiveShadow = true;
    scene.add(floor);
    const turntable = new THREE.Mesh(new THREE.CylinderGeometry(4.1, 4.35, 0.3, 64), new THREE.MeshStandardMaterial({ color: 0x1c2431, metalness: 0.78, roughness: 0.24 }));
    turntable.position.y = -0.11;
    turntable.receiveShadow = true;
    scene.add(turntable);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.7, 0.035, 8, 100), new THREE.MeshBasicMaterial({ color: car.color }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.055;
    scene.add(ring);

    const vehicle = makeVehicle(car.color, car.secondaryColor, car.modelType, car.customization);
    vehicleRef.current = vehicle;
    vehicle.scale.setScalar(1.24);
    vehicle.position.y = 0.08;
    vehicle.rotation.y = -0.36;
    scene.add(vehicle);

    const camera = new THREE.PerspectiveCamera(34, container.clientWidth / Math.max(1, container.clientHeight), 0.1, 100);
    camera.position.set(7.5, 4.1, 8.7);
    camera.lookAt(0, 0.75, 0);

    let animationId = 0;
    let previous = 0;
    const render = (time: number) => {
      animationId = requestAnimationFrame(render);
      const dt = previous === 0 ? 0.016 : Math.min(0.05, (time - previous) / 1000);
      previous = time;
      if (!dragRef.current) vehicle.rotation.y += dt * 0.24;
      renderer.render(scene, camera);
    };
    animationId = requestAnimationFrame(render);
    const observer = new ResizeObserver(() => {
      if (!container.clientWidth || !container.clientHeight) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    observer.observe(container);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      renderer.dispose();
      scene.traverse((item) => { if (item.userData.remocarVehicleWrapper) item.userData.remocarDestroyed = true; });
      scene.traverse((item) => {
        if (item instanceof THREE.Mesh) {
          if (!item.userData.remocarSharedGeometry) item.geometry.dispose();
          (Array.isArray(item.material) ? item.material : [item.material]).forEach((material) => {
            if (!material.userData.remocarSharedTextures) Object.values(material).forEach((value) => { if (value instanceof THREE.Texture) value.dispose(); });
            material.dispose();
          });
        }
      });
      container.replaceChildren();
      vehicleRef.current = null;
    };
  }, [car.id, car.color, car.secondaryColor, car.modelType, car.customization?.pattern, car.customization?.plateText, car.customization?.decalDataUrl]);

  const beginDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { x: event.clientX, rotation: vehicleRef.current?.rotation.y ?? 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const drag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const delta = event.clientX - dragRef.current.x;
    if (vehicleRef.current) vehicleRef.current.rotation.y = dragRef.current.rotation + delta * 0.012;
  };
  const endDrag = () => {
    dragRef.current = null;
  };

  return <div onPointerDown={beginDrag} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag} className={`relative ${compact ? 'h-40 sm:h-44' : 'h-64 md:h-80'} rounded-3xl overflow-hidden border border-amber-500/20 bg-[radial-gradient(ellipse_at_50%_35%,#28364a_0%,#101521_55%,#080b12_100%)] touch-pan-y cursor-grab active:cursor-grabbing`}>
    {rendererUnavailable && <div className="absolute inset-3 grid place-items-center"><VehicleArtwork car={car} className="h-full w-full drop-shadow-2xl" /></div>}
    <div ref={mountRef} className="absolute inset-0" aria-label={`معاينة ثلاثية الأبعاد لسيارة ${car.name}`} />
    <div className="absolute right-4 top-4 rounded-full border border-amber-400/25 bg-black/45 px-3 py-1 text-[10px] font-bold text-amber-200 backdrop-blur">معرض ثلاثي الأبعاد · اسحب لتدوير السيارة</div>
    <div className="absolute bottom-4 left-4 rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-[10px] text-slate-300 backdrop-blur">مجسم قابل للدوران · إضاءة ومواد معدنية</div>
  </div>;
};

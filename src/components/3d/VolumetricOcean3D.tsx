import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { ThermohalineDepthPoint, StandardDepth } from '../../types/ocean';
import glorysRaw from '../../data/glorysDataset.json';
import { RotateCcw, Play, Pause, Eye, Layers } from 'lucide-react';

interface VolumetricOcean3DProps {
  selectedLat: number;
  selectedLon: number;
  profile: ThermohalineDepthPoint[];
  targetDepth: StandardDepth;
  onSelectDepth: (d: StandardDepth) => void;
  sst: number;
}

export function VolumetricOcean3D({
  selectedLat,
  selectedLon,
  profile,
  targetDepth,
  onSelectDepth,
  sst,
}: VolumetricOcean3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [depthSlice, setDepthSlice] = useState<number>(targetDepth);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const slicePlaneRef = useRef<THREE.Mesh | null>(null);
  const soundingBeamRef = useRef<THREE.Group | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);

  // Sync internal depth slice with parent
  useEffect(() => {
    setDepthSlice(targetDepth);
  }, [targetDepth]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 750;
    const height = 480;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x040915);
    scene.fog = new THREE.FogExp2(0x040915, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(14, 12, 16);
    camera.lookAt(0, -1.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Root Group for interactive rotation
    const rootGroup = new THREE.Group();
    rootGroupRef.current = rootGroup;
    scene.add(rootGroup);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    const deepLight = new THREE.PointLight(0x0284c7, 3, 20);
    deepLight.position.set(0, -6, 0);
    scene.add(deepLight);

    // 3. Create Surface Texture from real GLORYS SST
    const sstField = (glorysRaw.fields as any)['SST'] as (number | null)[][];
    const nLat = glorysRaw.grid.lats.length;
    const nLon = glorysRaw.grid.lons.length;

    const texCanvas = document.createElement('canvas');
    texCanvas.width = 256;
    texCanvas.height = 128;
    const texCtx = texCanvas.getContext('2d')!;

    for (let i = 0; i < nLat; i++) {
      for (let j = 0; j < nLon; j++) {
        const val = sstField[i] ? sstField[i][j] : null;
        const px = (j / nLon) * texCanvas.width;
        const py = ((nLat - 1 - i) / nLat) * texCanvas.height;
        const pw = texCanvas.width / nLon + 1;
        const ph = texCanvas.height / nLat + 1;

        if (val === null) {
          // India Landmass on 3D Surface
          texCtx.fillStyle = '#162235';
        } else {
          // Ocean SST
          const f = Math.max(0, Math.min(1, (val - 24) / (32 - 24)));
          const r = Math.round(f < 0.5 ? 20 + f * 200 : 220 + (f - 0.5) * 70);
          const g = Math.round(f < 0.5 ? 80 + f * 200 : 200 - (f - 0.5) * 160);
          const b = Math.round(f < 0.5 ? 200 - f * 200 : 20);
          texCtx.fillStyle = `rgb(${r},${g},${b})`;
        }
        texCtx.fillRect(px, py, pw, ph);
      }
    }

    // Add "INDIA" label on the texture
    texCtx.fillStyle = '#ffffff';
    texCtx.font = 'bold 12px sans-serif';
    texCtx.textAlign = 'center';
    texCtx.fillText('INDIA', texCanvas.width * 0.56, texCanvas.height * 0.35);

    const surfaceTexture = new THREE.CanvasTexture(texCanvas);

    // 4. Build 3D Ocean Volume Block (Width: 12, Height/Depth: 6, Length: 8)
    const boxW = 12;
    const boxH = 6;
    const boxD = 8;

    // Top Surface (Satellite Skin)
    const topGeo = new THREE.PlaneGeometry(boxW, boxD);
    const topMat = new THREE.MeshStandardMaterial({
      map: surfaceTexture,
      roughness: 0.3,
      metalness: 0.1,
    });
    const topMesh = new THREE.Mesh(topGeo, topMat);
    topMesh.rotation.x = -Math.PI / 2;
    topMesh.position.y = 0;
    rootGroup.add(topMesh);

    // Subsurface Vertical Stratification Gradient Texture (0m to 1000m)
    const gradCanvas = document.createElement('canvas');
    gradCanvas.width = 16;
    gradCanvas.height = 256;
    const gradCtx = gradCanvas.getContext('2d')!;
    const gradient = gradCtx.createLinearGradient(0, 0, 0, 256);
    // Warm mixed layer
    gradient.addColorStop(0.0, '#ef4444'); // Surface ~29°C (red/orange)
    gradient.addColorStop(0.12, '#f97316'); // 100m thermocline transition
    gradient.addColorStop(0.25, '#eab308'); // 200m
    gradient.addColorStop(0.45, '#06b6d4'); // 400m
    gradient.addColorStop(0.70, '#0284c7'); // 700m
    gradient.addColorStop(1.0, '#0c1b3d'); // 1000m deep cold (~5°C)
    gradCtx.fillStyle = gradient;
    gradCtx.fillRect(0, 0, 16, 256);

    const gradTexture = new THREE.CanvasTexture(gradCanvas);

    // 4 Vertical Side Walls showing underwater stratification
    const sideMat = new THREE.MeshBasicMaterial({
      map: gradTexture,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide,
    });

    // Front Wall
    const frontGeo = new THREE.PlaneGeometry(boxW, boxH);
    const frontMesh = new THREE.Mesh(frontGeo, sideMat);
    frontMesh.position.set(0, -boxH / 2, boxD / 2);
    rootGroup.add(frontMesh);

    // Back Wall
    const backGeo = new THREE.PlaneGeometry(boxW, boxH);
    const backMesh = new THREE.Mesh(backGeo, sideMat);
    backMesh.position.set(0, -boxH / 2, -boxD / 2);
    backMesh.rotation.y = Math.PI;
    rootGroup.add(backMesh);

    // Left Wall (Arabian Sea side)
    const leftGeo = new THREE.PlaneGeometry(boxD, boxH);
    const leftMesh = new THREE.Mesh(leftGeo, sideMat);
    leftMesh.position.set(-boxW / 2, -boxH / 2, 0);
    leftMesh.rotation.y = -Math.PI / 2;
    rootGroup.add(leftMesh);

    // Right Wall (Bay of Bengal side)
    const rightGeo = new THREE.PlaneGeometry(boxD, boxH);
    const rightMesh = new THREE.Mesh(rightGeo, sideMat);
    rightMesh.position.set(boxW / 2, -boxH / 2, 0);
    rightMesh.rotation.y = Math.PI / 2;
    rootGroup.add(rightMesh);

    // Bottom Bed (1000m Abyssal floor)
    const botGeo = new THREE.PlaneGeometry(boxW, boxD);
    const botMat = new THREE.MeshStandardMaterial({ color: 0x050c18, roughness: 0.9 });
    const botMesh = new THREE.Mesh(botGeo, botMat);
    botMesh.rotation.x = Math.PI / 2;
    botMesh.position.y = -boxH;
    rootGroup.add(botMesh);

    // Wireframe Box outline
    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(boxW, boxH, boxD));
    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    wireframe.position.y = -boxH / 2;
    rootGroup.add(wireframe);

    // 5. Interactive Slicing Iso-surface Plane (Cyan Glowing Sheet)
    const sliceGeo = new THREE.PlaneGeometry(boxW * 0.99, boxD * 0.99);
    const sliceMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    });
    const slicePlane = new THREE.Mesh(sliceGeo, sliceMat);
    slicePlane.rotation.x = -Math.PI / 2;
    slicePlane.position.y = -(depthSlice / 1000) * boxH;
    rootGroup.add(slicePlane);
    slicePlaneRef.current = slicePlane;

    // Slice Plane border line
    const sliceEdges = new THREE.EdgesGeometry(sliceGeo);
    const sliceLineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, linewidth: 2 });
    const sliceLine = new THREE.LineSegments(sliceEdges, sliceLineMat);
    slicePlane.add(sliceLine);

    // 6. Selected Location 3D Sounding Column (Laser Depth Beam)
    const soundingGroup = new THREE.Group();
    soundingBeamRef.current = soundingGroup;

    // Map lat/lon (5-25°N, 55-94.75°E) to box coordinates [-boxW/2..boxW/2, -boxD/2..boxD/2]
    const normX = (selectedLon - 55) / (94.75 - 55);
    const normZ = (selectedLat - 5) / (25 - 5);
    const targetX = (normX - 0.5) * boxW;
    const targetZ = -(normZ - 0.5) * boxD;

    soundingGroup.position.set(targetX, 0, targetZ);

    // Vertical Laser Cylinder
    const cylGeo = new THREE.CylinderGeometry(0.08, 0.08, boxH, 16);
    const cylMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.7 });
    const cyl = new THREE.Mesh(cylGeo, cylMat);
    cyl.position.y = -boxH / 2;
    soundingGroup.add(cyl);

    // Surface Floating Buoy / ARGO Beacon
    const buoyGeo = new THREE.SphereGeometry(0.32, 16, 16);
    const buoyMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.4 });
    const buoy = new THREE.Mesh(buoyGeo, buoyMat);
    buoy.position.y = 0.2;
    soundingGroup.add(buoy);

    // Target depth indicator sphere on the beam
    const targetSphereGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const targetSphereMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const targetSphere = new THREE.Mesh(targetSphereGeo, targetSphereMat);
    targetSphere.position.y = -(depthSlice / 1000) * boxH;
    soundingGroup.add(targetSphere);

    rootGroup.add(soundingGroup);

    // 7. Depth Grid Markers (0m, 100m, 200m, 500m, 1000m) along the front-left edge
    const depthsMarkers = [0, 100, 200, 500, 1000];
    depthsMarkers.forEach(d => {
      const y = -(d / 1000) * boxH;
      const markerGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const markerMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
      const m = new THREE.Mesh(markerGeo, markerMat);
      m.position.set(-boxW / 2, y, boxD / 2);
      rootGroup.add(m);
    });

    // 8. Mouse Drag Orbit Controls
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !rootGroupRef.current) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;

      rootGroupRef.current.rotation.y += deltaX * 0.008;
      rootGroupRef.current.rotation.x = Math.max(-0.6, Math.min(0.6, rootGroupRef.current.rotation.x + deltaY * 0.006));

      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 9. Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (autoRotate && rootGroupRef.current && !isDragging) {
        rootGroupRef.current.rotation.y += 0.003;
      }

      // Gentle floating animation on buoy
      buoy.position.y = 0.2 + Math.sin(Date.now() * 0.003) * 0.06;

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      camera.aspect = newW / height;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      topGeo.dispose();
      frontGeo.dispose();
      sliceGeo.dispose();
    };
  }, []);

  // Update Slice Plane when depthSlice changes
  useEffect(() => {
    if (slicePlaneRef.current) {
      slicePlaneRef.current.position.y = -(depthSlice / 1000) * 6;
    }
  }, [depthSlice]);

  // Update Sounding Position when lat/lon changes
  useEffect(() => {
    if (soundingBeamRef.current) {
      const boxW = 12;
      const boxD = 8;
      const normX = (selectedLon - 55) / (94.75 - 55);
      const normZ = (selectedLat - 5) / (25 - 5);
      soundingBeamRef.current.position.set((normX - 0.5) * boxW, 0, -(normZ - 0.5) * boxD);
    }
  }, [selectedLat, selectedLon]);

  const handleResetCamera = () => {
    if (rootGroupRef.current) {
      rootGroupRef.current.rotation.set(0.2, 0.4, 0);
    }
  };

  const currentPoint = profile.find(p => p.depth === targetDepth) || profile[0];

  return (
    <div className="bg-ocean-950 border border-ocean-700 rounded-xl overflow-hidden shadow-2xl relative">
      
      {/* 3D Header Controls */}
      <div className="flex flex-wrap items-center justify-between p-3.5 border-b border-ocean-800 bg-ocean-900/90 backdrop-blur-md z-10 relative">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            3D Volumetric Subsurface Ocean Model (0–1000m)
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            Interactive Three.js WebGL
          </span>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors border ${
              autoRotate ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-ocean-800 border-ocean-700 text-slate-400'
            }`}
          >
            {autoRotate ? <Pause size={12} /> : <Play size={12} />}
            <span>{autoRotate ? 'Pause Rotate' : 'Auto Rotate'}</span>
          </button>
          <button
            onClick={handleResetCamera}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono bg-ocean-800 hover:bg-ocean-700 border border-ocean-700 text-slate-300 transition-colors"
          >
            <RotateCcw size={12} />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full relative cursor-grab active:cursor-grabbing" style={{ height: 480 }} />

      {/* Floating 3D Overlays */}
      
      {/* 1. Depth Slicing Slider Overlay (Bottom) */}
      <div className="absolute bottom-4 left-4 right-4 z-10 bg-ocean-900/90 border border-ocean-700/80 rounded-lg p-3.5 backdrop-blur-md shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Layers size={16} className="text-cyan-400 shrink-0" />
          <div className="text-xs">
            <span className="text-slate-400">Subsurface Slicing Depth:</span>{' '}
            <span className="font-mono font-bold text-cyan-300 text-sm">{depthSlice} meters</span>
          </div>
        </div>

        {/* Slider */}
        <div className="flex items-center gap-3 w-full sm:flex-1 max-w-md">
          <span className="text-[10px] font-mono text-slate-500">0m</span>
          <input
            type="range"
            min={0}
            max={1000}
            step={10}
            value={depthSlice}
            onChange={(e) => {
              const val = Number(e.target.value);
              setDepthSlice(val);
              // Find closest standard depth
              const closest = [0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000].reduce((prev, curr) =>
                Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev
              );
              onSelectDepth(closest as StandardDepth);
            }}
            className="w-full h-1.5 bg-ocean-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="text-[10px] font-mono text-slate-500">1000m</span>
        </div>

        {/* Quick Value Badge */}
        <div className="text-xs font-mono bg-ocean-950 px-3 py-1 rounded border border-ocean-800 text-slate-300 shrink-0">
          T at {targetDepth}m: <span className="text-cyan-400 font-bold">{currentPoint?.reconstructedTemp.toFixed(2)} °C</span>
        </div>
      </div>

      {/* 2. Drag Guidance Notice (Top Left) */}
      <div className="absolute top-16 left-4 z-10 pointer-events-none bg-ocean-950/75 border border-ocean-800/80 rounded px-2.5 py-1 text-[11px] font-mono text-slate-400 backdrop-blur-sm">
        🖱️ Click & Drag to Orbit 3D Cube
      </div>

      {/* 3. 3D Legend (Top Right) */}
      <div className="absolute top-16 right-4 z-10 pointer-events-none bg-ocean-950/85 border border-ocean-800/80 rounded-lg p-2.5 text-[11px] font-mono space-y-1 backdrop-blur-sm shadow">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="text-slate-300">ARGO Surface Buoy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-cyan-400" />
          <span className="text-slate-300">Laser Depth Sounding</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-cyan-400/30 border border-cyan-400" />
          <span className="text-slate-300">Iso-Depth Cutting Plane</span>
        </div>
      </div>
    </div>
  );
}

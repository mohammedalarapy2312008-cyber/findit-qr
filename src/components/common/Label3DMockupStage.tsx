import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Camera, Layers, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { PrintMaterialFinish, TagDesignTemplate } from '../../types/domain';
import {
  CameraPresetAngle,
  computeZoomedCameraPosition,
  createContactShadowTexture,
  createDieCutLabelGeometry,
  createSubstrateMicroBumpTexture,
  detectSoftwareWebGlRenderer,
  getCameraPresetCoordinates,
  getSubstratePbrProfile,
  rasterizePrintSurfaceToTexture,
  setupStudioSceneEnvironment,
} from '../../utils/pilot3dSceneBuilder';
import { PilotLabelRenderOptions } from '../../utils/pilotLabelArtwork';
import { PilotCard3dPreview } from './PilotCard3dPreview';

interface Label3DMockupStageProps {
  design: TagDesignTemplate;
  renderOptions: PilotLabelRenderOptions;
  darkTheme?: boolean;
  lang: 'ar' | 'en';
  heightClass?: string;
}

/**
 * Interactive 3D Studio Stage for Pilot Printable QR Labels.
 * Strictly follows Three.js lifecycle & software-WebGL budgets:
 * - WebGLRenderer + OrbitControls mounted ONCE on empty <div ref> outside HUD overlays
 * - Coalesced on-demand rendering (no 60Hz idle CPU burn)
 * - Live Single-Source-of-Truth texture hot-swap whenever customizations or substrate change
 */
export const Label3DMockupStage: React.FC<Label3DMockupStageProps> = ({
  design,
  renderOptions,
  darkTheme = false,
  lang,
  heightClass = 'h-[360px] sm:h-[420px]',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [preset, setPreset] = useState<CameraPresetAngle>('hero_3q');
  const [zoomPercent, setZoomPercent] = useState(100);
  const [webglFailed, setWebglFailed] = useState(false);

  const sceneRefs = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    stickerMesh: THREE.Mesh<THREE.ExtrudeGeometry, [THREE.MeshPhysicalMaterial, THREE.MeshStandardMaterial]>;
    plinthMat: THREE.MeshStandardMaterial;
    shadowMat: THREE.MeshBasicMaterial;
    normW: number;
    normH: number;
    baseDist: number;
    requestRender: () => void;
    colorTex: THREE.CanvasTexture | null;
    bumpTex: THREE.CanvasTexture | null;
    envTex: THREE.Texture | null;
    shadowTex: THREE.CanvasTexture | null;
  } | null>(null);

  const designRef = useRef(design);
  const optionsRef = useRef(renderOptions);
  designRef.current = design;
  optionsRef.current = renderOptions;

  // 1. Mount renderer and OrbitControls once
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let rafId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let disposed = false;

    try {
      const width = Math.max(320, container.clientWidth || 560);
      const height = Math.max(260, container.clientHeight || 400);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,
        powerPreference: 'default',
      });
      const isSw = detectSoftwareWebGlRenderer(renderer);
      renderer.setPixelRatio(isSw ? 1 : Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.domElement.style.display = 'block';
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const envTex = setupStudioSceneEnvironment(
        scene,
        renderer,
        darkTheme ? '#0B1322' : '#EFECE6'
      );

      const initialDesign = designRef.current;
      const built = createDieCutLabelGeometry(initialDesign);
      const finish: PrintMaterialFinish =
        optionsRef.current.materialFinish ||
        initialDesign.printSpecs?.defaultMaterial ||
        'waterproof_vinyl';
      const pbr = getSubstratePbrProfile(finish);
      const bumpTex = createSubstrateMicroBumpTexture(pbr.bumpType);
      const shadowTex = createContactShadowTexture();

      const frontMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        bumpMap: bumpTex,
        bumpScale: 0.004,
        roughness: pbr.roughness,
        metalness: pbr.metalness,
        clearcoat: pbr.clearcoat,
        clearcoatRoughness: pbr.clearcoatRoughness,
        envMapIntensity: 0.95,
      });

      const edgeMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(pbr.edgeHex),
        roughness: 0.55,
        metalness: pbr.metalness * 0.5,
      });

      const stickerMesh = new THREE.Mesh<
        THREE.ExtrudeGeometry,
        [THREE.MeshPhysicalMaterial, THREE.MeshStandardMaterial]
      >(built.geometry, [frontMat, edgeMat]);
      stickerMesh.rotation.x = -Math.PI / 2;
      stickerMesh.position.y = 0.022;
      scene.add(stickerMesh);

      // Architectural brushed travertine / slate studio surface slab
      const padWidth = Math.max(built.normW, built.normH) * 2.15;
      const plinthGeo = new THREE.BoxGeometry(padWidth, 0.06, padWidth * 0.86);
      const plinthMat = new THREE.MeshStandardMaterial({
        color: darkTheme ? 0x162238 : 0xe4dfd5,
        roughness: 0.88,
        metalness: 0.02,
      });
      const plinth = new THREE.Mesh(plinthGeo, plinthMat);
      plinth.position.y = -0.032;
      scene.add(plinth);

      // Delicate studio trim line around display surface
      const ringGeo = new THREE.RingGeometry(
        Math.max(built.normW, built.normH) * 0.64,
        Math.max(built.normW, built.normH) * 0.648,
        64
      );
      const ringMat = new THREE.MeshBasicMaterial({
        color: darkTheme ? 0x26354d : 0xd0c9bc,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.y = 0.001;
      scene.add(ringMesh);

      const shadowGeo = new THREE.CircleGeometry(Math.max(built.normW, built.normH) * 0.63, 48);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: darkTheme ? 0.58 : 0.34,
        depthWrite: false,
      });
      const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
      shadowMesh.rotation.x = -Math.PI / 2;
      shadowMesh.position.y = 0.007;
      scene.add(shadowMesh);

      const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 40);
      const initCam = getCameraPresetCoordinates('hero_3q', built.normW, built.normH);
      camera.position.set(...initCam.position);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = false;
      controls.enablePan = false;
      controls.enableZoom = true;
      controls.minDistance = 1.45;
      controls.maxDistance = 8.5;
      controls.minPolarAngle = 0.08;
      controls.maxPolarAngle = Math.PI * 0.47;
      controls.target.set(...initCam.target);
      controls.update();

      const baseDist = camera.position.distanceTo(controls.target);

      let renderPending = false;
      const requestRender = () => {
        if (disposed || renderPending) return;
        renderPending = true;
        rafId = requestAnimationFrame(() => {
          renderPending = false;
          if (disposed) return;
          renderer.render(scene, camera);
        });
      };

      const handleControlsChange = () => {
        const refsNow = sceneRefs.current;
        if (refsNow) {
          const dist = refsNow.camera.position.distanceTo(refsNow.controls.target);
          const pct = Math.round((refsNow.baseDist / Math.max(0.2, dist)) * 100);
          setZoomPercent(Math.max(40, Math.min(280, pct)));
        }
        requestRender();
      };

      controls.addEventListener('change', handleControlsChange);

      sceneRefs.current = {
        renderer,
        scene,
        camera,
        controls,
        stickerMesh,
        plinthMat,
        shadowMat,
        normW: built.normW,
        normH: built.normH,
        baseDist,
        requestRender,
        colorTex: null,
        bumpTex,
        envTex,
        shadowTex,
      };

      resizeObserver = new ResizeObserver((entries) => {
        if (disposed || !sceneRefs.current) return;
        const entry = entries[0];
        if (!entry) return;
        const nextW = Math.max(240, Math.round(entry.contentRect.width));
        const nextH = Math.max(220, Math.round(entry.contentRect.height));
        sceneRefs.current.camera.aspect = nextW / nextH;
        sceneRefs.current.camera.updateProjectionMatrix();
        sceneRefs.current.renderer.setSize(nextW, nextH);
        requestRender();
      });
      resizeObserver.observe(container);

      requestRender();

      return () => {
        disposed = true;
        cancelAnimationFrame(rafId);
        resizeObserver?.disconnect();
        controls.removeEventListener('change', handleControlsChange);
        controls.dispose();
        stickerMesh.geometry.dispose();
        frontMat.dispose();
        edgeMat.dispose();
        plinthGeo.dispose();
        plinthMat.dispose();
        ringGeo.dispose();
        ringMat.dispose();
        shadowGeo.dispose();
        shadowMat.dispose();
        sceneRefs.current?.colorTex?.dispose();
        sceneRefs.current?.bumpTex?.dispose();
        shadowTex.dispose();
        envTex?.dispose();
        renderer.dispose();
        renderer.getContext()?.getExtension('WEBGL_lose_context')?.loseContext();
        sceneRefs.current = null;
      };
    } catch {
      setWebglFailed(true);
      return undefined;
    }
  }, []);

  // 2. Sync Geometry, Print-Derived Texture, PBR Material, and Theme whenever props update
  useEffect(() => {
    const refs = sceneRefs.current;
    if (!refs) return;
    let cancelled = false;

    const finish: PrintMaterialFinish =
      renderOptions.materialFinish || design.printSpecs?.defaultMaterial || 'waterproof_vinyl';
    const pbr = getSubstratePbrProfile(finish);

    // Update theme lighting background
    refs.scene.background = new THREE.Color(darkTheme ? '#0B1322' : '#EFECE6');
    refs.plinthMat.color.setHex(darkTheme ? 0x162238 : 0xe4dfd5);
    refs.shadowMat.opacity = darkTheme ? 0.58 : 0.34;

    // Rebuild geometry if design changed
    const nextBuilt = createDieCutLabelGeometry(design);
    refs.stickerMesh.geometry.dispose();
    refs.stickerMesh.geometry = nextBuilt.geometry;
    refs.normW = nextBuilt.normW;
    refs.normH = nextBuilt.normH;

    // Update PBR substrate properties
    const [frontMat, edgeMat] = refs.stickerMesh.material;
    const nextBump = createSubstrateMicroBumpTexture(pbr.bumpType);
    refs.bumpTex?.dispose();
    refs.bumpTex = nextBump;
    frontMat.bumpMap = nextBump;
    frontMat.bumpScale = pbr.bumpType === 'smooth' ? 0.002 : 0.006;
    frontMat.roughness = pbr.roughness;
    frontMat.metalness = pbr.metalness;
    frontMat.clearcoat = pbr.clearcoat;
    frontMat.clearcoatRoughness = pbr.clearcoatRoughness;
    frontMat.transparent = pbr.transparentEdge;
    frontMat.opacity = pbr.transparentEdge ? 0.94 : 1.0;
    frontMat.needsUpdate = true;

    edgeMat.color.set(pbr.edgeHex);
    edgeMat.metalness = pbr.metalness * 0.5;
    edgeMat.transparent = pbr.transparentEdge;
    edgeMat.opacity = pbr.transparentEdge ? 0.55 : 1.0;
    edgeMat.needsUpdate = true;

    // Update camera preset
    const cfg = getCameraPresetCoordinates(preset, refs.normW, refs.normH);
    refs.camera.position.set(...cfg.position);
    refs.controls.target.set(...cfg.target);
    refs.controls.update();
    refs.baseDist = refs.camera.position.distanceTo(refs.controls.target);
    setZoomPercent(100);

    // Rasterize exact Print-Ready Surface SVG onto CanvasTexture
    void rasterizePrintSurfaceToTexture(
      design,
      { ...renderOptions, materialFinish: finish },
      Math.min(4, refs.renderer.capabilities.getMaxAnisotropy())
    )
      .then((nextTex) => {
        if (cancelled) {
          nextTex.dispose();
          return;
        }
        const prevTex = refs.colorTex;
        refs.colorTex = nextTex;
        frontMat.map = nextTex;
        frontMat.needsUpdate = true;
        prevTex?.dispose();
        refs.requestRender();
      })
      .catch(() => {
        // Keep previous texture cleanly
      });

    return () => {
      cancelled = true;
    };
  }, [
    design,
    renderOptions.calloutText,
    renderOptions.customSubLabel,
    renderOptions.serialCode,
    renderOptions.primaryHex,
    renderOptions.secondaryHex,
    renderOptions.accentHex,
    renderOptions.materialFinish,
    preset,
    darkTheme,
  ]);

  const applyPreset = (nextPreset: CameraPresetAngle) => {
    setPreset(nextPreset);
    const refs = sceneRefs.current;
    if (!refs) return;
    const cfg = getCameraPresetCoordinates(nextPreset, refs.normW, refs.normH);
    refs.camera.position.set(...cfg.position);
    refs.controls.target.set(...cfg.target);
    refs.controls.update();
    refs.baseDist = refs.camera.position.distanceTo(refs.controls.target);
    setZoomPercent(100);
    refs.requestRender();
  };

  const applyZoomFactor = (scaleFactor: number) => {
    const refs = sceneRefs.current;
    if (!refs) return;
    const next = computeZoomedCameraPosition({
      position: [refs.camera.position.x, refs.camera.position.y, refs.camera.position.z],
      target: [refs.controls.target.x, refs.controls.target.y, refs.controls.target.z],
      scaleFactor,
      minDistance: refs.controls.minDistance,
      maxDistance: refs.controls.maxDistance,
    });
    refs.camera.position.set(...next.position);
    refs.controls.update();
    const pct = Math.round((refs.baseDist / Math.max(0.2, next.distance)) * 100);
    setZoomPercent(Math.max(40, Math.min(280, pct)));
    refs.requestRender();
  };

  if (webglFailed) {
    return (
      <div className={`w-full ${heightClass} rounded-xl overflow-hidden bg-[#EFECE6] dark:bg-[#0B1322]`}>
        <PilotCard3dPreview
          design={design}
          darkTheme={darkTheme}
          materialFinish={renderOptions.materialFinish}
          viewAngle={preset === 'macro_angle' ? 'macro' : preset === 'studio_top' ? 'top' : 'hero'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full">
      <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#EFECE6] dark:bg-[#0B1322]`}>
        {/* Empty dedicated WebGL mount point */}
        <div
          ref={mountRef}
          data-testid="label-3d-webgl-stage"
          data-preset={preset}
          data-zoom={zoomPercent}
          aria-label={lang === 'ar' ? `عارض ثلاثي الأبعاد للملصق ${design.titleAr}` : `Interactive 3D label studio for ${design.titleEn}`}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* Crisp solid floating controls (no backdrop-blur over WebGL per software-WebGL rules) */}
        <div className="pointer-events-none absolute top-3 inset-x-3 flex items-center justify-between gap-2 text-[11px] font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-[#17243A]/90 text-white inline-flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#19B5A5]" />
            <span>
              {lang === 'ar'
                ? 'استوديو 3D تفاعلي · مطابق لملف الطباعة'
                : 'Interactive 3D Studio · Print-Matched'}
            </span>
          </span>

          <div className="pointer-events-auto inline-flex items-center gap-1">
            <button
              type="button"
              data-testid="zoom-out-3d"
              aria-label={lang === 'ar' ? 'تصغير المعاينة ثلاثية الأبعاد' : 'Zoom out 3D preview'}
              onClick={() => applyZoomFactor(1.22)}
              className="w-8 h-8 rounded-lg bg-white dark:bg-[#0F1A2B] border border-slate-300 dark:border-slate-700 text-[#17243A] dark:text-white inline-flex items-center justify-center hover:border-[#19B5A5]"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span
              dir="ltr"
              className="px-2 py-1 rounded-lg bg-white/95 dark:bg-[#0F1A2B]/95 border border-slate-300 dark:border-slate-700 font-mono text-[10px] text-[#17243A] dark:text-white tabular-nums"
            >
              {zoomPercent}%
            </span>
            <button
              type="button"
              data-testid="zoom-in-3d"
              aria-label={lang === 'ar' ? 'تكبير المعاينة ثلاثية الأبعاد' : 'Zoom in 3D preview'}
              onClick={() => applyZoomFactor(0.82)}
              className="w-8 h-8 rounded-lg bg-white dark:bg-[#0F1A2B] border border-slate-300 dark:border-slate-700 text-[#17243A] dark:text-white inline-flex items-center justify-center hover:border-[#19B5A5]"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              data-testid="reset-3d"
              aria-label={lang === 'ar' ? 'إعادة ضبط زاوية العرض' : 'Reset 3D camera'}
              onClick={() => applyPreset('hero_3q')}
              className="h-8 px-2.5 rounded-lg bg-white dark:bg-[#0F1A2B] border border-slate-300 dark:border-slate-700 text-[#17243A] dark:text-white inline-flex items-center gap-1 hover:border-[#19B5A5]"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">{lang === 'ar' ? 'توسيط' : 'Reset'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Camera Angle Preset Strip */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {(
          [
            { id: 'hero_3q', ar: 'منظور ٣/٤ واقعي', en: '3/4 Hero' },
            { id: 'macro_angle', ar: 'زاوية ماكرو قريبة', en: 'Macro Angle' },
            { id: 'studio_top', ar: 'لقطة علوية مطابقة', en: 'Overhead' },
            { id: 'edge_profile', ar: 'حافة وسماكة الخامة', en: 'Edge Profile' },
          ] as const
        ).map((cam) => (
          <button
            key={cam.id}
            type="button"
            data-testid={`cam-preset-${cam.id}`}
            onClick={() => applyPreset(cam.id)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              preset === cam.id
                ? 'bg-[#17243A] dark:bg-[#19B5A5] text-white dark:text-[#070D17]'
                : 'bg-white dark:bg-[#0F1A2B] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#19B5A5]'
            }`}
          >
            <Camera className="w-3 h-3" />
            <span>{lang === 'ar' ? cam.ar : cam.en}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

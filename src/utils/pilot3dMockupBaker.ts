import * as THREE from 'three';
import { PrintMaterialFinish, TagDesignTemplate } from '../types/domain';
import {
  CameraPresetAngle,
  createContactShadowTexture,
  createDieCutLabelGeometry,
  createSubstrateMicroBumpTexture,
  getCameraPresetCoordinates,
  getSubstratePbrProfile,
  rasterizePrintSurfaceToTexture,
  setupStudioSceneEnvironment,
} from './pilot3dSceneBuilder';
import {
  buildPilot3dTextureSurfaceSvg,
  getPilotTrimDimensionsMm,
  PilotLabelRenderOptions,
} from './pilotLabelArtwork';

export interface BakedPilot3dViews {
  heroUrl: string;
  macroUrl: string;
  topUrl: string;
}

const BAKED_CACHE = new Map<string, BakedPilot3dViews>();
let bakerQueue: Promise<unknown> = Promise.resolve();

function buildCacheKey(design: TagDesignTemplate, finish: PrintMaterialFinish, darkTheme: boolean): string {
  return `${design.id}::${finish}::${darkTheme ? 'dark' : 'light'}`;
}

async function fallback2dPerspectivePng(
  design: TagDesignTemplate,
  options: PilotLabelRenderOptions,
  darkTheme: boolean
): Promise<BakedPilot3dViews> {
  const { widthMm, heightMm } = getPilotTrimDimensionsMm(design);
  const svgMarkup = buildPilot3dTextureSurfaceSvg(design, { ...options, scalePxPerMm: 10 });
  const img = new Image();
  const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const renderAngle = (skewY: number, scaleX: number, scaleY: number, zoom: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const bgGrad = ctx.createRadialGradient(360, 220, 40, 360, 250, 420);
    bgGrad.addColorStop(0, darkTheme ? '#18243A' : '#FFFFFF');
    bgGrad.addColorStop(1, darkTheme ? '#0B1320' : '#ECEAE4');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const drawW = 280 * zoom;
    const drawH = drawW * (heightMm / widthMm);

    // Contact shadow
    ctx.save();
    ctx.translate(360, 266);
    ctx.scale(scaleX, scaleY);
    ctx.transform(1, skewY, -skewY * 0.5, 1, 0, 0);
    ctx.fillStyle = 'rgba(15,23,42,0.28)';
    ctx.fillRect(-drawW / 2 + 10, -drawH / 2 + 14, drawW, drawH);
    // Sticker thickness edge
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(-drawW / 2 + 4, -drawH / 2 + 5, drawW, drawH);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
    return canvas.toDataURL('image/png');
  };

  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('FALLBACK_IMG_ERROR'));
      img.src = url;
    });
    return {
      heroUrl: renderAngle(-0.08, 1.0, 0.9, 1.0),
      macroUrl: renderAngle(0.06, 1.08, 0.92, 1.25),
      topUrl: renderAngle(0, 1.0, 1.0, 0.98),
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function runSingleThreeBake(
  design: TagDesignTemplate,
  options: PilotLabelRenderOptions,
  darkTheme: boolean
): Promise<BakedPilot3dViews> {
  const w = 720;
  const h = 500;
  let renderer: THREE.WebGLRenderer | null = null;
  let envTexture: THREE.Texture | null = null;
  let colorTex: THREE.CanvasTexture | null = null;
  let bumpTex: THREE.CanvasTexture | null = null;
  let shadowTex: THREE.CanvasTexture | null = null;
  let labelGeo: THREE.ExtrudeGeometry | null = null;
  let shadowGeo: THREE.CircleGeometry | null = null;
  let plinthGeo: THREE.CylinderGeometry | null = null;
  let frontMat: THREE.MeshPhysicalMaterial | null = null;
  let edgeMat: THREE.MeshStandardMaterial | null = null;
  let shadowMat: THREE.MeshBasicMaterial | null = null;
  let plinthMat: THREE.MeshStandardMaterial | null = null;

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'default',
    });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    const bgHex = darkTheme ? '#0D1728' : '#F3F1EC';
    const scene = new THREE.Scene();
    envTexture = setupStudioSceneEnvironment(scene, renderer, bgHex);

    const finish: PrintMaterialFinish =
      options.materialFinish || design.printSpecs?.defaultMaterial || 'waterproof_vinyl';
    const pbr = getSubstratePbrProfile(finish);

    colorTex = await rasterizePrintSurfaceToTexture(
      design,
      { ...options, materialFinish: finish },
      Math.min(4, renderer.capabilities.getMaxAnisotropy())
    );
    bumpTex = createSubstrateMicroBumpTexture(pbr.bumpType);
    shadowTex = createContactShadowTexture();

    const built = createDieCutLabelGeometry(design);
    labelGeo = built.geometry;

    frontMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: colorTex,
      bumpMap: bumpTex,
      bumpScale: pbr.bumpType === 'smooth' ? 0.002 : 0.006,
      roughness: pbr.roughness,
      metalness: pbr.metalness,
      clearcoat: pbr.clearcoat,
      clearcoatRoughness: pbr.clearcoatRoughness,
      transparent: pbr.transparentEdge,
      opacity: pbr.transparentEdge ? 0.94 : 1.0,
      envMapIntensity: 0.95,
    });

    edgeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(pbr.edgeHex),
      roughness: 0.55,
      metalness: pbr.metalness * 0.5,
      transparent: pbr.transparentEdge,
      opacity: pbr.transparentEdge ? 0.55 : 1.0,
    });

    const stickerMesh = new THREE.Mesh(labelGeo, [frontMat, edgeMat]);
    stickerMesh.rotation.x = -Math.PI / 2;
    stickerMesh.position.y = 0.018;
    scene.add(stickerMesh);

    // Subtle circular studio release mat beneath sticker (clean silhouette separation)
    const padRadius = Math.max(built.normW, built.normH) * 0.78;
    plinthGeo = new THREE.CylinderGeometry(padRadius, padRadius * 1.02, 0.024, 64);
    plinthMat = new THREE.MeshStandardMaterial({
      color: darkTheme ? 0x132036 : 0xebe8e0,
      roughness: 0.92,
      metalness: 0.01,
    });
    const plinth = new THREE.Mesh(plinthGeo, plinthMat);
    plinth.position.y = -0.015;
    scene.add(plinth);

    // Radial contact shadow disc separating sticker from studio surface
    shadowGeo = new THREE.CircleGeometry(Math.max(built.normW, built.normH) * 0.64, 48);
    shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: darkTheme ? 0.55 : 0.36,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.006;
    scene.add(shadowMesh);

    const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 40);
    const capturePreset = (preset: CameraPresetAngle): string => {
      const cfg = getCameraPresetCoordinates(preset, built.normW, built.normH);
      camera.position.set(...cfg.position);
      camera.lookAt(...cfg.target);
      camera.updateMatrixWorld();
      renderer!.render(scene, camera);
      return renderer!.domElement.toDataURL('image/png');
    };

    const heroUrl = capturePreset('hero_3q');
    const macroUrl = capturePreset('macro_angle');
    const topUrl = capturePreset('studio_top');

    return { heroUrl, macroUrl, topUrl };
  } catch {
    return await fallback2dPerspectivePng(design, options, darkTheme);
  } finally {
    labelGeo?.dispose();
    shadowGeo?.dispose();
    plinthGeo?.dispose();
    frontMat?.dispose();
    edgeMat?.dispose();
    shadowMat?.dispose();
    plinthMat?.dispose();
    colorTex?.dispose();
    bumpTex?.dispose();
    shadowTex?.dispose();
    envTexture?.dispose();
    renderer?.dispose();
    // Explicitly release WebGL context so repeated bakes stay well below browser limits
    const gl = renderer?.getContext();
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

export async function bakePilot3dViews(
  design: TagDesignTemplate,
  options: PilotLabelRenderOptions = {},
  darkTheme = false
): Promise<BakedPilot3dViews> {
  const finish: PrintMaterialFinish =
    options.materialFinish || design.printSpecs?.defaultMaterial || 'waterproof_vinyl';
  const hasCustomOverrides = Boolean(
    options.calloutText || options.serialCode || options.primaryHex || options.accentHex
  );
  const key = buildCacheKey(design, finish, darkTheme);
  if (!hasCustomOverrides && BAKED_CACHE.has(key)) {
    return BAKED_CACHE.get(key)!;
  }

  const job = bakerQueue.then(async () => {
    if (!hasCustomOverrides && BAKED_CACHE.has(key)) {
      return BAKED_CACHE.get(key)!;
    }
    const result = await runSingleThreeBake(design, { ...options, materialFinish: finish }, darkTheme);
    if (!hasCustomOverrides) {
      BAKED_CACHE.set(key, result);
    }
    return result;
  });

  bakerQueue = job.catch(() => undefined);
  return job;
}

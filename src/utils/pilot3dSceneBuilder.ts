import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PrintMaterialFinish, TagDesignTemplate } from '../types/domain';
import {
  buildPilot3dTextureSurfaceSvg,
  getDieCutContourPolygonMm,
  getPilotTrimDimensionsMm,
  PilotLabelRenderOptions,
  resolvePilotArtStyle,
} from './pilotLabelArtwork';
import { getMasterDieCutPolygonMm, getMasterSpecById } from './masterCollectionProduction';

export type CameraPresetAngle = 'hero_3q' | 'macro_angle' | 'studio_top' | 'edge_profile';

export interface SubstratePbrProfile {
  roughness: number;
  metalness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  edgeHex: string;
  transparentEdge: boolean;
  bumpType: 'matte_grain' | 'brushed' | 'smooth' | 'outdoor_pebble';
}

export function getSubstratePbrProfile(finish: PrintMaterialFinish): SubstratePbrProfile {
  switch (finish) {
    case 'soft_matte_foil':
      return {
        roughness: 0.72,
        metalness: 0.1,
        clearcoat: 0.12,
        clearcoatRoughness: 0.45,
        edgeHex: '#252B37',
        transparentEdge: false,
        bumpType: 'matte_grain',
      };
    case 'glossy_vinyl':
      return {
        roughness: 0.16,
        metalness: 0.04,
        clearcoat: 0.92,
        clearcoatRoughness: 0.08,
        edgeHex: '#F8FAFC',
        transparentEdge: false,
        bumpType: 'smooth',
      };
    case 'textured_outdoor_vinyl':
      return {
        roughness: 0.58,
        metalness: 0.04,
        clearcoat: 0.25,
        clearcoatRoughness: 0.35,
        edgeHex: '#E5DEC9',
        transparentEdge: false,
        bumpType: 'outdoor_pebble',
      };
    case 'brushed_polyester':
      return {
        roughness: 0.38,
        metalness: 0.26,
        clearcoat: 0.3,
        clearcoatRoughness: 0.24,
        edgeHex: '#CBD5E1',
        transparentEdge: false,
        bumpType: 'brushed',
      };
    case 'transparent_vinyl':
      return {
        roughness: 0.18,
        metalness: 0.02,
        clearcoat: 0.85,
        clearcoatRoughness: 0.1,
        edgeHex: '#E2E8F0',
        transparentEdge: true,
        bumpType: 'smooth',
      };
    case 'waterproof_vinyl':
    default:
      return {
        roughness: 0.44,
        metalness: 0.03,
        clearcoat: 0.32,
        clearcoatRoughness: 0.26,
        edgeHex: '#F1EFE7',
        transparentEdge: false,
        bumpType: 'matte_grain',
      };
  }
}

export function detectSoftwareWebGlRenderer(renderer: THREE.WebGLRenderer): boolean {
  try {
    const gl = renderer.getContext();
    const debugExt = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugExt) {
      const name = String(gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL) || '');
      if (/SwiftShader|llvmpipe|Software/i.test(name)) return true;
    }
    const rendererStr = String(gl.getParameter(gl.RENDERER) || '');
    return /SwiftShader|llvmpipe|Software/i.test(rendererStr);
  } catch {
    return false;
  }
}

/**
 * Generates procedural grayscale micro-bump map for printed paper / vinyl / polyester stocks.
 */
export function createSubstrateMicroBumpTexture(
  bumpType: SubstratePbrProfile['bumpType']
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;

    let seed = 1337;
    const nextRand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };

    if (bumpType === 'brushed') {
      for (let y = 0; y < size; y++) {
        const lineTone = 114 + Math.round((nextRand() - 0.5) * 32);
        for (let x = 0; x < size; x++) {
          const i = (y * size + x) * 4;
          const jitter = Math.round((nextRand() - 0.5) * 10);
          const v = Math.max(0, Math.min(255, lineTone + jitter));
          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
          data[i + 3] = 255;
        }
      }
    } else if (bumpType === 'matte_grain' || bumpType === 'outdoor_pebble') {
      const amp = bumpType === 'outdoor_pebble' ? 36 : 18;
      for (let p = 0; p < size * size; p++) {
        const v = Math.max(0, Math.min(255, Math.round(128 + (nextRand() - 0.5) * amp)));
        const i = p * 4;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates soft radial contact shadow disc texture (Three.js ground separation).
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.14,
      size / 2,
      size / 2,
      size * 0.5
    );
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.44)');
    grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.16)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds beveled die-cut extruded sticker geometry matching the exact SVG silhouette polygon,
 * with normalized UVs aligned 1:1 to [0..w, 0..h] of the Single-Source-of-Truth print texture.
 */
export function createDieCutLabelGeometry(design: TagDesignTemplate): {
  geometry: THREE.ExtrudeGeometry;
  normW: number;
  normH: number;
  thickness: number;
} {
  const style = resolvePilotArtStyle(design);
  const { widthMm, heightMm } = getPilotTrimDimensionsMm(design);
  const maxDim = Math.max(widthMm, heightMm);
  const scale = 2.65 / maxDim;
  const normW = widthMm * scale;
  const normH = heightMm * scale;
  const thickness = 0.036; // Realistic die-cut vinyl/paper sticker sheet thickness

  const masterSpec = getMasterSpecById(design.id);
  const ptsMm = masterSpec
    ? getMasterDieCutPolygonMm(masterSpec)
    : getDieCutContourPolygonMm(style, widthMm, heightMm);
  const shape = new THREE.Shape();
  ptsMm.forEach((pt, idx) => {
    const sx = pt.x * scale;
    const sy = pt.y * scale;
    if (idx === 0) shape.moveTo(sx, sy);
    else shape.lineTo(sx, sy);
  });
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
    curveSegments: 16,
  });

  // Recompute planar top-face UVs in [0..1] so the Print-Ready SVG maps 1:1 edge-to-edge
  const hw = normW / 2;
  const hh = normH / 2;
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = Math.max(0, Math.min(1, (x + hw) / normW));
    const v = Math.max(0, Math.min(1, (y + hh) / normH));
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;
  geometry.computeVertexNormals();

  return { geometry, normW, normH, thickness };
}

/**
 * Rasterizes the Single-Source-of-Truth Print Artwork SVG onto a crisp SRGB Three.js CanvasTexture.
 */
export async function rasterizePrintSurfaceToTexture(
  design: TagDesignTemplate,
  options: PilotLabelRenderOptions = {},
  maxAnisotropy = 4
): Promise<THREE.CanvasTexture> {
  const { widthMm, heightMm } = getPilotTrimDimensionsMm(design);
  const svgMarkup = buildPilot3dTextureSurfaceSvg(design, {
    ...options,
    scalePxPerMm: 14,
  });

  const targetW = Math.min(1400, Math.max(512, Math.round(widthMm * 14)));
  const targetH = Math.min(1400, Math.max(512, Math.round((targetW * heightMm) / widthMm)));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const masterSpec = getMasterSpecById(design.id);
    if (masterSpec && design.originalDesignUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('MASTER_SVG_TEXTURE_LOAD_ERROR'));
        img.src = design.originalDesignUrl!;
      });
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);
    } else {
      const img = new Image();
      const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      try {
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('SVG_TEXTURE_LOAD_ERROR'));
          img.src = url;
        });
        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.max(1, maxAnisotropy);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function getCameraPresetCoordinates(
  preset: CameraPresetAngle,
  normW: number,
  normH: number
): { position: [number, number, number]; target: [number, number, number] } {
  const span = Math.max(normW, normH);
  switch (preset) {
    case 'macro_angle':
      return {
        position: [span * 0.42, span * 0.72, span * 0.96],
        target: [normW * 0.12, 0.02, 0],
      };
    case 'studio_top':
      return {
        position: [0, span * 2.15, 0.14],
        target: [0, 0, 0],
      };
    case 'edge_profile':
      return {
        position: [span * 1.15, span * 0.48, span * 1.32],
        target: [0, 0.02, 0],
      };
    case 'hero_3q':
    default:
      return {
        position: [-span * 0.62, span * 1.48, span * 1.66],
        target: [0, 0, 0],
      };
  }
}

/**
 * Pure camera-distance zoom calculation along the ray between target and current camera position.
 */
export function computeZoomedCameraPosition(params: {
  position: [number, number, number];
  target: [number, number, number];
  scaleFactor: number;
  minDistance?: number;
  maxDistance?: number;
}): { position: [number, number, number]; distance: number } {
  const { position, target, scaleFactor, minDistance = 1.45, maxDistance = 8.5 } = params;
  const dx = position[0] - target[0];
  const dy = position[1] - target[1];
  const dz = position[2] - target[2];
  const currDist = Math.max(0.001, Math.hypot(dx, dy, dz));
  const nextDist = Math.max(minDistance, Math.min(maxDistance, currDist * scaleFactor));
  const ratio = nextDist / currDist;
  return {
    position: [
      target[0] + dx * ratio,
      target[1] + dy * ratio,
      target[2] + dz * ratio,
    ],
    distance: nextDist,
  };
}

export function setupStudioSceneEnvironment(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  bgHex: string
): THREE.Texture | null {
  scene.background = new THREE.Color(bgHex);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const roomEnv = new RoomEnvironment();
  const envRt = pmrem.fromScene(roomEnv, 0.04);
  scene.environment = envRt.texture;
  roomEnv.dispose();
  pmrem.dispose();

  const hemi = new THREE.HemisphereLight(0xfbf9f5, 0xd4cfc4, 0.8);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xfff8ed, 1.6);
  keyLight.position.set(2.5, 4.0, 2.3);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xe2e8f0, 0.72);
  rimLight.position.set(-2.6, 1.7, -2.1);
  scene.add(rimLight);

  return envRt.texture;
}

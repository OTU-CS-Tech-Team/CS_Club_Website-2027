'use client';

import { useEffect, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import type { HackHiveClip } from '@/types/landing';

type HackHiveStripCanvasProps = {
  sectionRef: RefObject<HTMLElement | null>;
  clips: HackHiveClip[];
};

const PHOTO_W = 1.62;
const PHOTO_H = 1.1;
const TOP_BAND = 0.12;
const BOTTOM_BAND = 0.24;
const TOP_BLEED = 0.13;
const OVERLAY_W = PHOTO_W + 0.03;
const OVERLAY_H = PHOTO_H + TOP_BAND + BOTTOM_BAND;
const FILM_INK = '#eadfc8';
const VISIBLE = 4;
const COPIES = 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function roundedRectShape(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);

  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  return shape;
}

function roundedPlaneGeometry(width: number, height: number, radius: number) {
  const geometry = new THREE.ShapeGeometry(roundedRectShape(width, height, radius), 24);
  const uv = geometry.attributes.uv;
  const pos = geometry.attributes.position;
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, (pos.getX(i) + width / 2) / width, (pos.getY(i) + height / 2) / height);
  }
  uv.needsUpdate = true;
  return geometry;
}

function coverMap(texture: THREE.Texture, sourceAspect: number, planeAspect: number) {
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.center.set(0.5, 0.5);
  if (sourceAspect > planeAspect) {
    texture.repeat.set(planeAspect / sourceAspect, 1);
  } else {
    texture.repeat.set(1, sourceAspect / planeAspect);
  }
  texture.offset.set(0, 0);
  texture.needsUpdate = true;
}

function frameCode(index: number) {
  const n = 22 + (index % 8);
  return index % 2 === 0 ? String(n) : `${n}A`;
}

function soundtrackPattern(code: string, i: number) {
  let h = 0;
  for (let n = 0; n < code.length; n += 1) h = (h * 33 + code.charCodeAt(n) + i) | 0;
  return Math.abs(h);
}

function createFilmOverlayTexture(code: string, index: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  ctx.fillStyle = '#070707';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const topPx = (TOP_BAND / OVERLAY_H) * canvas.height;
  const botPx = (BOTTOM_BAND / OVERLAY_H) * canvas.height;
  const windowW = (PHOTO_W / OVERLAY_W) * canvas.width;
  const windowH = canvas.height - topPx - botPx;
  const windowX = (canvas.width - windowW) / 2;
  const windowY = topPx;
  const r = 3;

  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.moveTo(windowX + r, windowY);
  ctx.arcTo(windowX + windowW, windowY, windowX + windowW, windowY + windowH, r);
  ctx.arcTo(windowX + windowW, windowY + windowH, windowX, windowY + windowH, r);
  ctx.arcTo(windowX, windowY + windowH, windowX, windowY, r);
  ctx.arcTo(windowX, windowY, windowX + windowW, windowY, r);
  ctx.closePath();
  ctx.fill();

  const punch = (cx: number, cy: number) => {
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(cx - 14, cy - 8, 28, 16, 3);
    } else {
      ctx.rect(cx - 14, cy - 8, 28, 16);
    }
    ctx.fill();
  };

  for (let i = 0; i < 11; i += 1) {
    const x = 48 + i * ((canvas.width - 96) / 10);
    punch(x, topPx * 0.58);
    punch(x, canvas.height - botPx * 0.26);
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = FILM_INK;
  ctx.font = '600 18px "Courier New", ui-monospace, monospace';
  ctx.fillText(code, 52, topPx * 0.72);
  ctx.font = '500 14px "Courier New", ui-monospace, monospace';
  ctx.fillText('200', canvas.width / 2 - 16, topPx * 0.68);

  const neighbor = frameCode(index + 1);
  const units = [code, neighbor];
  const slotW = canvas.width / 2;
  const keyBase = windowY + windowH + botPx * 0.58;
  const maxH = botPx * 0.28;
  const barW = 2.4;
  const gap = 1.1;

  units.forEach((label, unit) => {
    const seed = soundtrackPattern(label, index + unit);
    const kind = seed % 4;
    const textX = 28 + unit * slotW;
    ctx.font = '600 20px "Courier New", ui-monospace, monospace';
    ctx.fillStyle = FILM_INK;
    ctx.fillText(label, textX, keyBase + 2);

    const startX = textX + ctx.measureText(label).width + 10;
    const endX = textX + slotW - 36;
    const count = Math.max(10, Math.floor((endX - startX) / (barW + gap)));
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0 : i / (count - 1);
      const n = ((seed * 11 + i * 29) % 1000) / 1000;
      let fill = 0.82;
      if (kind === 0) fill = 0.78 + n * 0.16;
      if (kind === 1) fill = t > 0.55 && t < 0.7 ? 0.35 : 0.8 + n * 0.12;
      if (kind === 2) fill = 0.55 + Math.abs(Math.sin(t * 6.2)) * 0.35 + n * 0.06;
      if (kind === 3) fill = n > 0.72 ? 0.4 : 0.84;
      const h = Math.max(4, maxH * fill);
      ctx.fillRect(startX + i * (barW + gap), keyBase - h, barW, h);
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function createGrainMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    toneMapped: false,
    uniforms: {
      uTime: { value: 0 },
      uAmount: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uAmount;
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }
      void main() {
        float n = hash(vUv * vec2(920.0, 540.0) + uTime);
        float scratch = step(0.997, hash(vec2(vUv.x * 80.0, uTime * 0.15)));
        float a = (n * 0.55 + scratch * 0.35) * uAmount;
        gl_FragColor = vec4(vec3(n * 0.85 + 0.05), a);
      }
    `,
  });
}

function loadClipTexture(
  clip: HackHiveClip,
  planeAspect: number,
  onReady: (texture: THREE.Texture, disposeExtra?: () => void) => void,
) {
  if (clip.type === 'video') {
    const video = document.createElement('video');
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.preload = 'auto';
    video.src = clip.src;
    if (/^https?:\/\//i.test(clip.src)) video.crossOrigin = 'anonymous';

    const onLoaded = () => {
      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      const aspect = video.videoWidth && video.videoHeight ? video.videoWidth / video.videoHeight : planeAspect;
      coverMap(texture, aspect, planeAspect);
      void video.play().catch(() => {});
      onReady(texture, () => {
        video.removeEventListener('loadeddata', onLoaded);
        video.pause();
        video.removeAttribute('src');
        video.load();
      });
    };
    video.addEventListener('loadeddata', onLoaded);
    video.load();
    return;
  }

  const loader = new THREE.TextureLoader();
  loader.load(clip.src, (texture: THREE.Texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    const image = texture.image as HTMLImageElement;
    const aspect = image?.width && image?.height ? image.width / image.height : planeAspect;
    coverMap(texture, aspect, planeAspect);
    onReady(texture);
  });
}

type FrameBits = {
  group: THREE.Group;
  photoMat: THREE.MeshBasicMaterial;
  bezelMat: THREE.MeshBasicMaterial;
  overlayMat: THREE.MeshBasicMaterial;
  overlayTexture: THREE.CanvasTexture;
};

export default function HackHiveStripCanvas({ sectionRef, clips }: HackHiveStripCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const section = sectionRef.current;
    if (!host || !section || clips.length === 0) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let disposed = false;
    let frameId = 0;
    let travel = 0;
    let lastTime = performance.now();
    const extraDisposers: Array<() => void> = [];

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
    camera.position.set(0, 0.02, 5.15);

    const strip = new THREE.Group();
    scene.add(strip);

    const photoGeo = roundedPlaneGeometry(PHOTO_W, PHOTO_H + TOP_BLEED, 0.04);
    const bezelGeo = roundedPlaneGeometry(PHOTO_W + 0.08, PHOTO_H + 0.08, 0.07);
    const overlayGeo = roundedPlaneGeometry(OVERLAY_W, OVERLAY_H, 0.04);
    const planeAspect = PHOTO_W / (PHOTO_H + TOP_BLEED);

    const unique = clips.length;
    const total = unique * COPIES;
    const frames: FrameBits[] = [];

    for (let i = 0; i < total; i += 1) {
      const clip = clips[i % unique];
      const group = new THREE.Group();

      const bezelMat = new THREE.MeshBasicMaterial({
        color: 0x141416,
        transparent: true,
        opacity: 1,
      });
      const bezel = new THREE.Mesh(bezelGeo, bezelMat);
      bezel.position.z = -0.012;

      const photoMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        toneMapped: false,
        transparent: true,
        opacity: 1,
      });
      const photo = new THREE.Mesh(photoGeo, photoMat);
      photo.position.set(0, TOP_BLEED / 2, 0);

      const overlayTexture = createFilmOverlayTexture(frameCode(i), i);
      const overlayMat = new THREE.MeshBasicMaterial({
        map: overlayTexture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
        alphaTest: 0.08,
      });
      const overlay = new THREE.Mesh(overlayGeo, overlayMat);
      overlay.position.z = 0.012;

      group.add(bezel);
      group.add(photo);
      group.add(overlay);
      strip.add(group);

      frames.push({ group, photoMat, bezelMat, overlayMat, overlayTexture });

      loadClipTexture(clip, planeAspect, (texture, disposeExtra) => {
        if (disposed) {
          texture.dispose();
          disposeExtra?.();
          return;
        }
        photoMat.map = texture;
        photoMat.needsUpdate = true;
        if (disposeExtra) extraDisposers.push(disposeExtra);
      });
    }

    const grainMat = createGrainMaterial();
    const grain = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), grainMat);
    grain.position.z = 1.4;
    grain.renderOrder = 20;
    scene.add(grain);

    const setSize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (width < 8 || height < 8) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const scrollProgress = () => {
      if (reduceMotion) return 1;
      const totalScroll = section.offsetHeight - window.innerHeight;
      if (totalScroll <= 0) return 0;
      return clamp(-section.getBoundingClientRect().top / totalScroll, 0, 1);
    };

    const viewWidth = () => {
      const distance = camera.position.z;
      const visibleHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * distance;
      return visibleHeight * camera.aspect;
    };

    const layout = (progress: number, dt: number) => {
      const film = reduceMotion ? 1 : smoothstep(0.03, 0.5, progress);
      const loopOn = reduceMotion ? 1 : smoothstep(0.5, 0.66, progress);
      const mid = (VISIBLE - 1) / 2;
      const pitchConcert = PHOTO_W * 1.14;
      const pitchFilm = PHOTO_W * 1.006;
      const pitch = lerp(pitchConcert, pitchFilm, film);
      const overlayW = OVERLAY_W;
      const overlayH = OVERLAY_H;
      const visibleH =
        2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
      const fourWide = pitch * (VISIBLE - 1) + overlayW;
      const widthFit = viewWidth() / Math.max(fourWide, 0.001);
      const heightFit = (visibleH * 0.94) / overlayH;
      const fit = Math.min(heightFit, widthFit * 1.16);

      travel += dt * 0.20 * loopOn;
      const cycle = unique * pitchFilm;
      if (cycle > 0) travel %= cycle;

      strip.scale.setScalar(fit);
      strip.position.x = lerp(0, -travel * fit, loopOn);

      frames.forEach((item, index) => {
        const concertX =
          index < VISIBLE ? (index - mid) * pitchConcert : (index - mid) * pitchFilm;
        const filmX = (index - mid) * pitchFilm;
        item.group.position.x = lerp(concertX, filmX, film);
        const concertZ =
          index === 0 || index === VISIBLE - 1 ? 0.32 : index < VISIBLE ? 0.1 : 0.4;
        item.group.position.z = lerp(concertZ, 0, film);
        const wrap = index === 0 ? 0.34 : index === VISIBLE - 1 ? -0.34 : 0;
        item.group.rotation.y = index < VISIBLE ? lerp(wrap, 0, film) : 0;

        const extra = index >= VISIBLE ? smoothstep(0.4, 0.78, film) : 1;
        item.photoMat.opacity = extra;
        item.bezelMat.opacity = extra * lerp(1, 0, film);
        item.overlayMat.opacity = extra * film;

        const warm = film;
        item.photoMat.color.setRGB(lerp(1, 0.93, warm), lerp(1, 0.86, warm), lerp(1, 0.78, warm));
      });

      grainMat.uniforms.uAmount.value = film * 0.12;
      grain.scale.set((viewWidth() / 12) * 1.6, ((viewWidth() / camera.aspect) / 8) * 1.6, 1);
    };

    let shownProgress = reduceMotion ? 1 : 0;

    const tick = (now: number) => {
      if (disposed) return;
      frameId = window.requestAnimationFrame(tick);
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const progress = scrollProgress();
      shownProgress += (progress - shownProgress) * (reduceMotion ? 1 : 0.085);
      grainMat.uniforms.uTime.value = now * 0.001;

      layout(shownProgress, dt);
      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(setSize);
    setSize();
    window.requestAnimationFrame(setSize);
    resizeObserver.observe(host);
    window.addEventListener('resize', setSize);
    layout(scrollProgress(), 0);
    frameId = window.requestAnimationFrame(tick);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', setSize);
      extraDisposers.forEach((fn) => fn());
      frames.forEach((item) => {
        item.photoMat.map?.dispose();
        item.photoMat.dispose();
        item.bezelMat.dispose();
        item.overlayMat.dispose();
        item.overlayTexture.dispose();
      });
      photoGeo.dispose();
      bezelGeo.dispose();
      overlayGeo.dispose();
      grain.geometry.dispose();
      grainMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [sectionRef, clips]);

  return (
    <div
      ref={hostRef}
      className="absolute inset-0 h-full min-h-[36vh] w-full"
      style={{ minHeight: '36vh' }}
    />
  );
}

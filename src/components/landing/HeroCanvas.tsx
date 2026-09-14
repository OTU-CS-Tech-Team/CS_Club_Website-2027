'use client';

import { useEffect, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import styles from './landing.module.css';

const CLIP_SRC =
  'https://efkbzaxczglgyfsaynjw.supabase.co/storage/v1/object/public/hero/Adobe%20Express%20-%20CS_CLUB_Recap.mp4';
const STACK_RADIUS = 0.16;

type HeroCanvasProps = {
  sectionRef: RefObject<HTMLElement | null>;
};

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
  const geometry = new THREE.ShapeGeometry(roundedRectShape(width, height, radius), 28);
  const uv = geometry.attributes.uv;
  const pos = geometry.attributes.position;
  for (let i = 0; i < uv.count; i += 1) {
    uv.setXY(i, (pos.getX(i) + width / 2) / width, (pos.getY(i) + height / 2) / height);
  }
  uv.needsUpdate = true;
  return geometry;
}

function createPlaceholderTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  let time = 0;
  const draw = () => {
    if (!ctx) return;
    time += 0.01;
    const gradient = ctx.createLinearGradient(0, 0, 1280, 720);
    gradient.addColorStop(0, `hsl(${258 + Math.sin(time) * 8}, 16%, 16%)`);
    gradient.addColorStop(1, 'hsl(250, 12%, 6%)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '500 34px Inter, system-ui, sans-serif';
    ctx.fillText('Club clip', 72, 640);
    texture.needsUpdate = true;
  };

  draw();
  return { texture, draw };
}

function coverVideo(texture: THREE.VideoTexture, video: HTMLVideoElement, planeAspect: number) {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (!width || !height) return;

  const videoAspect = width / height;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.center.set(0, 0);

  if (videoAspect > planeAspect) {
    const repeatX = planeAspect / videoAspect;
    texture.repeat.set(repeatX, 1);
    texture.offset.set((1 - repeatX) / 2, 0);
  } else {
    const repeatY = videoAspect / planeAspect;
    texture.repeat.set(1, repeatY);
    texture.offset.set(0, (1 - repeatY) / 2);
  }
  texture.needsUpdate = true;
}

function createLoopingClip(src: string, onReady: (video: HTMLVideoElement) => void) {
  const video = document.createElement('video');
  video.muted = true;
  video.defaultMuted = true;
  video.volume = 0;
  video.playsInline = true;
  video.preload = 'auto';
  video.loop = true;
  video.controls = false;
  video.disablePictureInPicture = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  if (/^https?:\/\//i.test(src)) {
    video.crossOrigin = 'anonymous';
  }
  video.src = src;

  const onLoaded = () => {
    onReady(video);
    void video.play().catch(() => {});
  };

  video.addEventListener('loadeddata', onLoaded);
  video.load();

  return {
    video,
    dispose() {
      video.removeEventListener('loadeddata', onLoaded);
      video.pause();
      video.removeAttribute('src');
      video.load();
    },
  };
}

function createAnnotation(width: number, height: number, radius: number) {
  const group = new THREE.Group();
  const disposables: THREE.BufferGeometry[] = [];

  const borderMat = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
  });
  const dashMat = new THREE.LineDashedMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    dashSize: 0.035,
    gapSize: 0.028,
  });
  const markMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const borderGeo = new THREE.BufferGeometry().setFromPoints(
    roundedRectShape(width, height, radius).getPoints(72),
  );
  disposables.push(borderGeo);
  group.add(new THREE.LineLoop(borderGeo, borderMat));

  const dashes: number[] = [];
  for (let i = 1; i <= 6; i += 1) {
    const y = -height / 2 + (height * i) / 7;
    dashes.push(-width * 0.46, y, 0.006, width * 0.46, y, 0.006);
  }
  const dashGeo = new THREE.BufferGeometry();
  dashGeo.setAttribute('position', new THREE.Float32BufferAttribute(dashes, 3));
  const dash = new THREE.LineSegments(dashGeo, dashMat);
  dash.computeLineDistances();
  disposables.push(dashGeo);
  group.add(dash);

  const mark = new THREE.ConeGeometry(0.012, 0.022, 3);
  disposables.push(mark);
  for (let i = 0; i < 10; i += 1) {
    const cone = new THREE.Mesh(mark, markMat);
    cone.position.set(
      ((i % 5) - 2) * (width * 0.16),
      ((i < 5 ? 1 : -1) * height) / 4.6,
      0.008,
    );
    cone.rotation.z = Math.PI;
    group.add(cone);
  }

  return { group, borderMat, dashMat, markMat, disposables };
}

export default function HeroCanvas({ sectionRef }: HeroCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const section = sectionRef.current;
    if (!host || !section) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let disposed = false;
    let frame = 0;
    let playlist: ReturnType<typeof createLoopingClip> | null = null;
    let placeholderDraw: (() => void) | null = null;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0xffffff, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
    camera.position.set(0, 0, 6);

    const rig = new THREE.Group();
    scene.add(rig);

    const screenWidth = 2.55;
    const screenHeight = 1.5;
    const radius = 0.14;
    const geometry = new THREE.ShapeGeometry(
      roundedRectShape(screenWidth, screenHeight, radius),
      22,
    );

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const panes: THREE.Group[] = [];
    const glassLayers: Array<ReturnType<typeof createAnnotation>> = [];
    const glassMats: THREE.MeshBasicMaterial[] = [];

    const makeGlass = (order: number) => {
      const glassMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const glass = new THREE.Mesh(geometry, glassMat);
      glass.renderOrder = order;
      const annotation = createAnnotation(screenWidth, screenHeight, radius);
      annotation.group.renderOrder = order + 1;
      const layer = new THREE.Group();
      layer.add(glass);
      layer.add(annotation.group);
      layer.userData.kind = 'glass';
      layer.userData.hover = 0;
      rig.add(layer);
      panes.push(layer);
      glassLayers.push(annotation);
      glassMats.push(glassMat);
    };

    const clipMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      toneMapped: false,
      transparent: true,
    });
    const clipMatIntro = clipMat.clone();
    const videoGeo = roundedPlaneGeometry(screenWidth, screenHeight, STACK_RADIUS);
    const videoGeoIntro = roundedPlaneGeometry(screenWidth, screenHeight, 0);
    const clip = new THREE.Mesh(videoGeo, clipMat);
    const clipIntro = new THREE.Mesh(videoGeoIntro, clipMatIntro);
    clip.renderOrder = 0;
    clipIntro.renderOrder = 0;
    const clipWire = createAnnotation(screenWidth, screenHeight, radius);
    clipWire.group.renderOrder = 1;
    const clipGroup = new THREE.Group();
    clipGroup.add(clipIntro);
    clipGroup.add(clip);
    clipGroup.add(clipWire.group);
    clipGroup.userData.kind = 'clip';
    clipGroup.userData.hover = 0;
    rig.add(clipGroup);
    panes.push(clipGroup);
    glassLayers.push(clipWire);

    makeGlass(2);
    makeGlass(4);
    makeGlass(6);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const setSize = () => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };

    const scrollProgress = () => {
      if (reduceMotion) return 1;
      const total = section.offsetHeight - window.innerHeight;
      if (total <= 0) return 0;
      return clamp(-section.getBoundingClientRect().top / total, 0, 1);
    };

    const viewSize = (planeZ = 0) => {
      const distance = Math.max(camera.position.z - planeZ, 0.35);
      const visibleHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * distance;
      const visibleWidth = visibleHeight * camera.aspect;
      return { visibleWidth, visibleHeight };
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      mouse.tx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.ty = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    };

    const layout = (progress: number) => {
      const framed = reduceMotion ? 1 : smoothstep(0.12, 0.62, progress);
      const stacked = reduceMotion ? 1 : smoothstep(0.48, 0.92, progress);
      const mobile = host.clientWidth < 760;
      const originX = mobile ? 0.55 : 1.48;
      const rotY = mobile ? -0.5 : -0.64;
      const rotX = 0.09;
      const card = mobile ? 0.86 : 1.08;
      const gap = 0.42;

      panes.forEach((pane, index) => {
        const t = index / (panes.length - 1);
        const planeZ = lerp(0, -gap * (panes.length - 1 - index), stacked);
        const { visibleWidth, visibleHeight } = viewSize(planeZ);
        pane.scale.set(
          lerp(visibleWidth / screenWidth, card, framed),
          lerp(visibleHeight / screenHeight, card, framed),
          1,
        );
        pane.position.set(
          lerp(0, originX + (1 - t) * (mobile ? 0.24 : 0.4), stacked),
          lerp(0, (1 - t) * 0.05, stacked),
          planeZ,
        );
        pane.rotation.set(lerp(0, rotX, stacked), lerp(0, rotY, stacked), 0);
        pane.userData.baseZ = pane.position.z;
      });

      clipMatIntro.opacity = 1 - framed;
      clipMat.opacity = framed;
      clipIntro.visible = framed < 0.999;
      clip.visible = framed > 0.001;
      clipMat.color.setRGB(
        lerp(1, 0.78, stacked),
        lerp(1, 0.8, stacked),
        lerp(1, 0.82, stacked),
      );
      renderer.setClearColor(framed < 0.12 ? 0xffffff : 0x000000, framed < 0.12 ? 1 : 0);

      glassMats.forEach((material, index) => {
        const front = index / Math.max(glassMats.length - 1, 1);
        material.opacity = stacked * lerp(0.008, 0.035, front);
      });
      glassLayers.forEach((layer, index) => {
        const isClip = index === 0;
        const isFront = index === glassLayers.length - 1;
        const depth = index / Math.max(glassLayers.length - 1, 1);
        layer.borderMat.opacity = stacked * (isFront ? 0.92 : isClip ? 0.14 : lerp(0.12, 0.34, depth));
        layer.dashMat.opacity = stacked * (isFront ? 0.38 : 0);
        layer.markMat.opacity = stacked * (isFront ? 0.48 : 0);
      });

      camera.position.set(
        lerp(0, mobile ? -0.05 : -0.08, stacked),
        lerp(0, 0.08, stacked),
        lerp(6, mobile ? 5.3 : 5.1, framed),
      );
      camera.lookAt(lerp(0, mobile ? 0.22 : 0.52, stacked), 0, 0);

      section.dataset.phase = stacked > 0.55 ? 'stack' : framed > 0.55 ? 'frame' : 'intro';
      section.style.setProperty('--hero-p', progress.toFixed(4));
    };

    let shownProgress = reduceMotion ? 1 : 0;

    const tick = () => {
      if (disposed) return;
      frame = window.requestAnimationFrame(tick);
      placeholderDraw?.();

      const progress = scrollProgress();
      shownProgress += (progress - shownProgress) * (reduceMotion ? 1 : 0.11);
      const stacked = reduceMotion ? 1 : smoothstep(0.48, 0.92, shownProgress);
      mouse.x += (mouse.tx - mouse.x) * 0.045;
      mouse.y += (mouse.ty - mouse.y) * 0.045;

      layout(shownProgress);

      rig.rotation.y = -mouse.x * 0.07 * stacked;
      rig.rotation.x = mouse.y * 0.025 * stacked;
      rig.position.set(0, 0, 0);

      pointer.set(mouse.x, -mouse.y);
      raycaster.setFromCamera(pointer, camera);
      const hits = stacked > 0.2 ? raycaster.intersectObjects(rig.children, true) : [];
      let hitPane: THREE.Object3D | null = hits[0]?.object ?? null;
      while (hitPane && !panes.includes(hitPane as THREE.Group)) {
        hitPane = hitPane.parent;
      }
      panes.forEach((pane) => {
        const hovered = hitPane === pane ? 1 : 0;
        pane.userData.hover = lerp(pane.userData.hover, hovered, 0.12);
        pane.position.z = pane.userData.baseZ + pane.userData.hover * 0.03;
      });

      renderer.render(scene, camera);
    };

    const onResize = () => setSize();
    const resizeObserver = new ResizeObserver(onResize);
    setSize();
    resizeObserver.observe(host);
    window.addEventListener('resize', onResize);
    host.addEventListener('pointermove', onPointerMove);

    const planeAspect = screenWidth / screenHeight;
    let videoTexture: THREE.VideoTexture | null = null;

    playlist = createLoopingClip(CLIP_SRC, (clipVideo) => {
      if (disposed) return;
      videoTexture = new THREE.VideoTexture(clipVideo);
      videoTexture.colorSpace = THREE.SRGBColorSpace;
      videoTexture.minFilter = THREE.LinearFilter;
      videoTexture.magFilter = THREE.LinearFilter;
      videoTexture.generateMipmaps = false;
      coverVideo(videoTexture, clipVideo, planeAspect);
      clipMat.map = videoTexture;
      clipMatIntro.map = videoTexture;
      clipMat.needsUpdate = true;
      clipMatIntro.needsUpdate = true;
    });

    const fallbackTimer = window.setTimeout(() => {
      if (disposed || clipMat.map) return;
      const placeholder = createPlaceholderTexture();
      placeholderDraw = placeholder.draw;
      clipMat.map = placeholder.texture;
      clipMatIntro.map = placeholder.texture;
      clipMat.needsUpdate = true;
      clipMatIntro.needsUpdate = true;
    }, 2500);

    layout(scrollProgress());
    tick();

    return () => {
      disposed = true;
      window.clearTimeout(fallbackTimer);
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener('resize', onResize);
      host.removeEventListener('pointermove', onPointerMove);
      playlist?.dispose();
      videoTexture?.dispose();
      geometry.dispose();
      videoGeo.dispose();
      videoGeoIntro.dispose();
      clipMat.map?.dispose();
      clipMat.dispose();
      clipMatIntro.dispose();
      glassMats.forEach((material) => material.dispose());
      glassLayers.forEach((layer) => {
        layer.borderMat.dispose();
        layer.dashMat.dispose();
        layer.markMat.dispose();
        layer.disposables.forEach((item) => item.dispose());
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [sectionRef]);

  return <div ref={hostRef} className={styles.heroGl} />;
}

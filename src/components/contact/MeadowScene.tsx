'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import styles from '@/app/contact/contact.module.css';

type MeadowSceneProps = {
  onMailboxClick: () => void;
  flagUp: boolean;
  onFirstFrame?: () => void;
  onHintPosition?: (x: number, y: number) => void;
  stacked?: boolean;
  slotRef?: React.RefObject<HTMLDivElement | null>;
};

const REDUCE_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function MeadowScene({
  onMailboxClick,
  flagUp,
  onFirstFrame,
  onHintPosition,
  stacked = false,
  slotRef,
}: MeadowSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number>(0);
  const mailboxRef = useRef<THREE.Group | null>(null);
  const flagRef = useRef<THREE.Group | null>(null);
  const isVisibleRef = useRef(true);
  const mouseRef = useRef(new THREE.Vector2(-9, -9));
  const parallaxRef = useRef(new THREE.Vector2(0, 0));
  const hoveringRef = useRef(false);
  const animRef = useRef({ hoverScale: 0, flag: 0, wobble: 0 });
  const baseRef = useRef({ camY: 1, D: 8, sx: 0, sy: 0 });
  const hintPosRef = useRef({ x: 0, y: 0 });
  const firstFrameRef = useRef(false);
  const redMatsRef = useRef<THREE.MeshPhysicalMaterial[]>([]);
  const glowRef = useRef<THREE.Sprite | null>(null);
  const windUniformsRef = useRef({ uTime: { value: 0 } });
  const skyUniformsRef = useRef<{ uTime: { value: number } } | null>(null);

  const heightAt = useCallback((x: number, z: number) => {
    let h = 0.32 * Math.exp(-(x * x / 40 + z * z / 14));
    h += 0.06 * Math.sin(x * 0.35 + 0.4) * Math.cos(z * 0.3) + 0.03 * Math.sin(x * 0.9 - z * 0.7);
    h -= 0.012 * Math.max(0, -z - 5) ** 1.35;
    h -= 0.04 * Math.max(0, z - 1.5) ** 2 * 0.5;
    return h;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches;
    const stackedMQ = typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023.98px)') : null;
    let STACKED = stacked || (stackedMQ?.matches ?? false);
    const STACKED0 = STACKED;
    const DPR_CAP = 1.5;
    const dpr = Math.min(window.devicePixelRatio, DPR_CAP);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.className = styles.sceneCanvas;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const HAZE = new THREE.Color('#d4e3ef');
    scene.fog = new THREE.FogExp2(HAZE, 0.013);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 600);
    cameraRef.current = camera;

    const SUN_SKY = new THREE.Vector3(-0.62, 0.3, -0.72).normalize();

    const skyUniforms = {
      uTime: { value: 0 },
      sunDir: { value: SUN_SKY },
      haze: { value: HAZE },
      zenith: { value: new THREE.Color('#2f6fc4') },
      mid: { value: new THREE.Color('#6fa6e0') },
    };
    skyUniformsRef.current = skyUniforms;

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(400, 48, 24),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
        uniforms: skyUniforms,
        vertexShader: `varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix*modelViewMatrix*vec4(position,1.); gl_Position = p.xyww; }`,
        fragmentShader: `uniform float uTime; uniform vec3 sunDir, haze, zenith, mid; varying vec3 vDir;
          float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
          float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
            return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
          float fbm(vec2 p){ float v=0., a=.5; mat2 m=mat2(1.6,1.2,-1.2,1.6); for(int i=0;i<5;i++){ v+=a*noise(p); p=m*p; a*=.5; } return v; }
          void main(){
            vec3 d = normalize(vDir); float h = max(d.y, 0.);
            vec3 col = mix(haze, mid, smoothstep(0.0, 0.28, h));
            col = mix(col, zenith, smoothstep(0.22, 0.9, h));
            float s = max(dot(d, sunDir), 0.);
            vec3 sunC = vec3(1.0, 0.93, 0.80);
            col += sunC * (pow(s, 6.) * 0.16 + pow(s, 48.) * 0.35 + pow(s, 900.) * 1.6);
            if (d.y > 0.0) {
              vec2 uv = d.xz / (d.y + 0.09);
              vec2 drift = vec2(uTime * 0.012, uTime * 0.002);
              vec2 p = uv * 0.85 + drift;
              float mask = smoothstep(0.38, 0.72, fbm(p * 0.28 + vec2(3.1, 7.7)));
              vec2 q = vec2(fbm(p), fbm(p + vec2(5.2, 1.3)));
              float n = fbm(p * 1.5 + q * 1.3);
              float n2 = fbm((p - sunDir.xz * 0.09) * 1.5 + q * 1.3);
              float cover = n * 0.75 + mask * 0.45;
              float dens = smoothstep(0.64, 0.88, cover);
              float light = clamp(0.6 + (n - n2) * 3.5, 0., 1.);
              vec3 cloudC = mix(vec3(0.62, 0.68, 0.79), vec3(1.0, 0.99, 0.97), light);
              cloudC = mix(cloudC, vec3(0.58, 0.64, 0.75), smoothstep(0.82, 1.05, cover) * 0.45);
              cloudC += sunC * pow(s, 10.) * 0.25 * (1. - dens);
              float fade = smoothstep(0.0, 0.2, d.y);
              col = mix(col, cloudC, dens * fade * 0.95);
              vec2 c = vec2(uv.x * 0.18, uv.y * 0.9) + drift * 1.6 + q * 0.4;
              float w = smoothstep(0.55, 0.9, fbm(c * 1.3));
              col = mix(col, vec3(1.0), w * 0.28 * fade * (1. - dens));
            }
            col = mix(col, haze, (1. - smoothstep(0.0, 0.06, h)) * 0.7);
            gl_FragColor = vec4(col, 1.);
            #include <colorspace_fragment>
          }`,
      })
    );
    sky.renderOrder = -1;
    scene.add(sky);

    // Environment map for metal reflections
    {
      const envScene = new THREE.Scene();
      envScene.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(10, 32, 16),
          new THREE.ShaderMaterial({
            side: THREE.BackSide,
            vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
            fragmentShader: `varying vec3 vDir; void main(){ vec3 d = normalize(vDir);
              vec3 c = d.y > 0. ? mix(vec3(.85,.9,.95), vec3(.35,.55,.85), pow(d.y,.6)) : mix(vec3(.55,.6,.5), vec3(.12,.18,.08), pow(-d.y,.5));
              c += vec3(1.,.95,.85) * pow(max(dot(d, normalize(vec3(-.5,.6,.6))),0.), 60.) * 8.;
              gl_FragColor = vec4(c,1.); }`,
          })
        )
      );
      const pm = new THREE.PMREMGenerator(renderer);
      scene.environment = pm.fromScene(envScene, 0.02).texture;
      scene.environmentIntensity = 0.75;
    }

    scene.add(new THREE.HemisphereLight('#cfe3f7', '#4a5a32', 0.9));
    const sun = new THREE.DirectionalLight('#fff3e0', 2.6);
    sun.position.set(-5, 8, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(STACKED ? 1024 : 2048, STACKED ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 30 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    sun.shadow.radius = 6;
    scene.add(sun);
    const rim = new THREE.DirectionalLight('#ffe6c4', 1.1);
    rim.position.set(-6, 3, -7);
    scene.add(rim);

    // Terrain
    {
      const g = new THREE.PlaneGeometry(140, 90, 220, 160);
      g.rotateX(-Math.PI / 2);
      g.translate(0, 0, -36);
      const p = g.attributes.position;
      const col: number[] = [];
      const c = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        const z = p.getZ(i);
        const y = heightAt(x, z);
        p.setY(i, y);
        const n = Math.sin(x * 1.3) * Math.cos(z * 1.1) * 0.5 + Math.sin(x * 0.27 + z * 0.41) * 0.5;
        c.setHSL(0.23 + n * 0.015, 0.42, 0.2 + n * 0.025);
        col.push(c.r, c.g, c.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.computeVertexNormals();
      const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
      ground.receiveShadow = true;
      scene.add(ground);
    }

    // Distant ridges
    function ridge(z: number, base: number, amp: number, seed: number, color: string, rough: number) {
      const g = new THREE.PlaneGeometry(500, 60, 400, 6);
      g.rotateX(-Math.PI / 2);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        const zz = p.getZ(i);
        const e = 1 - (zz + 30) / 60;
        let y = Math.sin(x * 0.018 + seed) * 0.5 + 0.5 + Math.sin(x * 0.051 + seed * 3) * 0.25;
        y += rough * (Math.sin(x * 0.9 + seed) * 0.5 + Math.sin(x * 2.3) * 0.3 + Math.sin(x * 5.1 + seed) * 0.2);
        p.setY(i, base + y * amp * e);
      }
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color }));
      m.position.z = z;
      scene.add(m);
    }
    ridge(-150, -6, 13, 1.7, '#5d7a4f', 0.05);
    ridge(-95, -4, 6.5, 4.1, '#3f5e31', 0.09);
    ridge(-62, -3, 3.6, 2.4, '#3d5a2c', 0.12);

    // Wind animation for instanced meshes
    function patchWind(mat: THREE.Material, strength = 1) {
      (mat as THREE.MeshLambertMaterial).onBeforeCompile = (s) => {
        s.uniforms.uTime = windUniformsRef.current.uTime;
        s.vertexShader =
          'uniform float uTime;\n' +
          s.vertexShader.replace(
            '#include <project_vertex>',
            `
            vec4 mvPosition = vec4(transformed, 1.0);
            vec3 ip = vec3(0.);
            #ifdef USE_INSTANCING
              mvPosition = instanceMatrix * mvPosition;
              ip = instanceMatrix[3].xyz;
            #endif
            float hh = clamp(position.y, 0.0, 1.0);
            float gust = smoothstep(-0.2, 1.0, sin(uTime*0.45 + ip.x*0.22 - ip.z*0.15));
            float w = sin(uTime*1.3 + ip.x*0.9 + ip.z*0.6) * (0.25 + gust*0.75) + sin(uTime*2.7 + ip.x*2.1 + ip.z*1.3)*0.15;
            mvPosition.x += (w + gust*0.6) * hh * hh * ${(0.09 * strength).toFixed(3)};
            mvPosition.z += w * hh * hh * ${(0.03 * strength).toFixed(3)};
            mvPosition = modelViewMatrix * mvPosition;
            gl_Position = projectionMatrix * mvPosition;`
          );
      };
      return mat;
    }

    function bladeGeo(width: number, segs: number, curve: number) {
      const pos: number[] = [];
      const col: number[] = [];
      const nor: number[] = [];
      const idx: number[] = [];
      const baseColor = new THREE.Color('#1f3314');
      const tipColor = new THREE.Color('#93a95f');
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const w = width * Math.pow(1 - t, 0.9) + 0.0006;
        const bend = t * t * curve;
        pos.push(-w, t, bend, w, t, bend);
        const c = baseColor.clone().lerp(tipColor, Math.pow(t, 0.9));
        col.push(c.r, c.g, c.b, c.r, c.g, c.b);
        nor.push(-0.3, 1, 0.4, 0.3, 1, 0.4);
        if (i < segs) {
          const a = i * 2;
          idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx);
      return g;
    }

    const grassMat = patchWind(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));

    function scatterGrass(
      count: number,
      region: { x0?: number; x1?: number; z0: number; z1: number; hw?: (z: number) => number; pow?: number },
      hRange: [number, number],
      widthMul: number
    ) {
      const mesh = new THREE.InstancedMesh(bladeGeo(0.011 * widthMul, 5, 0.16), grassMat, count);
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const e = new THREE.Euler();
      const s = new THREE.Vector3();
      const pv = new THREE.Vector3();
      const c = new THREE.Color();
      for (let i = 0; i < count; i++) {
        const z = region.z0 + Math.pow(Math.random(), region.pow || 1) * (region.z1 - region.z0);
        const x = region.hw
          ? (Math.random() * 2 - 1) * region.hw(z)
          : (region.x0 ?? 0) + Math.random() * ((region.x1 ?? 0) - (region.x0 ?? 0));
        pv.set(x, heightAt(x, z) - 0.02, z);
        e.set((Math.random() - 0.5) * 0.35, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.35);
        q.setFromEuler(e);
        const patch = 0.5 + 0.5 * Math.sin(x * 0.8 + 1.3) * Math.cos(z * 0.9);
        s.set(1 + Math.random() * 0.6, hRange[0] + Math.random() * (hRange[1] - hRange[0]) * (0.7 + patch * 0.5), 1);
        m4.compose(pv, q, s);
        mesh.setMatrixAt(i, m4);
        c.setHSL(0.2 + Math.random() * 0.06 + patch * 0.015, 0.28 + Math.random() * 0.22, 0.55 + Math.random() * 0.2 - patch * 0.08);
        if (Math.random() < 0.06) c.setHSL(0.13 + Math.random() * 0.03, 0.35, 0.75);
        mesh.setColorAt(i, c);
      }
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    }

    const K = isMobile ? 0.35 : 1;
    const CAMZ = 7.4;
    const halfW = (z: number) =>
      Math.max(0.6, (CAMZ - z) * (Math.min(window.innerWidth, 1024) / 2) / 1400 * 1.35 + 0.35);

    if (!STACKED0) {
      scatterGrass(Math.round(70000 * K), { x0: -6.5, x1: 4.5, z0: -3.5, z1: 3.2 }, [0.22, 0.46], 1);
      scatterGrass(Math.round(50000 * K), { x0: -14, x1: 9, z0: -14, z1: -3.5 }, [0.25, 0.5], 1.5);
      scatterGrass(Math.round(26000 * K), { x0: -30, x1: 20, z0: -34, z1: -14 }, [0.3, 0.55], 2.6);
      // Near-camera grass to fill bottom edge on wide desktops
      scatterGrass(Math.round(8000 * K), { x0: -8, x1: 8, z0: 3.2, z1: 6.5 }, [0.18, 0.38], 0.9);
    } else {
      const S = Math.min(2, Math.max(0.9, window.innerWidth / 390));
      scatterGrass(Math.round(19000 * S), { hw: halfW, z0: -3.5, z1: 4.8 }, [0.22, 0.46], 1.1);
      scatterGrass(Math.round(11000 * S), { hw: halfW, z0: -14, z1: -3.5 }, [0.25, 0.5], 1.6);
      scatterGrass(Math.round(6000 * S), { hw: halfW, z0: -34, z1: -14 }, [0.3, 0.55], 2.8);
    }

    // Small wildflowers
    {
      const N = STACKED0 ? 70 : isMobile ? 90 : 220;
      const head = new THREE.IcosahedronGeometry(0.038, 1);
      head.scale(1, 0.7, 1);
      head.translate(0, 1, 0);
      const mesh = new THREE.InstancedMesh(head, patchWind(new THREE.MeshLambertMaterial({})), N);
      const pal = ['#f5f3ea', '#f5f3ea', '#efe3a6', '#c9bde6', '#f2f0f5'];
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const s = new THREE.Vector3();
      const pv = new THREE.Vector3();
      const c = new THREE.Color();
      for (let i = 0; i < N; i++) {
        const z = -6 + Math.random() * 9;
        const x = STACKED0 ? (Math.random() * 2 - 1) * halfW(z) : -7 + Math.random() * 11;
        const h = 0.3 + Math.random() * 0.18;
        pv.set(x, heightAt(x, z), z);
        s.setScalar(h);
        q.identity();
        m4.compose(pv, q, s);
        mesh.setMatrixAt(i, m4);
        c.set(pal[i % pal.length]);
        mesh.setColorAt(i, c);
      }
      scene.add(mesh);
    }

    // Helper for mesh creation
    function mesh(
      geo: THREE.BufferGeometry,
      mat: THREE.Material,
      parent: THREE.Object3D,
      pos: [number, number, number] = [0, 0, 0],
      rot: [number, number, number] = [0, 0, 0],
      scale: [number, number, number] = [1, 1, 1]
    ) {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(...pos);
      m.rotation.set(...rot);
      m.scale.set(...scale);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    }

    function canvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext('2d')!;
      draw(ctx, w, h);
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    }

    const woodTex = canvasTex(256, 1024, (ctx, w, h) => {
      ctx.fillStyle = '#6e5038';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 140; i++) {
        const X = Math.random() * w;
        const a = 0.04 + Math.random() * 0.12;
        const lw = 0.6 + Math.random() * 2.2;
        ctx.strokeStyle = Math.random() < 0.7 ? `rgba(40,25,14,${a})` : `rgba(190,150,110,${a * 0.8})`;
        ctx.lineWidth = lw;
        ctx.beginPath();
        for (let y = 0; y <= h; y += 16) {
          ctx.lineTo(X + Math.sin(y * 0.01 + i) * 4 + Math.sin(y * 0.05 + i * 2) * 1.2, y);
        }
        ctx.stroke();
      }
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(20,30,10,.35)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });

    const roughMetalTex = canvasTex(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#5a5a5a';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.08})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3);
      }
    });
    roughMetalTex.colorSpace = THREE.NoColorSpace;

    // THE MAILBOX
    const mailbox = new THREE.Group();
    mailboxRef.current = mailbox;
    {
      const paint = new THREE.MeshPhysicalMaterial({
        color: '#7d221d',
        metalness: 0.45,
        roughness: 0.34,
        roughnessMap: roughMetalTex,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.1,
      });
      const paintD = new THREE.MeshPhysicalMaterial({
        color: '#661a16',
        metalness: 0.5,
        roughness: 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.15,
      });
      const brass = new THREE.MeshPhysicalMaterial({
        color: '#d29a3a',
        metalness: 0.85,
        roughness: 0.36,
        clearcoat: 0.4,
      });
      const steel = new THREE.MeshStandardMaterial({ color: '#2a2c30', metalness: 0.8, roughness: 0.45 });
      const wood = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85 });

      redMatsRef.current = [paint, paintD];

      // Post + platform + braces
      mesh(new RoundedBoxGeometry(0.14, 1.28, 0.14, 3, 0.018), wood, mailbox, [0, 0.58, 0]);
      mesh(new RoundedBoxGeometry(0.4, 0.05, 0.84, 2, 0.012), wood, mailbox, [0, 1.235, 0]);
      mesh(new RoundedBoxGeometry(0.055, 0.34, 0.055, 2, 0.008), wood, mailbox, [0, 1.08, 0.1], [0.62, 0, 0]);
      mesh(new RoundedBoxGeometry(0.055, 0.34, 0.055, 2, 0.008), wood, mailbox, [0, 1.08, -0.1], [-0.62, 0, 0]);

      const W = 0.46;
      const H = 0.28;
      const L = 0.86;
      const box = new THREE.Group();
      box.position.y = 1.26;
      mailbox.add(box);

      const arch = (w: number, h: number) => {
        const s = new THREE.Shape();
        s.moveTo(-w / 2, 0);
        s.lineTo(w / 2, 0);
        s.lineTo(w / 2, h);
        s.absarc(0, h, w / 2, 0, Math.PI, false);
        s.lineTo(-w / 2, 0);
        return s;
      };

      const bodyG = new THREE.ExtrudeGeometry(arch(W - 0.06, H), {
        depth: L - 0.08,
        bevelEnabled: true,
        bevelSize: 0.03,
        bevelThickness: 0.04,
        bevelSegments: 8,
        curveSegments: 48,
      });
      bodyG.translate(0, 0.03, -(L - 0.08) / 2);
      mesh(bodyG, paint, box);

      // Rolled ribs
      [-0.26, 0.0, 0.26].forEach((z) => {
        const r = new THREE.ExtrudeGeometry(arch(W - 0.04, H), {
          depth: 0.012,
          bevelEnabled: true,
          bevelSize: 0.012,
          bevelThickness: 0.008,
          bevelSegments: 4,
          curveSegments: 48,
        });
        r.translate(0, 0.02, z);
        mesh(r, paintD, box);
      });

      // Door
      const door = new THREE.Group();
      door.position.set(0, 0.01, L / 2 - 0.02);
      box.add(door);

      const doorG = new THREE.ExtrudeGeometry(arch(W - 0.02, H - 0.005), {
        depth: 0.02,
        bevelEnabled: true,
        bevelSize: 0.012,
        bevelThickness: 0.01,
        bevelSegments: 5,
        curveSegments: 48,
      });
      doorG.translate(0, 0.012, 0);
      mesh(doorG, paintD, door);

      const inner = new THREE.Mesh(
        new THREE.ShapeGeometry(arch(W - 0.08, H - 0.02)),
        new THREE.MeshBasicMaterial({ color: '#140807' })
      );
      inner.position.set(0, 0.04, L / 2 - 0.035);
      box.add(inner);

      mesh(new THREE.TorusGeometry(0.03, 0.007, 10, 24, Math.PI), brass, door, [0, H + 0.12, 0.04], [0, 0, Math.PI]);
      mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 12), brass, door, [0, H + 0.14, 0.035], [Math.PI / 2, 0, 0]);

      // Name plate
      const plateTex = canvasTex(512, 192, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, w, h);
        g.addColorStop(0, '#f6d58a');
        g.addColorStop(0.45, '#e2ad45');
        g.addColorStop(1, '#b8842a');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect(4, 4, w - 8, h - 8, 26);
        ctx.fill();
        for (let i = 0; i < 200; i++) {
          ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.06})`;
          ctx.fillRect(0, Math.random() * h, w, 1);
        }
        ctx.strokeStyle = 'rgba(90,55,10,.55)';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(18, 18, w - 36, h - 36, 16);
        ctx.stroke();
        ctx.fillStyle = '#2b1c08';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '800 78px Inter, Arial, sans-serif';
        ctx.fillText('CS CLUB', w / 2, 84);
        ctx.font = '600 24px monospace';
        ctx.fillStyle = 'rgba(43,28,8,.8)';
        ctx.fillText('DROP BOX · NO. 2027', w / 2, 140);
      });
      const plateM = new THREE.MeshPhysicalMaterial({
        map: plateTex,
        metalness: 0.75,
        roughness: 0.32,
        clearcoat: 0.5,
      });
      mesh(new RoundedBoxGeometry(0.31, 0.125, 0.006, 2, 0.003), brass, box, [W / 2 + 0.003, 0.11, 0.06], [0, Math.PI / 2, 0]);
      mesh(new THREE.PlaneGeometry(0.3, 0.1125), plateM, box, [W / 2 + 0.0075, 0.11, 0.06], [0, Math.PI / 2, 0]);
      [[-0.138], [0.138]].forEach(([z]) =>
        mesh(new THREE.SphereGeometry(0.005, 8, 6), brass, box, [W / 2 + 0.008, 0.11, 0.06 + z])
      );

      // Flag
      const flag = new THREE.Group();
      flag.position.set(W / 2 + 0.03, 0.24, -0.33);
      box.add(flag);
      flagRef.current = flag;

      mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.03, 20), steel, flag, [0, 0, 0], [0, 0, Math.PI / 2]);
      mesh(new RoundedBoxGeometry(0.014, 0.03, 0.56, 1, 0.005), brass, flag, [0.004, 0, 0.27]);
      mesh(new RoundedBoxGeometry(0.016, 0.15, 0.2, 2, 0.006), brass, flag, [0.004, 0.06, 0.48]);

      // Hit box for tap targets
      if (STACKED0) {
        const hit = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 1.0), new THREE.MeshBasicMaterial({ visible: false }));
        hit.position.y = 1.0;
        mailbox.add(hit);
      }
    }

    mailbox.position.set(0, heightAt(0, 0) - 0.06, 0);
    mailbox.rotation.y = -1.05;
    scene.add(mailbox);

    // Contact shadow
    {
      const t = canvasTex(128, 128, (ctx) => {
        const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, 'rgba(0,0,0,.55)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 128, 128);
      });
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(0.9, 0.9),
        new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })
      );
      m.rotation.x = -Math.PI / 2;
      m.position.set(0, heightAt(0, 0) + 0.005, 0);
      scene.add(m);
    }

    // Hover glow
    const glowTex = canvasTex(256, 256, (ctx) => {
      const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, 'rgba(255,226,160,.9)');
      g.addColorStop(0.4, 'rgba(255,214,130,.35)');
      g.addColorStop(1, 'rgba(255,214,130,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
    });
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false })
    );
    glow.scale.set(2.6, 2.6, 1);
    glow.position.set(0, 1.4, -0.6);
    scene.add(glow);
    glowRef.current = glow;

    // Camera framing
    const MB_H = 1.72;
    let lastSize = '';
    const uiEl = document.getElementById('contact-ui');

    function resize() {
      if (!container) return;
      STACKED = stackedMQ?.matches ?? false;
      if (STACKED && slotRef?.current) {
        const w = document.documentElement.clientWidth;
        const h = uiEl?.offsetHeight ?? window.innerHeight;
        const r = slotRef.current.getBoundingClientRect();
        const top = r.top + window.scrollY;
        const bot = r.bottom + window.scrollY;
        const key = [w, h, Math.round(top), Math.round(bot)].join();
        if (key === lastSize) return;
        lastSize = key;
        container.style.height = h + 'px';
        renderer.setSize(w, h);
        camera.aspect = w / h;
        const basePx = bot - Math.min(30, r.height * 0.07);
        const mbPx = Math.max(160, Math.min(basePx - (top + 104), 380, w * 1.1));
        baseRef.current.D = 7.4;
        const f = mbPx * baseRef.current.D / MB_H;
        camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan((h / 2) / f));
        const t = (h / 2) / f;
        const horizonPx = basePx - 0.5 * mbPx;
        baseRef.current.sy = 1 - 2 * horizonPx / h;
        baseRef.current.camY = mailbox.position.y - ((1 - 2 * basePx / h) - baseRef.current.sy) * baseRef.current.D * t;
        baseRef.current.sx = 0.03;
        camera.updateProjectionMatrix();
        applyShift();
        return;
      }
      lastSize = '';
      container.style.height = '';
      const w = window.innerWidth;
      const h = Math.max(window.innerHeight, document.documentElement.clientHeight);
      renderer.setSize(w, h);
      camera.aspect = w / h;
      const a = camera.aspect;
      let fit: { fov: number; frac: number; horizon: number; base: number; ndcX: number };
      if (a < 0.9) fit = { fov: 40, frac: Math.min(0.36, 0.95 * a * 0.62), horizon: 0.74, base: 0.94, ndcX: 0.05 };
      else if (a < 1.25) fit = { fov: 32, frac: 0.38, horizon: 0.7, base: 0.9, ndcX: 0.42 };
      else fit = { fov: 30, frac: 0.44, horizon: 0.68, base: 0.89, ndcX: Math.min(0.5, 0.2 + (a - 1.25) * 0.6) };
      camera.fov = fit.fov;
      const t = Math.tan(THREE.MathUtils.degToRad(fit.fov / 2));
      baseRef.current.D = MB_H / (fit.frac * 2 * t);
      baseRef.current.sy = 1 - 2 * fit.horizon;
      const ndcBase = 1 - 2 * fit.base;
      baseRef.current.camY = mailbox.position.y - (ndcBase - baseRef.current.sy) * baseRef.current.D * t;
      baseRef.current.sx = fit.ndcX;
      camera.updateProjectionMatrix();
      applyShift();
    }

    function applyShift() {
      const e = camera.projectionMatrix.elements;
      e[8] = -baseRef.current.sx;
      e[9] = -baseRef.current.sy;
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    }

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    if (uiEl) observer.observe(uiEl);
    window.addEventListener('resize', resize);
    resize();
    camera.position.set(0, baseRef.current.camY, baseRef.current.D);

    // Interaction
    const ray = new THREE.Raycaster();

    function toCanvas(v: THREE.Vector3) {
      const p = v.clone().project(camera);
      return { x: (p.x * 0.5 + 0.5) * (renderer.domElement.clientWidth ?? 0), y: (-p.y * 0.5 + 0.5) * (renderer.domElement.clientHeight ?? 0) };
    }

    const overUI = (el: EventTarget | null) => el && (el as HTMLElement).closest && (el as HTMLElement).closest('[data-over-ui],a,button,input,textarea,[role="dialog"]');

    function setMouse(e: PointerEvent | MouseEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    }

    const onPointerMove = (e: PointerEvent) => {
      parallaxRef.current.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      if (overUI(e.target)) mouseRef.current.set(-9, -9);
      else setMouse(e);
    };

    const onPointerLeave = () => {
      mouseRef.current.set(-9, -9);
      parallaxRef.current.set(0, 0);
    };

    const onClick = (e: MouseEvent) => {
      if (overUI(e.target)) return;
      setMouse(e);
      ray.setFromCamera(mouseRef.current, camera);
      if (ray.intersectObject(mailbox, true).length) {
        onMailboxClick();
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('click', onClick);

    const setHover = (on: boolean) => {
      if (on === hoveringRef.current) return;
      hoveringRef.current = on;
      renderer.domElement.style.cursor = on ? 'pointer' : '';
    };

    // Animation loop
    const clock = new THREE.Clock();
    const T0 = 40;

    function tick() {
      if (!isVisibleRef.current) {
        animationIdRef.current = requestAnimationFrame(tick);
        return;
      }

      clock.getDelta();
      const t = clock.elapsedTime + T0;
      const tm = REDUCE_MOTION ? T0 : t;
      windUniformsRef.current.uTime.value = tm;
      if (skyUniformsRef.current) skyUniformsRef.current.uTime.value = tm;

      if (flagRef.current) {
        flagRef.current.rotation.x = -animRef.current.flag * Math.PI / 2;
      }
      if (mailboxRef.current) {
        const box = mailboxRef.current.children.find((c) => c instanceof THREE.Group);
        if (box) box.rotation.z = Math.sin(t * 30) * animRef.current.wobble * 0.03;
      }

      animRef.current.hoverScale += ((hoveringRef.current ? 1 : 0) - animRef.current.hoverScale) * 0.12;
      if (glowRef.current) {
        glowRef.current.material.opacity = animRef.current.hoverScale * 0.45;
      }
      redMatsRef.current.forEach((m) => {
        m.emissive.setRGB(0.5, 0.18, 0.06);
        m.emissiveIntensity = animRef.current.hoverScale * 0.07;
      });
      const hs = 1 + animRef.current.hoverScale * 0.025;
      mailbox.scale.setScalar(hs);

      const k = REDUCE_MOTION || STACKED ? 0 : 1;
      camera.position.x += (parallaxRef.current.x * 0.18 * k - camera.position.x) * 0.04;
      camera.position.y += (baseRef.current.camY + parallaxRef.current.y * 0.06 * k - camera.position.y) * 0.04;
      camera.position.z = baseRef.current.D;

      if (mouseRef.current.x > -2) {
        ray.setFromCamera(mouseRef.current, camera);
        setHover(ray.intersectObject(mailbox, true).length > 0);
      } else {
        setHover(false);
      }

      // Update hint position (throttled to avoid setState every frame)
      const top = toCanvas(mailbox.localToWorld(new THREE.Vector3(0, 1.85, 0)));
      const prev = hintPosRef.current;
      if (Math.abs(top.x - prev.x) > 1 || Math.abs(top.y - prev.y) > 1) {
        hintPosRef.current = { x: top.x, y: top.y };
        onHintPosition?.(top.x, top.y);
      }

      renderer.render(scene, camera);

      if (!firstFrameRef.current) {
        firstFrameRef.current = true;
        onFirstFrame?.();
      }

      animationIdRef.current = requestAnimationFrame(tick);
    }

    animationIdRef.current = requestAnimationFrame(tick);

    // Visibility handling
    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        isVisibleRef.current = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0 }
    );
    intersectionObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationIdRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      intersectionObserver.disconnect();
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('click', onClick);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      container.removeChild(renderer.domElement);
    };
  }, [heightAt, onMailboxClick, stacked, slotRef, onFirstFrame]);

  // Flag animation
  useEffect(() => {
    const targetFlag = flagUp ? 1 : 0;
    let raf = 0;
    const animate = () => {
      const diff = targetFlag - animRef.current.flag;
      if (Math.abs(diff) < 0.01) {
        animRef.current.flag = targetFlag;
        return;
      }
      animRef.current.flag += diff * 0.1;
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [flagUp]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

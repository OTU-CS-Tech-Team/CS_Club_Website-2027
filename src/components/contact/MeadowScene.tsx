'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type MeadowSceneProps = {
  onMailboxClick: () => void;
  flagUp: boolean;
};

const isMobileCheck = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches;
const isLowEnd = () => {
  if (typeof navigator === 'undefined') return false;
  const saveData = (navigator as { connection?: { saveData?: boolean } }).connection?.saveData;
  return saveData || navigator.hardwareConcurrency <= 4;
};
const hasWebGL2 = () => {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  return !!canvas.getContext('webgl2');
};

export default function MeadowScene({ onMailboxClick, flagUp }: MeadowSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number>(0);
  const mailboxRef = useRef<THREE.Group | null>(null);
  const flagRef = useRef<THREE.Group | null>(null);
  const redMatsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const clockRef = useRef<THREE.Clock | null>(null);
  const windUniformsRef = useRef({ uTime: { value: 0 } });
  const cloudsRef = useRef<THREE.Group[]>([]);
  const butterfliesRef = useRef<THREE.Group[]>([]);
  const isVisibleRef = useRef(true);
  const mouseRef = useRef(new THREE.Vector2(-9, -9));
  const parallaxRef = useRef(new THREE.Vector2(0, 0));
  const baseCamRef = useRef(new THREE.Vector3());
  const lookTargetRef = useRef(new THREE.Vector3());
  const hoveringRef = useRef(false);
  const animRef = useRef({ hoverScale: 0, flag: 0 });

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const heightAt = useCallback((x: number, z: number) => {
    let h =
      0.3 * Math.sin(x * 0.18 + 0.4) * Math.cos(z * 0.16) +
      0.2 * Math.sin(x * 0.41 + z * 0.23 + 1.3) +
      0.08 * Math.sin(x * 0.9 - z * 0.7);
    h += 0.9 * Math.exp(-((x - 0.4) ** 2 + (z + 0.3) ** 2) / 30);
    h -= 0.014 * Math.max(0, z) ** 2;
    h -= 0.01 * Math.max(0, -z - 6) ** 1.2;
    return h;
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!hasWebGL2() || isLowEnd()) {
      return;
    }

    const isMobile = isMobileCheck();
    const reduceMotionActive = reduceMotion;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const HORIZON = new THREE.Color('#d3ebfb');
    scene.fog = new THREE.Fog(HORIZON, 24, 80);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
    cameraRef.current = camera;

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(200, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color('#2a78d2') },
          mid: { value: new THREE.Color('#6fb2ee') },
          bottom: { value: HORIZON },
          sunDir: { value: new THREE.Vector3(0.55, 0.42, -0.72).normalize() },
        },
        vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader: `uniform vec3 top,mid,bottom,sunDir; varying vec3 vDir;
          void main(){ float h = vDir.y; vec3 c = mix(bottom, mid, smoothstep(0.0,0.14,h)); c = mix(c, top, smoothstep(0.14,0.6,h));
            float s = max(dot(vDir, sunDir),0.); c += vec3(1.,.93,.75)*pow(s,40.)*.6 + vec3(1.,.95,.85)*pow(s,5.)*.12;
            gl_FragColor = vec4(c,1.);
            #include <colorspace_fragment>
          }`,
      })
    );
    scene.add(sky);

    scene.add(new THREE.HemisphereLight('#d6ecff', '#5e8f3c', 1.35));
    const sun = new THREE.DirectionalLight('#fff0d4', 2.4);
    sun.position.set(5, 10, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 30 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    sun.shadow.radius = 5;
    scene.add(sun);

    const rim = new THREE.DirectionalLight('#ffd6e6', 0.6);
    rim.position.set(-6, 4, -4);
    scene.add(rim);

    const terrainGeo = new THREE.PlaneGeometry(110, 80, 200, 150);
    terrainGeo.rotateX(-Math.PI / 2);
    terrainGeo.translate(0, 0, -24);
    const terrainPos = terrainGeo.attributes.position;
    const terrainCol: number[] = [];
    const terrainColor = new THREE.Color();
    for (let i = 0; i < terrainPos.count; i++) {
      const x = terrainPos.getX(i);
      const z = terrainPos.getZ(i);
      const y = heightAt(x, z);
      terrainPos.setY(i, y);
      const n = Math.sin(x * 1.7) * Math.cos(z * 1.3) * 0.5 + Math.sin(x * 0.37 + z * 0.51) * 0.5;
      terrainColor.setHSL(0.26 + n * 0.02, 0.5, 0.33 + y * 0.04 + n * 0.03);
      terrainCol.push(terrainColor.r, terrainColor.g, terrainColor.b);
    }
    terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(terrainCol, 3));
    terrainGeo.computeVertexNormals();
    const ground = new THREE.Mesh(terrainGeo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    ground.receiveShadow = true;
    scene.add(ground);

    const hillLayer = (z: number, amp: number, color: string, seed: number, base: number) => {
      const g = new THREE.PlaneGeometry(320, 40, 160, 8);
      g.rotateX(-Math.PI / 2);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i);
        const zz = p.getZ(i);
        const edge = (zz + 20) / 40;
        p.setY(
          i,
          (Math.sin(x * 0.04 + seed) * 0.5 + 0.5 + Math.sin(x * 0.11 + seed * 2) * 0.3) *
            amp *
            (1 - edge) +
            base
        );
      }
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color }));
      m.position.z = z;
      scene.add(m);
    };
    hillLayer(-110, 9, '#b4d3c4', 1.0, -3);
    hillLayer(-80, 5.5, '#93c27f', 3.2, -3);

    const toon = (color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0, ...extra });

    const mesh = (
      geo: THREE.BufferGeometry,
      mat: THREE.Material,
      parent: THREE.Object3D,
      pos: [number, number, number] = [0, 0, 0],
      rot: [number, number, number] = [0, 0, 0],
      scale: [number, number, number] = [1, 1, 1]
    ) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(...pos);
      m.rotation.set(...rot);
      m.scale.set(...scale);
      m.castShadow = true;
      m.receiveShadow = true;
      parent.add(m);
      return m;
    };

    const tree = (x: number, z: number, s = 1) => {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 1.2 * s, 7),
        new THREE.MeshLambertMaterial({ color: '#7a5236' })
      );
      trunk.position.y = 0.6 * s;
      g.add(trunk);
      const leafMat = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(0.26 + Math.random() * 0.05, 0.5, 0.32 + Math.random() * 0.06),
      });
      (
        [
          [0, 1.6, 0, 0.85],
          [0.5, 1.3, 0.1, 0.62],
          [-0.45, 1.35, -0.1, 0.64],
          [0, 2.15, 0, 0.6],
          [0.2, 1.5, 0.45, 0.55],
        ] as [number, number, number, number][]
      ).forEach(([a, b, c, r]) => {
        const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r * s, 2), leafMat);
        m.position.set(a * s, b * s, c * s);
        m.castShadow = true;
        g.add(m);
      });
      g.position.set(x, heightAt(x, z) - 0.05, z);
      scene.add(g);
    };

    (
      [
        [-7.5, -12, 1.0],
        [-10.5, -15, 1.25],
        [-14, -13, 0.9],
        [9, -14, 1.1],
        [12.5, -17, 1.35],
        [16, -14, 0.9],
        [-19, -22, 1.4],
        [21, -24, 1.3],
        [-4, -30, 0.9],
        [6, -34, 0.8],
      ] as [number, number, number][]
    ).forEach((a) => tree(...a));

    const cloudMat = new THREE.MeshLambertMaterial({
      color: '#ffffff',
      emissive: '#cfe0f2',
      emissiveIntensity: 0.42,
      fog: false,
    });
    const cloud = (x: number, y: number, z: number, s: number) => {
      const g = new THREE.Group();
      const puffs = 6 + Math.floor(Math.random() * 3);
      for (let i = 0; i < puffs; i++) {
        const r = (0.75 + Math.random() * 0.6) * s * (1 - (Math.abs(i - (puffs - 1) / 2) / puffs) * 0.9);
        const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), cloudMat);
        m.position.set(
          (i - (puffs - 1) / 2) * 0.72 * s,
          r * 0.35 + Math.random() * 0.2 * s,
          Math.random() * 0.5 * s
        );
        g.add(m);
      }
      const base = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), cloudMat);
      base.scale.set(puffs * 0.42 * s, 0.35 * s, 0.7 * s);
      g.add(base);
      g.position.set(x, y, z);
      g.userData.speed = 0.12 + Math.random() * 0.18;
      scene.add(g);
      cloudsRef.current.push(g);
    };

    cloud(-13, 8.5, -40, 1.7);
    cloud(4, 13.5, -66, 2.3);
    cloud(17, 7.5, -42, 1.5);
    cloud(-30, 12, -62, 2.6);
    cloud(32, 12.5, -64, 2.2);
    cloud(-3, 6.5, -34, 0.9);
    cloud(11, 15, -70, 2.6);
    cloud(-22, 6, -45, 1.2);

    const patchWind = (mat: THREE.Material, strength = 1, fixedH = false) => {
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
          float hh = ${fixedH ? '1.0' : 'clamp(position.y, 0.0, 1.0)'};
          float gust = sin(uTime*0.7 + ip.x*0.12 - ip.z*0.05)*0.5+0.5;
          float w = sin(uTime*1.9 + ip.x*0.6 + ip.z*0.4) * (0.35 + gust*0.65) + sin(uTime*3.3 + ip.x*1.7)*0.12;
          mvPosition.x += w * hh * hh * ${(0.2 * strength).toFixed(3)};
          mvPosition.z += w * hh * hh * ${(0.07 * strength).toFixed(3)};
          mvPosition = modelViewMatrix * mvPosition;
          gl_Position = projectionMatrix * mvPosition;`
          );
      };
      return mat;
    };

    {
      const segs = 4;
      const pos: number[] = [];
      const col: number[] = [];
      const nor: number[] = [];
      const idx: number[] = [];
      for (let i = 0; i <= segs; i++) {
        const t = i / segs;
        const w = 0.045 * (1 - t) ** 0.8 + 0.002;
        const bend = t * t * 0.15;
        pos.push(-w, t, bend, w, t, bend);
        const c = new THREE.Color('#2c5f22').lerp(new THREE.Color('#b5dd62'), t ** 1.1);
        col.push(c.r, c.g, c.b, c.r, c.g, c.b);
        nor.push(0, 1, 0.25, 0, 1, 0.25);
        if (i < segs) {
          const a = i * 2;
          idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      bg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      bg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      bg.setIndex(idx);
      const COUNT = isMobile ? 15000 : 60000;
      const grassMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
      patchWind(grassMat);
      const grass = new THREE.InstancedMesh(bg, grassMat, COUNT);
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const e = new THREE.Euler();
      const s = new THREE.Vector3();
      const p = new THREE.Vector3();
      const c = new THREE.Color();
      let i = 0;
      while (i < COUNT) {
        const far = Math.random() > 0.62;
        const r = Math.sqrt(Math.random()) * (far ? 18 : 6.5);
        const a = Math.random() * Math.PI * 2;
        const x = 0.3 + Math.cos(a) * r * 1.6;
        const z = -1.0 + Math.sin(a) * r * 0.9;
        if (z > 5.2) continue;
        p.set(x, heightAt(x, z) - 0.02, z);
        e.set((Math.random() - 0.5) * 0.3, Math.random() * Math.PI, (Math.random() - 0.5) * 0.3);
        q.setFromEuler(e);
        s.set(1 + Math.random() * 0.7, (0.14 + Math.random() * 0.2 + (far ? 0.12 : 0)) * 0.9, 1);
        m4.compose(p, q, s);
        grass.setMatrixAt(i, m4);
        c.setHSL(0.22 + Math.random() * 0.07, 0.45 + Math.random() * 0.25, 0.5 + Math.random() * 0.16);
        grass.setColorAt(i, c);
        i++;
      }
      grass.receiveShadow = true;
      scene.add(grass);
    }

    {
      const petal = new THREE.SphereGeometry(0.04, 7, 4);
      petal.scale(1, 0.32, 0.62);
      const parts: THREE.BufferGeometry[] = [];
      for (let k = 0; k < 5; k++) {
        const g = petal.clone();
        g.translate(0.045, 0, 0);
        g.rotateY((k * Math.PI * 2) / 5);
        parts.push(g);
      }
      const head = mergeGeometries(parts);
      head.rotateX(0.35);
      const center = new THREE.SphereGeometry(0.026, 6, 4);
      center.scale(1, 0.7, 1);
      center.translate(0, 0.008, 0);
      const stem = new THREE.CylinderGeometry(0.007, 0.009, 1, 4);
      stem.translate(0, 0.5, 0);
      const N = isMobile ? 300 : 800;
      const headMat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
      patchWind(headMat, 0.6, true);
      const headMesh = new THREE.InstancedMesh(head, headMat, N);
      const centerMat = new THREE.MeshLambertMaterial({
        color: '#f4b942',
        emissive: '#6b4a00',
        emissiveIntensity: 0.25,
      });
      patchWind(centerMat, 0.6, true);
      const centerMesh = new THREE.InstancedMesh(center, centerMat, N);
      const stemMat = new THREE.MeshLambertMaterial({ color: '#4d8a35' });
      patchWind(stemMat, 0.6);
      const stemMesh = new THREE.InstancedMesh(stem, stemMat, N);
      const palette = [
        '#ffffff',
        '#ffffff',
        '#fff3a0',
        '#ffb3c7',
        '#cdb8ff',
        '#ffd27a',
        '#ff8fa3',
        '#ffffff',
        '#aee3ff',
      ];
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const s = new THREE.Vector3();
      const p = new THREE.Vector3();
      const c = new THREE.Color();
      const one = new THREE.Vector3();
      let i = 0;
      while (i < N) {
        const r = Math.sqrt(Math.random()) * (i < N * 0.55 ? 5.5 : 15);
        const a = Math.random() * Math.PI * 2;
        const x = 0.3 + Math.cos(a) * r * 1.6;
        const z = -1.0 + Math.sin(a) * r * 0.8;
        if (z > 5) continue;
        p.set(x, heightAt(x, z), z);
        q.setFromEuler(
          new THREE.Euler(
            (Math.random() - 0.5) * 0.25,
            Math.random() * 6,
            (Math.random() - 0.5) * 0.25
          )
        );
        const h = 0.26 + Math.random() * 0.26;
        const sc = 0.85 + Math.random() * 0.7;
        s.set(1, h, 1);
        m4.compose(p, q, s);
        stemMesh.setMatrixAt(i, m4);
        const top = new THREE.Vector3(0, h, 0).applyQuaternion(q).add(p);
        one.setScalar(sc);
        m4.compose(top, q, one);
        headMesh.setMatrixAt(i, m4);
        centerMesh.setMatrixAt(i, m4);
        c.set(palette[i % palette.length]);
        headMesh.setColorAt(i, c);
        i++;
      }
      [headMesh, centerMesh, stemMesh].forEach((m) => {
        m.receiveShadow = true;
        scene.add(m);
      });
    }

    const mailbox = new THREE.Group();
    mailboxRef.current = mailbox;
    const redMats: THREE.MeshStandardMaterial[] = [];

    {
      const red = toon('#e5503d', { roughness: 0.4 });
      const redD = toon('#c4402f', { roughness: 0.45 });
      const wood = toon('#a3704a');
      const woodD = toon('#7b5133');
      const gold = toon('#f4b942', { roughness: 0.3, metalness: 0.3 });
      const dark = new THREE.MeshBasicMaterial({ color: '#2a1714' });

      redMats.push(red, redD);
      redMatsRef.current = redMats;

      mesh(new THREE.BoxGeometry(0.15, 1.2, 0.15), wood, mailbox, [0, 0.6, 0]);
      mesh(new THREE.BoxGeometry(0.4, 0.06, 0.95), woodD, mailbox, [0, 1.2, 0]);
      mesh(new THREE.BoxGeometry(0.07, 0.42, 0.07), woodD, mailbox, [0, 1.0, 0.18], [0.8, 0, 0]);

      (
        [
          [0.2, 0.12],
          [-0.18, -0.08],
          [0.04, -0.22],
          [-0.1, 0.2],
        ] as [number, number][]
      ).forEach(([x, z], i) =>
        mesh(
          new THREE.DodecahedronGeometry(0.06 + i * 0.01, 1),
          toon('#c3beb4'),
          mailbox,
          [x, 0.02, z],
          [i, i * 2, 0],
          [1, 0.6, 1]
        )
      );

      for (let i = 0; i < 6; i++) {
        const a = i * 1.3;
        mesh(
          new THREE.SphereGeometry(0.035, 8, 6),
          toon('#4f9a3a'),
          mailbox,
          [Math.cos(a) * 0.09, 0.15 + i * 0.13, Math.sin(a) * 0.09],
          [0, a, 0],
          [1, 0.5, 1.6]
        );
      }

      (
        [
          [0.09, 0.45, 0.05, '#ffffff'],
          [-0.08, 0.72, 0.06, '#ffb3c7'],
          [0.06, 0.9, -0.08, '#fff3a0'],
        ] as [number, number, number, string][]
      ).forEach(([x, y, z, c]) =>
        mesh(new THREE.SphereGeometry(0.035, 10, 8), toon(c), mailbox, [x, y, z])
      );

      const W = 0.5;
      const H = 0.34;
      const L = 0.9;
      const box = new THREE.Group();
      box.position.y = 1.23;
      mailbox.add(box);

      mesh(new THREE.BoxGeometry(W, H, L - 0.02), red, box, [0, H / 2, -0.01]);
      mesh(
        new THREE.CylinderGeometry(W / 2, W / 2, L - 0.02, 40, 1, false, 0, Math.PI),
        red,
        box,
        [0, H, -0.01],
        [Math.PI / 2, Math.PI / 2, 0]
      );

      [-0.32, 0.32].forEach((z) => {
        mesh(new THREE.BoxGeometry(W + 0.02, H, 0.03), redD, box, [0, H / 2, z]);
        mesh(
          new THREE.CylinderGeometry(W / 2 + 0.01, W / 2 + 0.01, 0.03, 40, 1, false, 0, Math.PI),
          redD,
          box,
          [0, H, z],
          [Math.PI / 2, Math.PI / 2, 0]
        );
      });

      mesh(new THREE.BoxGeometry(W + 0.01, 0.03, L), redD, box, [0, 0.015, 0]);

      const shape = new THREE.Shape();
      shape.moveTo(-W / 2, 0);
      shape.lineTo(W / 2, 0);
      shape.lineTo(W / 2, H);
      shape.absarc(0, H, W / 2, 0, Math.PI, false);
      shape.lineTo(-W / 2, 0);

      const inner = new THREE.Mesh(new THREE.ShapeGeometry(shape), dark);
      inner.position.set(0, 0.015, L / 2 - 0.004);
      inner.scale.set(0.92, 0.92, 1);
      box.add(inner);

      const door = new THREE.Group();
      door.position.set(0, 0, L / 2 - 0.01);
      box.add(door);

      mesh(
        new THREE.ExtrudeGeometry(shape, {
          depth: 0.03,
          bevelEnabled: true,
          bevelSize: 0.014,
          bevelThickness: 0.012,
          bevelSegments: 3,
          curveSegments: 28,
        }),
        redD,
        door
      );
      mesh(new THREE.SphereGeometry(0.035, 16, 12), gold, door, [0, H + 0.13, 0.06]);

      const hs = new THREE.Shape();
      hs.moveTo(0, -0.05);
      hs.bezierCurveTo(-0.09, 0.0, -0.05, 0.07, 0, 0.035);
      hs.bezierCurveTo(0.05, 0.07, 0.09, 0.0, 0, -0.05);
      mesh(
        new THREE.ExtrudeGeometry(hs, { depth: 0.01, bevelEnabled: false }),
        toon('#fff3e0'),
        door,
        [0, H - 0.04, 0.045]
      );

      const cv = document.createElement('canvas');
      cv.width = 512;
      cv.height = 256;
      const x = cv.getContext('2d')!;
      x.fillStyle = '#fff8e8';
      x.beginPath();
      x.roundRect(12, 34, 488, 188, 36);
      x.fill();
      x.strokeStyle = '#f4b942';
      x.lineWidth = 14;
      x.stroke();
      x.fillStyle = '#1d1d1f';
      x.font = '800 116px Inter, Arial, sans-serif';
      x.textAlign = 'center';
      x.textBaseline = 'middle';
      x.fillText('CS CLUB', 256, 114);
      x.font = '700 30px monospace';
      x.fillStyle = '#c4402f';
      x.fillText('DROP BOX · NO. 2027', 256, 184);
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      mesh(
        new THREE.PlaneGeometry(0.52, 0.26),
        new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, transparent: true }),
        box,
        [W / 2 + 0.017, 0.2, -0.04],
        [0, Math.PI / 2, 0]
      );

      const flag = new THREE.Group();
      flag.position.set(-W / 2 - 0.04, 0.17, -0.36);
      box.add(flag);
      flagRef.current = flag;

      mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16), gold, flag, [0, 0, 0], [0, 0, Math.PI / 2]);
      mesh(new THREE.BoxGeometry(0.026, 0.04, 0.78), gold, flag, [-0.008, 0, 0.37]);
      mesh(
        new THREE.BoxGeometry(0.03, 0.22, 0.26),
        toon('#f4b942', { roughness: 0.35, emissive: new THREE.Color('#7a4a00'), emissiveIntensity: 0.25 }),
        flag,
        [-0.01, 0.09, 0.66]
      );
    }

    const MB_POS = new THREE.Vector3(1.4, 0, -0.1);
    mailbox.position.set(MB_POS.x, heightAt(MB_POS.x, MB_POS.z) - 0.05, MB_POS.z);
    mailbox.rotation.y = -1.15;
    scene.add(mailbox);

    for (let i = 0; i < 3; i++) {
      const b = new THREE.Group();
      const col = ['#ffd27a', '#ffffff', '#cdb8ff'][i];
      const wingG = new THREE.CircleGeometry(0.065, 14);
      wingG.scale(1, 1.35, 1);
      wingG.translate(0.06, 0.02, 0);
      const wm = new THREE.MeshLambertMaterial({ color: col, side: THREE.DoubleSide });
      const wl = new THREE.Group();
      const wr = new THREE.Group();
      wl.add(new THREE.Mesh(wingG, wm));
      const rm = new THREE.Mesh(wingG, wm);
      rm.scale.x = -1;
      wr.add(rm);
      b.add(wl, wr);
      const bd = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.01, 0.06, 8, 16),
        new THREE.MeshLambertMaterial({ color: '#333' })
      );
      bd.rotation.x = Math.PI / 2;
      b.add(bd);
      wl.rotation.x = wr.rotation.x = -Math.PI / 2;
      b.userData = {
        wl,
        wr,
        seed: i * 2.1,
        cx: [-1.8, 2.5, 0.4][i],
        cz: [0.9, 0.7, -1.6][i],
      };
      scene.add(b);
      butterfliesRef.current.push(b);
    }

    const clock = new THREE.Clock();
    clockRef.current = clock;

    const ray = new THREE.Raycaster();

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      if (camera.aspect < 0.9) {
        camera.fov = 38;
        baseCamRef.current.set(1.0, 2.5, 8.6 + (0.9 - camera.aspect) * 4);
        lookTargetRef.current.set(1.35, 1.75, 0);
      } else {
        camera.fov = 26;
        const shift = Math.min(1.6, Math.max(0, (camera.aspect - 1.1) * 1.0));
        baseCamRef.current.set(0.8 - shift, 2.0, 7.8);
        lookTargetRef.current.set(1.05 - shift, 1.4, 0);
      }
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    camera.position.copy(baseCamRef.current);

    const setHover = (on: boolean) => {
      if (on === hoveringRef.current) return;
      hoveringRef.current = on;
      renderer.domElement.style.cursor = on ? 'pointer' : '';
      redMats.forEach((m) => {
        m.emissive.set(on ? '#ff7a4a' : '#000000');
        m.emissiveIntensity = on ? 0.3 : 0;
      });
    };

    const onPointerMove = (e: PointerEvent) => {
      const r = container.getBoundingClientRect();
      mouseRef.current.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1
      );
      parallaxRef.current.copy(mouseRef.current);
    };

    const onPointerLeave = () => {
      mouseRef.current.set(-9, -9);
      parallaxRef.current.set(0, 0);
    };

    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('button,a')) return;
      const r = container.getBoundingClientRect();
      mouseRef.current.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        -((e.clientY - r.top) / r.height) * 2 + 1
      );
      ray.setFromCamera(mouseRef.current, camera);
      if (ray.intersectObject(mailbox, true).length) {
        onMailboxClick();
      }
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);
    container.addEventListener('click', onClick);

    const tick = () => {
      if (!isVisibleRef.current) {
        animationIdRef.current = requestAnimationFrame(tick);
        return;
      }

      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;
      windUniformsRef.current.uTime.value = reduceMotionActive ? 0 : t;

      if (!reduceMotionActive) {
        cloudsRef.current.forEach((c) => {
          c.position.x += c.userData.speed * dt;
          if (c.position.x > 60) c.position.x = -60;
        });
        butterfliesRef.current.forEach((b) => {
          const u = b.userData;
          const s = t * 0.45 + u.seed;
          b.position.set(
            u.cx + Math.sin(s) * 1.1,
            heightAt(u.cx, u.cz) + 0.75 + Math.sin(s * 2.3) * 0.25,
            u.cz + Math.cos(s * 0.8) * 0.7
          );
          b.rotation.y = -s;
          const f = Math.sin(t * 16 + u.seed) * 0.9;
          u.wl.rotation.y = f;
          u.wr.rotation.y = -f;
        });
      }

      if (flagRef.current) {
        flagRef.current.rotation.x = -animRef.current.flag * (Math.PI / 2);
      }

      animRef.current.hoverScale += ((hoveringRef.current ? 1 : 0) - animRef.current.hoverScale) * 0.15;
      const hs =
        1 +
        animRef.current.hoverScale * 0.04 +
        (hoveringRef.current && !reduceMotionActive ? Math.sin(t * 6) * 0.01 : 0);
      mailbox.scale.set(hs, hs, hs);

      const k = reduceMotionActive ? 0 : 1;
      camera.position.x +=
        (baseCamRef.current.x + parallaxRef.current.x * 0.5 * k - camera.position.x) * 0.05;
      camera.position.y +=
        (baseCamRef.current.y + parallaxRef.current.y * 0.25 * k - camera.position.y) * 0.05;
      camera.position.z = baseCamRef.current.z;
      camera.lookAt(lookTargetRef.current);

      if (mouseRef.current.x > -2) {
        ray.setFromCamera(mouseRef.current, camera);
        setHover(ray.intersectObject(mailbox, true).length > 0);
      } else {
        setHover(false);
      }

      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(tick);
    };

    animationIdRef.current = requestAnimationFrame(tick);

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

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      intersectionObserver.disconnect();
      observer.disconnect();
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      container.removeEventListener('click', onClick);

      renderer.dispose();
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
      container.removeChild(renderer.domElement);
    };
  }, [heightAt, onMailboxClick, reduceMotion]);

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

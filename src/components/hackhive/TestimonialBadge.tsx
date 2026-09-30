'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import styles from './testimonialBadge.module.css';

type Portrait = { src: string; alt: string; position?: string };
type TestimonialOption = { names: string; portraits: Portrait[] };

type TestimonialBadgeProps = {
  options: TestimonialOption[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

function roundedShape(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

export default function TestimonialBadge({ options, selectedIndex, onSelect }: TestimonialBadgeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-2.2, 2.2, 2.65, -2.65, 0.1, 20);
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 2.1));
    const light = new THREE.DirectionalLight(0xffffff, 2.2);
    light.position.set(-2, 4, 6);
    scene.add(light);

    const strap = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.18, 1.65, -0.1),
        new THREE.Vector3(-0.53, 2.35, -0.1),
        new THREE.Vector3(0.08, 2.52, -0.1),
        new THREE.Vector3(0.53, 2.3, -0.1),
        new THREE.Vector3(0.32, 1.66, -0.1),
      ]), 48, 0.055, 8, false),
      new THREE.MeshStandardMaterial({ color: 0x282435, roughness: 0.9 }),
    );
    scene.add(strap);

    const card = new THREE.Mesh(
      new THREE.ExtrudeGeometry(roundedShape(3.5, 4.1, 0.22), {
        depth: 0.12,
        bevelEnabled: true,
        bevelThickness: 0.035,
        bevelSize: 0.035,
        bevelSegments: 3,
        curveSegments: 16,
      }),
      new THREE.MeshStandardMaterial({ color: 0xe6e1f2, roughness: 0.82, metalness: 0.02 }),
    );
    card.position.y = -0.2;
    scene.add(card);

    const face = new THREE.Mesh(
      new THREE.ShapeGeometry(roundedShape(3.36, 3.96, 0.17), 16),
      new THREE.MeshStandardMaterial({ color: 0xfcfbff, roughness: 1 }),
    );
    face.position.set(0, -0.2, 0.17);
    scene.add(face);

    const clip = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.22, 0.13),
      new THREE.MeshStandardMaterial({ color: 0x6a3df5, roughness: 0.55 }),
    );
    clip.position.set(0.07, 1.82, 0.23);
    scene.add(clip);

    const resize = () => {
      const width = root.clientWidth;
      const height = root.clientHeight;
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height, false);
      camera.left = -2.2;
      camera.right = 2.2;
      camera.top = 2.2 * height / width;
      camera.bottom = -camera.top;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      root.dataset.ready = 'true';
    };

    const observer = new ResizeObserver(resize);
    observer.observe(root);
    resize();

    return () => {
      observer.disconnect();
      root.removeAttribute('data-ready');
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else object.material.dispose();
        }
      });
      renderer.dispose();
    };
  }, []);

  const selected = options[selectedIndex];

  return (
    <div ref={rootRef} className={styles.badge}>
      <div className={styles.fallback} aria-hidden="true" />
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.face}>
        <div className={`${styles.portraits} ${selected.portraits.length > 1 ? styles.portraitsPair : ''}`}>
          {selected.portraits.map((portrait) => (
            <div className={styles.portrait} key={portrait.alt}>
              <Image src={portrait.src} alt={portrait.alt} fill sizes="(max-width: 620px) 120px, 160px" style={portrait.position ? { objectPosition: portrait.position } : undefined} />
            </div>
          ))}
        </div>
        <div className={styles.names} role="group" aria-label="Choose a testimonial">
          {options.map((option, index) => (
            <button
              key={option.names}
              type="button"
              className={`${styles.nameButton} ${selectedIndex === index ? styles.nameButtonActive : ''}`}
              aria-pressed={selectedIndex === index}
              onClick={() => onSelect(index)}
            >
              {option.names}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

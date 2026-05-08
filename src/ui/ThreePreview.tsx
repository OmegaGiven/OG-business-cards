import { useEffect, useRef } from "react";
import * as THREE from "three";
import { CARD_SIZES, Design, getElementSize } from "../shared/design";

export function ThreePreview({ design }: { design: Design }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const width = host.clientWidth || 420;
    const height = host.clientHeight || 260;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f4f0e6");
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, -120, 100);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    host.replaceChildren(renderer.domElement);

    const light = new THREE.DirectionalLight("#ffffff", 2.2);
    light.position.set(40, -80, 120);
    scene.add(light);
    scene.add(new THREE.AmbientLight("#ffffff", 1.2));

    const size = CARD_SIZES[design.cardSize];
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(size.widthMm, size.heightMm, design.thicknessMm),
      new THREE.MeshStandardMaterial({ color: design.sides.front.backgroundColor, roughness: 0.62 }),
    );
    scene.add(base);

    for (const element of design.sides.front.elements) {
      const elementSize = getElementSize(element);
      const material = new THREE.MeshStandardMaterial({
        color: element.mode === "cut" ? "#ffffff" : element.color,
        roughness: 0.55,
      });
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(elementSize.widthMm, elementSize.heightMm, element.mode === "cut" ? 0.12 : element.depthMm),
        material,
      );
      mesh.position.set(
        element.xMm - size.widthMm / 2 + elementSize.widthMm / 2,
        size.heightMm / 2 - element.yMm - elementSize.heightMm / 2,
        design.thicknessMm / 2 + (element.mode === "cut" ? 0.08 : element.depthMm / 2),
      );
      mesh.rotation.z = THREE.MathUtils.degToRad(-element.rotationDeg);
      scene.add(mesh);
    }

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      scene.rotation.z += 0.002;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      renderer.dispose();
    };
  }, [design]);

  return <div className="preview-3d" ref={hostRef} aria-label="3D card preview" />;
}

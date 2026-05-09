import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createCardBaseGeometry, createRaisedElementGeometries } from "../lib/geometry3d";
import { Design, getCardSize } from "../shared/design";

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

    const cardSize = getCardSize(design);
    const maxDimension = Math.max(cardSize.widthMm, cardSize.heightMm);
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(0, -maxDimension * 1.2, maxDimension * 0.95);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    host.replaceChildren(renderer.domElement);

    const light = new THREE.DirectionalLight("#ffffff", 2.2);
    light.position.set(maxDimension * 0.5, -maxDimension, maxDimension);
    scene.add(light);
    scene.add(new THREE.AmbientLight("#ffffff", 1.2));

    const model = new THREE.Group();
    scene.add(model);

    const base = new THREE.Mesh(
      createCardBaseGeometry(design),
      new THREE.MeshStandardMaterial({ color: design.side.backgroundColor, roughness: 0.62, side: THREE.DoubleSide }),
    );
    model.add(base);

    const voidPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(cardSize.widthMm, cardSize.heightMm),
      new THREE.MeshBasicMaterial({ color: "#1f2528", side: THREE.DoubleSide }),
    );
    voidPlane.position.z = -design.thicknessMm / 2 - 0.04;
    model.add(voidPlane);

    for (const item of createRaisedElementGeometries(design)) {
      model.add(
        new THREE.Mesh(
          item.geometry,
          new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.55, side: THREE.DoubleSide }),
        ),
      );
    }

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      model.rotation.z += 0.006;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          for (const material of materials) {
            material.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, [design]);

  return <div className="preview-3d" ref={hostRef} aria-label="3D card preview" />;
}

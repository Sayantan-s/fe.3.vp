import { PlaneGeometry, type Mesh, type ShaderMaterial } from "three";
import type { VideoAppearance } from "../types";

export interface MeshEntry {
  mesh: Mesh;
  zIndex: number;
  aspectRatio?: number;
}

function coverFit(containerW: number, containerH: number, ar: number) {
  const containerAR = containerW / containerH;
  if (containerAR > ar) {
    return { w: containerW, h: containerW / ar };
  }
  return { w: containerH * ar, h: containerH };
}

function containFit(containerW: number, containerH: number, ar: number) {
  const containerAR = containerW / containerH;
  if (containerAR > ar) {
    return { w: containerH * ar, h: containerH };
  }
  return { w: containerW, h: containerW / ar };
}

export function updateMeshSizes(
  containerW: number,
  containerH: number,
  meshes: Map<string, MeshEntry>,
  appearance: VideoAppearance,
) {
  for (const [id, { mesh, aspectRatio }] of meshes) {
    if (id === "background") {
      const { w, h } =
        aspectRatio && aspectRatio > 0
          ? coverFit(containerW, containerH, aspectRatio)
          : { w: containerW, h: containerH };

      mesh.geometry.dispose();
      mesh.geometry = new PlaneGeometry(w, h);
      mesh.position.set(containerW / 2, containerH / 2, 0);
    } else if (id === "video") {
      const pad = (appearance.padding / 100) * Math.min(containerW, containerH);
      const availW = containerW - pad * 2;
      const availH = containerH - pad * 2;

      const { w: vw, h: vh } =
        aspectRatio && aspectRatio > 0
          ? containFit(availW, availH, aspectRatio)
          : { w: availW, h: availH };

      mesh.geometry.dispose();
      mesh.geometry = new PlaneGeometry(vw, vh);
      mesh.position.set(containerW / 2, containerH / 2, 1);

      const mat = mesh.material as ShaderMaterial;
      if (mat.uniforms) {
        mat.uniforms.resolution.value.set(vw, vh);
        mat.uniforms.radius.value =
          (appearance.rounding / 100) * Math.min(vw, vh) * 0.5;
      }
    }
  }
}

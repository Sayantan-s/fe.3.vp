"use client";

import { useEffect, useRef } from "react";
import { TextureLoader, PlaneGeometry, MeshBasicMaterial, Mesh, type Texture } from "three";
import type { PlayerInternalContextValue } from "../types";

export function useBackgroundMesh(
  backgroundSrc: string,
  internal: PlayerInternalContextValue | null,
) {
  const meshRef = useRef<Mesh | null>(null);
  const textureRef = useRef<Texture | null>(null);

  useEffect(() => {
    if (!internal) return;

    const ctx = internal;
    const loader = new TextureLoader();
    let disposed = false;

    loader.load(
      backgroundSrc,
      (texture) => {
        if (disposed) { texture.dispose(); return; }
        textureRef.current = texture;

        const mesh = new Mesh(
          new PlaneGeometry(1, 1),
          new MeshBasicMaterial({ map: texture }),
        );
        meshRef.current = mesh;

        const imgAR = texture.image.width / texture.image.height || undefined;
        ctx.registerMesh("background", mesh, 0, imgAR);
      },
      undefined,
      () => {
        if (!disposed) {
          ctx.reportError(new Error(`Failed to load background image: ${backgroundSrc}`));
        }
      },
    );

    return () => {
      disposed = true;
      ctx.unregisterMesh("background");
      if (meshRef.current) {
        meshRef.current.geometry.dispose();
        (meshRef.current.material as MeshBasicMaterial).dispose();
        meshRef.current = null;
      }
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
    };
  }, [backgroundSrc, internal]);
}

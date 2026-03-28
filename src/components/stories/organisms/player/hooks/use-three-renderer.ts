"use client";

import { useEffect, useRef } from "react";
import type { WebGLRenderer, Scene, OrthographicCamera } from "three";
import type { VideoAppearanceStore } from "../types";
import { updateMeshSizes, type MeshEntry } from "../utils/mesh-layout";
import { createRenderer, createScene, createCamera, resizeCamera } from "../utils/create-renderer";

interface UseThreeRendererArgs {
  containerRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  meshesRef: React.RefObject<Map<string, MeshEntry>>;
  appearanceStore: VideoAppearanceStore;
  reportError: (error: Error) => void;
  clearError: () => void;
}

export function useThreeRenderer(args: UseThreeRendererArgs) {
  const { containerRef, canvasRef, meshesRef, appearanceStore, reportError, clearError } = args;

  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<OrthographicCamera | null>(null);
  const animFrameRef = useRef<number>(0);
  const requestResizeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = createRenderer(canvas);
    rendererRef.current = renderer;
    const scene = createScene();
    sceneRef.current = scene;
    const camera = createCamera();
    cameraRef.current = camera;

    function resize() {
      const { clientWidth: w, clientHeight: h } = container!;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      resizeCamera(camera, w, h);
      updateMeshSizes(w, h, meshesRef.current, appearanceStore.getAppearance());
      renderer.render(scene, camera);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();
    requestResizeRef.current = resize;

    const unsubAppearance = appearanceStore.subscribe(() => {
      const { clientWidth: w, clientHeight: h } = container!;
      updateMeshSizes(w, h, meshesRef.current, appearanceStore.getAppearance());
      renderer.render(scene, camera);
    });

    let running = true;
    function animate() {
      if (!running) return;
      animFrameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    const onLost = (e: Event) => { e.preventDefault(); running = false; cancelAnimationFrame(animFrameRef.current); reportError(new Error("WebGL context lost")); };
    const onRestored = () => { renderer.dispose(); rendererRef.current = createRenderer(canvas); running = true; resize(); animate(); clearError(); };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      unsubAppearance();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      renderer.dispose();
      requestResizeRef.current = null;
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [appearanceStore]);

  return { rendererRef, sceneRef, cameraRef, requestResizeRef };
}

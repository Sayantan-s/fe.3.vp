import { WebGLRenderer, Scene, OrthographicCamera } from "three";

export function createRenderer(canvas: HTMLCanvasElement) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  return renderer;
}

export function createScene() {
  return new Scene();
}

export function createCamera() {
  const camera = new OrthographicCamera(0, 1, 1, 0, 0.1, 1000);
  camera.position.z = 10;
  return camera;
}

export function resizeCamera(
  camera: OrthographicCamera,
  w: number,
  h: number,
) {
  camera.left = 0;
  camera.right = w;
  camera.top = h;
  camera.bottom = 0;
  camera.updateProjectionMatrix();
}

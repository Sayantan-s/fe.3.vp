import {
  VideoTexture, ShaderMaterial, LinearFilter, SRGBColorSpace, Vector2,
} from "three";
import { roundedVideoVert, roundedVideoFrag } from "../shaders";

export function createVideoMaterial(video: HTMLVideoElement): ShaderMaterial {
  const texture = new VideoTexture(video);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;

  return new ShaderMaterial({
    uniforms: {
      videoTexture: { value: texture },
      resolution: { value: new Vector2(1, 1) },
      radius: { value: 0 },
    },
    vertexShader: roundedVideoVert,
    fragmentShader: roundedVideoFrag,
    transparent: true,
  });
}

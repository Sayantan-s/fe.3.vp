/**
 * Passthrough vertex shader.
 * Passes UV coordinates to fragment shader.
 */
export const roundedVideoVert = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

/**
 * Rounded rectangle fragment shader using SDF.
 * Discards fragments outside the rounded rect boundary.
 */
export const roundedVideoFrag = /* glsl */ `
uniform sampler2D videoTexture;
uniform vec2 resolution;
uniform float radius;
varying vec2 vUv;

float roundedRect(vec2 p, vec2 size, float r) {
  vec2 d = abs(p) - size + r;
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;
}

void main() {
  vec2 p = vUv * resolution - resolution * 0.5;
  float d = roundedRect(p, resolution * 0.5, radius);
  if (d > 0.0) discard;
  gl_FragColor = texture2D(videoTexture, vUv);
}
`

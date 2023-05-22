varying vec2 vUv;
varying float vDistance;

void main() {
  vec4 nvPosition = viewMatrix * modelMatrix * vec4(position, 1.0);
  float dist = pow(length(nvPosition.xyz) / 2.0, 6.0);

  gl_Position = projectionMatrix * nvPosition;

  vUv = uv;
  vDistance = dist;
}
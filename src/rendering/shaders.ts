import * as BABYLON from '@babylonjs/core';

export const registerShaders = (): void => {
  BABYLON.Effect.ShadersStore['voxelVertexShader'] = `
    precision highp float;

    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;
    attribute float tint;

    uniform mat4 worldViewProjection;
    uniform mat4 world;

    varying vec2 vUV;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vTint;

    void main() {
      vec4 worldPos = world * vec4(position, 1.0);
      gl_Position = worldViewProjection * worldPos;
      vUV = uv;
      vNormal = normal;
      vPosition = worldPos.xyz;
      vTint = tint;
    }
  `;

  BABYLON.Effect.ShadersStore['voxelFragmentShader'] = `
    precision highp float;

    uniform sampler2D textureSampler;
    uniform vec3 lightDirection;
    uniform float fogStart;
    uniform float fogEnd;
    uniform vec3 fogColor;
    uniform vec3 cameraPosition;
    uniform vec3 biomeColor;

    varying vec2 vUV;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vTint;

    void main() {
      vec4 texColor = texture2D(textureSampler, vUV);

      if (vTint > 0.5) {
        texColor.rgb *= biomeColor;
      }

      float ambient = 0.4;
      float diff = max(dot(normalize(vNormal), normalize(-lightDirection)), 0.0);
      float light = ambient + diff * 0.6;

      if (abs(vNormal.x) > 0.5) light *= 0.8;
      if (abs(vNormal.z) > 0.5) light *= 0.8;
      if (vNormal.y < -0.5)     light *= 0.5;

      vec3 finalColor = texColor.rgb * light;

      float dist = length(vPosition - cameraPosition);
      float fogFactor = clamp((dist - fogStart) / (fogEnd - fogStart), 0.0, 1.0);
      finalColor = mix(finalColor, fogColor, fogFactor);

      gl_FragColor = vec4(finalColor, texColor.a);
    }
  `;

  BABYLON.Effect.ShadersStore['voxelOverlayVertexShader'] = `
    precision highp float;

    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;

    uniform mat4 worldViewProjection;
    uniform mat4 world;

    varying vec2 vUV;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec4 worldPos = world * vec4(position, 1.0);
      gl_Position = worldViewProjection * worldPos;
      vUV = uv;
      vNormal = normal;
      vPosition = worldPos.xyz;
    }
  `;

  BABYLON.Effect.ShadersStore['voxelOverlayFragmentShader'] = `
    precision highp float;

    uniform sampler2D textureSampler;
    uniform vec3 lightDirection;
    uniform float fogStart;
    uniform float fogEnd;
    uniform vec3 fogColor;
    uniform vec3 cameraPosition;
    uniform vec3 biomeColor;

    varying vec2 vUV;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec4 texColor = texture2D(textureSampler, vUV);

      // cutout transparency
      if (texColor.a < 0.5) discard;

      texColor.rgb *= biomeColor;

      float ambient = 0.4;
      float diff = max(dot(normalize(vNormal), normalize(-lightDirection)), 0.0);
      float light = ambient + diff * 0.6;

      if (abs(vNormal.x) > 0.5) light *= 0.8;
      if (abs(vNormal.z) > 0.5) light *= 0.8;

      vec3 finalColor = texColor.rgb * light;

      float dist = length(vPosition - cameraPosition);
      float fogFactor = clamp((dist - fogStart) / (fogEnd - fogStart), 0.0, 1.0);
      finalColor = mix(finalColor, fogColor, fogFactor);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;
};
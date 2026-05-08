import * as BABYLON from '@babylonjs/core';

export interface BiomeColor {
  r: number;
  g: number;
  b: number;
}

export const PLAINS_BIOME: BiomeColor = {
  r: 0.569,
  g: 0.741,
  b: 0.349,
};

export class VoxelMaterials {
  private baseMaterial: BABYLON.ShaderMaterial;
  private overlayMaterial: BABYLON.ShaderMaterial;
  private biomeColor: BiomeColor;
  private scene: BABYLON.Scene;

  constructor(
    atlasCanvas: HTMLCanvasElement,
    scene: BABYLON.Scene,
    biomeColor: BiomeColor = PLAINS_BIOME
  ) {
    this.scene = scene;
    this.biomeColor = biomeColor;

    const atlasTexture = this.createAtlasTexture(atlasCanvas);
    this.baseMaterial = this.createBaseMaterial(atlasTexture);
    this.overlayMaterial = this.createOverlayMaterial(atlasTexture);
  }

  private createAtlasTexture(
    atlasCanvas: HTMLCanvasElement
  ): BABYLON.DynamicTexture {
    const tex = new BABYLON.DynamicTexture(
      'atlas',
      { width: atlasCanvas.width, height: atlasCanvas.height },
      this.scene,
      false,
      BABYLON.Texture.NEAREST_NEAREST
    );
    const ctx = tex.getContext();
    ctx.drawImage(atlasCanvas, 0, 0);
    tex.update();
    return tex;
  }

  private createBaseMaterial(
    atlasTexture: BABYLON.DynamicTexture
  ): BABYLON.ShaderMaterial {
    const mat = new BABYLON.ShaderMaterial(
      'voxelBase',
      this.scene,
      { vertex: 'voxel', fragment: 'voxel' },
      {
        attributes: ['position', 'normal', 'uv', 'tint'],
        uniforms: [
          'worldViewProjection',
          'world',
          'lightDirection',
          'fogStart',
          'fogEnd',
          'fogColor',
          'cameraPosition',
          'biomeColor',
        ],
        samplers: ['textureSampler'],
      }
    );

    mat.setTexture('textureSampler', atlasTexture);
    mat.setVector3('lightDirection', new BABYLON.Vector3(-1, -2, -1));
    mat.setFloat('fogStart', 40);
    mat.setFloat('fogEnd', 80);
    mat.setVector3('fogColor', new BABYLON.Vector3(0.53, 0.81, 0.98));
    mat.setVector3(
      'biomeColor',
      new BABYLON.Vector3(
        this.biomeColor.r,
        this.biomeColor.g,
        this.biomeColor.b
      )
    );
    mat.backFaceCulling = false;

    return mat;
  }

  private createOverlayMaterial(
    atlasTexture: BABYLON.DynamicTexture
  ): BABYLON.ShaderMaterial {
    const mat = new BABYLON.ShaderMaterial(
      'voxelOverlay',
      this.scene,
      { vertex: 'voxelOverlay', fragment: 'voxelOverlay' },
      {
        attributes: ['position', 'normal', 'uv', 'tint'],
        uniforms: [
          'worldViewProjection',
          'world',
          'lightDirection',
          'fogStart',
          'fogEnd',
          'fogColor',
          'cameraPosition',
          'biomeColor',
        ],
        samplers: ['textureSampler'],
      }
    );

    mat.setTexture('textureSampler', atlasTexture);
    mat.setVector3('lightDirection', new BABYLON.Vector3(-1, -2, -1));
    mat.setFloat('fogStart', 40);
    mat.setFloat('fogEnd', 80);
    mat.setVector3('fogColor', new BABYLON.Vector3(0.53, 0.81, 0.98));
    mat.setVector3(
      'biomeColor',
      new BABYLON.Vector3(
        this.biomeColor.r,
        this.biomeColor.g,
        this.biomeColor.b
      )
    );
    mat.backFaceCulling = false;
    mat.needDepthPrePass = false;
    mat.alphaMode = BABYLON.Engine.ALPHA_DISABLE;

    return mat;
  }

  public getBaseMaterial(): BABYLON.ShaderMaterial {
    return this.baseMaterial;
  }

  public getOverlayMaterial(): BABYLON.ShaderMaterial {
    return this.overlayMaterial;
  }

  public setBiomeColor(color: BiomeColor): void {
    this.biomeColor = color;
    const vec = new BABYLON.Vector3(color.r, color.g, color.b);
    this.baseMaterial.setVector3('biomeColor', vec);
    this.overlayMaterial.setVector3('biomeColor', vec);
  }

  public updateCameraPosition(position: BABYLON.Vector3): void {
    this.baseMaterial.setVector3('cameraPosition', position);
    this.overlayMaterial.setVector3('cameraPosition', position);
  }
}
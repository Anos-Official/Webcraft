import * as BABYLON from '@babylonjs/core';
import { createCamera } from './player/camera';
import { buildAtlas } from './rendering/atlas';
import { buildChunkMesh, FaceUVs } from './rendering/meshBuilder';
import { buildOverlayMesh } from './rendering/overlayMesh';
import { registerShaders } from './rendering/shaders';
import { VoxelMaterials, PLAINS_BIOME } from './rendering/materials';
import { WORLD_CHUNKS_X, WORLD_CHUNKS_Z } from './world/blocks';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
const engine = new BABYLON.Engine(canvas, false);

const createScene = async (): Promise<BABYLON.Scene> => {
  const scene = new BABYLON.Scene(engine);

  scene.clearColor = new BABYLON.Color4(0.53, 0.81, 0.98, 1.0);

  // camera
  const camera = createCamera(scene, canvas);

  // register shaders
  registerShaders();

  // build texture atlas
  const atlas = await buildAtlas();

  // create materials
  const voxelMaterials = new VoxelMaterials(
    atlas.texture,
    scene,
    PLAINS_BIOME
  );

  // pass atlas regions as face uvs
  const faceUVs: FaceUVs = {
    grass_top:     atlas.regions['grass_top'],
    grass_side:    atlas.regions['grass_side'],
    grass_overlay: atlas.regions['grass_overlay'],
    dirt:          atlas.regions['dirt'],
    stone:         atlas.regions['stone'],
  };

  // update camera position in materials every frame
  scene.registerBeforeRender(() => {
    voxelMaterials.updateCameraPosition(camera.position);
  });

  // spawn chunk workers
  for (let cx = 0; cx < WORLD_CHUNKS_X; cx++) {
    for (let cz = 0; cz < WORLD_CHUNKS_Z; cz++) {
      const worker = new Worker(
        new URL('./workers/chunkWorker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.postMessage({ chunkX: cx, chunkZ: cz });

      worker.onmessage = (e: MessageEvent) => {
        const { chunkX, chunkZ, blocks } = e.data;
        const blockData = new Uint8Array(blocks);

        // base mesh
        const mesh = buildChunkMesh(
          chunkX,
          chunkZ,
          blockData,
          faceUVs,
          scene,
          engine
        );
        mesh.material = voxelMaterials.getBaseMaterial();

        // overlay mesh
        const overlayMesh = buildOverlayMesh(
          chunkX,
          chunkZ,
          blockData,
          faceUVs,
          scene,
          engine
        );
        if (overlayMesh) {
          overlayMesh.material = voxelMaterials.getOverlayMaterial();
        }

        worker.terminate();
      };
    }
  }

  return scene;
};

createScene().then(scene => {
  engine.runRenderLoop(() => {
    scene.render();
  });
});

window.addEventListener('resize', () => {
  engine.resize();
});
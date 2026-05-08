import * as BABYLON from '@babylonjs/core';
import { Block, BLOCK_DATA, CHUNK_SIZE, CHUNK_HEIGHT } from '../world/blocks';
import { AtlasRegion } from './atlas';

export interface FaceUVs {
  grass_top: AtlasRegion;
  grass_side: AtlasRegion;
  grass_overlay: AtlasRegion;
  dirt: AtlasRegion;
  stone: AtlasRegion;
}

export enum Face {
  TOP = 0,
  BOTTOM = 1,
  FRONT = 2,
  BACK = 3,
  LEFT = 4,
  RIGHT = 5,
}

const FACE_NORMALS = [
  [ 0,  1,  0],
  [ 0, -1,  0],
  [ 0,  0,  1],
  [ 0,  0, -1],
  [-1,  0,  0],
  [ 1,  0,  0],
];

const FACE_VERTICES = [
  // top
  [[-0.5, 0.5,  0.5], [ 0.5, 0.5,  0.5], [ 0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]],
  // bottom
  [[-0.5,-0.5, -0.5], [ 0.5,-0.5, -0.5], [ 0.5,-0.5,  0.5], [-0.5,-0.5,  0.5]],
  // front
  [[ 0.5,-0.5,  0.5], [-0.5,-0.5,  0.5], [-0.5, 0.5,  0.5], [ 0.5, 0.5,  0.5]],
  // back
  [[-0.5,-0.5, -0.5], [ 0.5,-0.5, -0.5], [ 0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]],
  // left
  [[-0.5,-0.5,  0.5], [-0.5,-0.5, -0.5], [-0.5, 0.5, -0.5], [-0.5, 0.5,  0.5]],
  // right
  [[ 0.5,-0.5, -0.5], [ 0.5,-0.5,  0.5], [ 0.5, 0.5,  0.5], [ 0.5, 0.5, -0.5]],
];

const NEIGHBOR_OFFSETS: [number, number, number][] = [
  [ 0,  1,  0],
  [ 0, -1,  0],
  [ 0,  0,  1],
  [ 0,  0, -1],
  [-1,  0,  0],
  [ 1,  0,  0],
];

const idx = (x: number, y: number, z: number): number =>
  x + CHUNK_SIZE * (y + CHUNK_HEIGHT * z);

const getBlock = (
  blocks: Uint8Array,
  x: number,
  y: number,
  z: number
): Block => {
  if (x < 0 || x >= CHUNK_SIZE || z < 0 || z >= CHUNK_SIZE) {
    return Block.STONE;
  }
  if (y < 0 || y >= CHUNK_HEIGHT) {
    return Block.AIR;
  }
  return blocks[idx(x, y, z)] as Block;
};

const isSolid = (
  blocks: Uint8Array,
  x: number,
  y: number,
  z: number
): boolean => {
  const block = getBlock(blocks, x, y, z);
  return BLOCK_DATA[block].solid;
};

const getUVForFace = (
  block: Block,
  face: Face,
  uvs: FaceUVs
): AtlasRegion => {
  if (block === Block.GRASS) {
    if (face === Face.TOP)    return uvs.grass_top;
    if (face === Face.BOTTOM) return uvs.dirt;
    return uvs.grass_side;
  }
  if (block === Block.DIRT)  return uvs.dirt;
  if (block === Block.STONE) return uvs.stone;
  return uvs.dirt;
};

const pushUVs = (
  uvCoords: number[],
  region: AtlasRegion,
  face: Face
): void => {
  if (face === Face.BOTTOM) {
    uvCoords.push(region.u0, 1.0 - region.v0);
    uvCoords.push(region.u1, 1.0 - region.v0);
    uvCoords.push(region.u1, 1.0 - region.v1);
    uvCoords.push(region.u0, 1.0 - region.v1);
    return;
  }
  uvCoords.push(region.u0, 1.0 - region.v1);
  uvCoords.push(region.u1, 1.0 - region.v1);
  uvCoords.push(region.u1, 1.0 - region.v0);
  uvCoords.push(region.u0, 1.0 - region.v0);
};

export const buildChunkMesh = (
  chunkX: number,
  chunkZ: number,
  blocks: Uint8Array,
  uvs: FaceUVs,
  scene: BABYLON.Scene,
  engine: BABYLON.Engine
): BABYLON.Mesh => {
  const positions: number[] = [];
  const indices: number[] = [];
  const uvCoords: number[] = [];
  const normals: number[] = [];
  const tints: number[] = [];

  let vertexCount = 0;

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        const block = getBlock(blocks, x, y, z) as Block;
        if (block === Block.AIR) continue;

        const worldX = chunkX * CHUNK_SIZE + x;
        const worldZ = chunkZ * CHUNK_SIZE + z;

        for (let f = 0; f < 6; f++) {
          const face = f as Face;
          const [nx, ny, nz] = NEIGHBOR_OFFSETS[f];

          // skip bottom face at y=0
          if (face === Face.BOTTOM && y === 0) continue;

          if (isSolid(blocks, x + nx, y + ny, z + nz)) continue;

          const faceVerts = FACE_VERTICES[f];
          const normal = FACE_NORMALS[f];
          const region = getUVForFace(block, face, uvs);
          const tint = (block === Block.GRASS && face === Face.TOP) ? 1.0 : 0.0;

          faceVerts.forEach(([vx, vy, vz]) => {
            positions.push(worldX + vx, y + vy, worldZ + vz);
            normals.push(normal[0], normal[1], normal[2]);
            tints.push(tint);
          });

          pushUVs(uvCoords, region, face);

          indices.push(
            vertexCount,     vertexCount + 1, vertexCount + 2,
            vertexCount,     vertexCount + 2, vertexCount + 3
          );

          vertexCount += 4;
        }
      }
    }
  }

  const mesh = new BABYLON.Mesh(`chunk_${chunkX}_${chunkZ}`, scene);
  const vertexData = new BABYLON.VertexData();

  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.uvs = uvCoords;
  vertexData.normals = normals;
  vertexData.applyToMesh(mesh, true);

  const tintBuffer = new BABYLON.VertexBuffer(
    engine,
    tints,
    'tint',
    false,
    false,
    1
  );
  mesh.setVerticesBuffer(tintBuffer);

  return mesh;
};
import * as BABYLON from '@babylonjs/core';
import { Block, CHUNK_SIZE, CHUNK_HEIGHT } from '../world/blocks';
import { AtlasRegion } from './atlas';
import { FaceUVs, Face } from './meshBuilder';

const FACE_VERTICES = [
  // front
  [[ 0.5,-0.5,  0.5], [-0.5,-0.5,  0.5], [-0.5, 0.5,  0.5], [ 0.5, 0.5,  0.5]],
  // back
  [[-0.5,-0.5, -0.5], [ 0.5,-0.5, -0.5], [ 0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]],
  // left
  [[-0.5,-0.5,  0.5], [-0.5,-0.5, -0.5], [-0.5, 0.5, -0.5], [-0.5, 0.5,  0.5]],
  // right
  [[ 0.5,-0.5, -0.5], [ 0.5,-0.5,  0.5], [ 0.5, 0.5,  0.5], [ 0.5, 0.5, -0.5]],
];

const FACE_NORMALS = [
  [ 0,  0,  1],
  [ 0,  0, -1],
  [-1,  0,  0],
  [ 1,  0,  0],
];

const NEIGHBOR_OFFSETS: [number, number, number][] = [
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
    return Block.AIR;
  }
  if (y < 0 || y >= CHUNK_HEIGHT) {
    return Block.AIR;
  }
  return blocks[idx(x, y, z)] as Block;
};

const pushUVs = (
  uvCoords: number[],
  region: AtlasRegion
): void => {
  uvCoords.push(region.u0, 1.0 - region.v1);
  uvCoords.push(region.u1, 1.0 - region.v1);
  uvCoords.push(region.u1, 1.0 - region.v0);
  uvCoords.push(region.u0, 1.0 - region.v0);
};

export const buildOverlayMesh = (
  chunkX: number,
  chunkZ: number,
  blocks: Uint8Array,
  uvs: FaceUVs,
  scene: BABYLON.Scene,
  engine: BABYLON.Engine
): BABYLON.Mesh | null => {
  const positions: number[] = [];
  const indices: number[] = [];
  const uvCoords: number[] = [];
  const normals: number[] = [];
  const tints: number[] = [];

  let vertexCount = 0;
  let faceCount = 0;

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        const block = getBlock(blocks, x, y, z);
        if (block !== Block.GRASS) continue;

        const worldX = chunkX * CHUNK_SIZE + x;
        const worldZ = chunkZ * CHUNK_SIZE + z;

        for (let f = 0; f < 4; f++) {
          const [nx, , nz] = NEIGHBOR_OFFSETS[f];
          const neighbor = getBlock(blocks, x + nx, y, z + nz);

          // only render overlay on exposed sides
          if (neighbor !== Block.AIR) continue;

          const faceVerts = FACE_VERTICES[f];
          const normal = FACE_NORMALS[f];

          // slight offset to prevent z-fighting with base mesh
          const offset = 0.001;
          faceVerts.forEach(([vx, vy, vz]) => {
            const ox = normal[0] * offset;
            const oz = normal[2] * offset;
            positions.push(worldX + vx + ox, y + vy, worldZ + vz + oz);
            normals.push(normal[0], normal[1], normal[2]);
            tints.push(1.0); // always tinted
          });

          pushUVs(uvCoords, uvs.grass_overlay);

          indices.push(
            vertexCount,     vertexCount + 1, vertexCount + 2,
            vertexCount,     vertexCount + 2, vertexCount + 3
          );

          vertexCount += 4;
          faceCount++;
        }
      }
    }
  }

  // no grass sides in this chunk
  if (faceCount === 0) return null;

  const mesh = new BABYLON.Mesh(
    `chunk_overlay_${chunkX}_${chunkZ}`,
    scene
  );
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
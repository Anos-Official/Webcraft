/// <reference lib="webworker" />
import { Block, CHUNK_SIZE, CHUNK_HEIGHT } from '../world/blocks';

const getHeight = (x: number, z: number): number => {
  const wave1 = Math.sin(x * 0.15) * 1.2;
  const wave2 = Math.cos(z * 0.15) * 1.2;
  const wave3 = Math.sin((x + z) * 0.1) * 0.8;
  return Math.floor(8 + wave1 + wave2 + wave3);
};

const generateChunk = (chunkX: number, chunkZ: number): Uint8Array => {
  const blocks = new Uint8Array(CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE);
  const idx = (x: number, y: number, z: number): number =>
    x + CHUNK_SIZE * (y + CHUNK_HEIGHT * z);

  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const worldX = chunkX * CHUNK_SIZE + x;
      const worldZ = chunkZ * CHUNK_SIZE + z;
      const height = getHeight(worldX, worldZ);

      for (let y = 0; y < CHUNK_HEIGHT; y++) {
        if (y > height) {
          blocks[idx(x, y, z)] = Block.AIR;
        } else if (y === height) {
          blocks[idx(x, y, z)] = Block.GRASS;
        } else if (y >= height - 3) {
          blocks[idx(x, y, z)] = Block.DIRT;
        } else {
          blocks[idx(x, y, z)] = Block.STONE;
        }
      }
    }
  }

  return blocks;
};

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (e: MessageEvent) => {
  const { chunkX, chunkZ } = e.data;
  const blocks = generateChunk(chunkX, chunkZ);

  ctx.postMessage(
    { chunkX, chunkZ, blocks },
    [blocks.buffer]
  );
};
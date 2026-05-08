export interface AtlasRegion {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

export interface Atlas {
  texture: HTMLCanvasElement;
  regions: Record<string, AtlasRegion>;
}

const TILE_SIZE = 16;
const ATLAS_COLS = 8;

const TEXTURES: Record<string, string> = {
  grass_top:  'textures/grass/grass_block_top.png',
  grass_side: 'textures/grass/grass_block_side.png',
  grass_overlay: 'textures/grass/grass_block_side_overlay.png',
  dirt:       'textures/dirt/dirt.png',
  stone:      'textures/stone/stone.png',
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load texture: ${src}`));
    img.src = src;
  });
};

export const buildAtlas = async (): Promise<Atlas> => {
  const keys = Object.keys(TEXTURES);
  const images = await Promise.all(keys.map(k => loadImage(TEXTURES[k])));

  const cols = ATLAS_COLS;
  const rows = Math.ceil(keys.length / cols);
  const atlasWidth = cols * TILE_SIZE;
  const atlasHeight = rows * TILE_SIZE;

  const canvas = document.createElement('canvas');
  canvas.width = atlasWidth;
  canvas.height = atlasHeight;

  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const regions: Record<string, AtlasRegion> = {};

  keys.forEach((key, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const px = col * TILE_SIZE;
    const py = row * TILE_SIZE;

    ctx.drawImage(images[i], px, py, TILE_SIZE, TILE_SIZE);

    regions[key] = {
      u0: px / atlasWidth,
      v0: py / atlasHeight,
      u1: (px + TILE_SIZE) / atlasWidth,
      v1: (py + TILE_SIZE) / atlasHeight,
    };
  });

  return { texture: canvas, regions };
};
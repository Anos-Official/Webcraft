import * as BABYLON from '@babylonjs/core';

export const createCamera = (
  scene: BABYLON.Scene,
  canvas: HTMLCanvasElement
): BABYLON.UniversalCamera => {
  const camera = new BABYLON.UniversalCamera(
    'camera',
    new BABYLON.Vector3(32, 12, 32),
    scene
  );

  camera.setTarget(new BABYLON.Vector3(33, 11, 33));
  camera.attachControl(canvas, true);
  camera.keysUp    = [87]; // W
  camera.keysDown  = [83]; // S
  camera.keysLeft  = [65]; // A
  camera.keysRight = [68]; // D
  camera.speed = 0.3;
  camera.angularSensibility = 800;
  camera.minZ = 0.1;

  canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
  });

  return camera;
};
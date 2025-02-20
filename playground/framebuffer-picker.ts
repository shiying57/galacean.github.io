/**
 * @title Framebuffer Picker
 * @category Toolkit
 */
import {
  Camera,
  GLTFResource,
  PBRMaterial,
  PointerButton,
  Script,
  Vector3,
  WebGLEngine,
} from "@galacean/engine";
import { OrbitControl } from "@galacean/engine-toolkit-controls";
import { FramebufferPicker } from "@galacean/engine-toolkit-framebuffer-picker";

class ClickScript extends Script {
  material: PBRMaterial;

  onUpdate(): void {
    const inputManager = this.engine.inputManager;
    const { pointers } = inputManager;
    if (pointers && inputManager.isPointerDown(PointerButton.Primary)) {
      if (pointers.length > 0) {
        const pointerPosition = pointers[0].position;
        framebufferPicker
          .pick(pointerPosition.x, pointerPosition.y)
          .then((renderElement) => {
            if (renderElement) {
              this.material.baseColor.set(1, 0, 0, 1);
            } else {
              this.material.baseColor.set(1, 1, 1, 1);
            }
          });
      }
    }
  }
}

const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();
const scene = engine.sceneManager.activeScene;
const rootNode = scene.createRootEntity();
scene.ambientLight.diffuseSolidColor.set(1, 1, 1, 1);

const cameraEntity = rootNode.createChild("camera_node");
const camera = cameraEntity.addComponent(Camera);
const control = cameraEntity.addComponent(OrbitControl);
cameraEntity.transform.position = new Vector3(10, 10, 30);
control.target.set(0, 3, 0);

const framebufferPicker = rootNode.addComponent(FramebufferPicker);
framebufferPicker.camera = camera;

engine.resourceManager
  .load<GLTFResource>(
    "https://gw.alipayobjects.com/os/bmw-prod/f40ef8dd-4c94-41d4-8fac-c1d2301b6e47.glb"
  )
  .then((gltf) => {
    const { defaultSceneRoot, materials } = gltf;
    const material = materials[0] as PBRMaterial;

    defaultSceneRoot.transform.setScale(0.1, 0.1, 0.1);
    rootNode.addChild(defaultSceneRoot);

    const click = cameraEntity.addComponent(ClickScript);
    click.material = material;
  });

engine.run();

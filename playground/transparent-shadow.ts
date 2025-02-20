/**
 * @title Transparent Shadow
 * @category Light
 */
import * as dat from "dat.gui";
import {
  AmbientLight,
  AssetType,
  BackgroundMode,
  BaseMaterial,
  Camera,
  Color,
  DirectLight,
  Engine,
  GLTFResource,
  MeshRenderer,
  PBRMaterial,
  PrimitiveMesh,
  Script,
  Shader,
  ShadowResolution,
  ShadowType,
  Vector3,
  WebGLEngine,
} from "@galacean/engine";

Shader.create(
  "transparent-shadow",
  `
#include <common_vert>
#include <blendShape_input>
#include <uv_share>
#include <worldpos_share>

#include <ShadowVertexDeclaration>

void main() {

    #include <begin_position_vert>
    #include <blendShape_vert>
    #include <skinning_vert>
    #include <uv_vert>
    #include <worldpos_vert>
    #include <position_vert>

    #include <ShadowVertex>
}
`,
  `
#include <common>
#include <uv_share>
#include <worldpos_share>
#include <ShadowFragmentDeclaration>

uniform vec4 u_baseColor;
uniform float u_alphaCutoff;

void main() {
    float shadowAttenuation = 1.0;
    #ifdef OASIS_CALCULATE_SHADOWS
      shadowAttenuation *= sampleShadowMap();
    #endif

    gl_FragColor = vec4(u_baseColor.rgb, saturate(1.0 - shadowAttenuation) * u_baseColor.a);
    
    #ifndef OASIS_COLORSPACE_GAMMA
        gl_FragColor = linearToGamma(gl_FragColor);
    #endif
}
`
);

class TransparentShadow extends BaseMaterial {
  /**
   * Base color.
   */
  get baseColor(): Color {
    return this.shaderData.getColor(TransparentShadow._baseColorProp);
  }

  set baseColor(value: Color) {
    const baseColor = this.shaderData.getColor(
      TransparentShadow._baseColorProp
    );
    if (value !== baseColor) {
      baseColor.copyFrom(value);
    }
  }

  constructor(engine: Engine) {
    super(engine, Shader.find("transparent-shadow"));
    this.isTransparent = true;
    this.shaderData.setColor(
      TransparentShadow._baseColorProp,
      new Color(0, 0, 0, 1)
    );
    this.shaderData.enableMacro("O3_NEED_WORLDPOS");
  }
}

class Rotation extends Script {
  pause = false;
  private _time = 0;

  onUpdate(deltaTime: number) {
    if (!this.pause) {
      this._time += deltaTime / 1000;
      this.entity.transform.setRotation(0, this._time * 50, 0);
    }
  }
}

const gui = new dat.GUI();
const engine = new WebGLEngine("canvas");
engine.canvas.resizeByClientSize();

const scene = engine.sceneManager.activeScene;
scene.shadowResolution = ShadowResolution.High;
scene.shadowDistance = 800;

const rootEntity = engine.sceneManager.activeScene.createRootEntity();

const cameraEntity = rootEntity.createChild("camera");
cameraEntity.transform.setPosition(-140, 210, 1020);
cameraEntity.transform.setRotation(0, -16, 0);
const camera = cameraEntity.addComponent(Camera);
camera.farClipPlane = 800;

const transparentShadowMtl = new TransparentShadow(engine);
transparentShadowMtl.baseColor.set(9 / 255, 8 / 255, 9 / 255, 1);
const debugMtl = new PBRMaterial(engine);
debugMtl.baseColor.set(1, 0, 0, 0.5);
debugMtl.isTransparent = true;

const planeEntity = rootEntity.createChild();
const planeRenderer = planeEntity.addComponent(MeshRenderer);
planeRenderer.mesh = PrimitiveMesh.createPlane(engine, 300, 2000);
planeRenderer.setMaterial(transparentShadowMtl);

// init direct light
const light = rootEntity.createChild("light");
light.transform.setPosition(-140, 1000, -1020);
light.transform.lookAt(new Vector3(30, 0, 300));
const directLight = light.addComponent(DirectLight);
directLight.shadowType = ShadowType.SoftLow;
directLight.shadowStrength = 0.75;

engine.resourceManager
  //@ts-ignore
  .load<[GLTFResource, AmbientLight, Texture2D]>([
    {
      url: "https://gw.alipayobjects.com/os/bmw-prod/93196534-bab3-4559-ae9f-bcb3e36a6419.glb",
      type: AssetType.Prefab,
    },
    {
      url: "https://gw.alipayobjects.com/os/bmw-prod/89c54544-1184-45a1-b0f5-c0b17e5c3e68.bin",
      type: AssetType.Env,
    },
    {
      url: "https://gw.alipayobjects.com/mdn/rms_7c464e/afts/img/A*X0IjQ5E1OUEAAAAAAAAAAAAAARQnAQ",
      type: AssetType.Texture2D,
    },
  ])
  .then(([gltf, ambientLight, background]) => {
    gltf.defaultSceneRoot.addComponent(Rotation);
    const character = rootEntity.createChild("gltf");
    character.transform.setScale(20, 20, 20);
    character.transform.setPosition(100, 0, 300);
    character.addChild(gltf.defaultSceneRoot);

    scene.background.mode = BackgroundMode.Texture;
    scene.background.texture = background;

    scene.ambientLight = ambientLight;
    scene.ambientLight.specularIntensity = 0.1;
    openDebug();
    engine.run();
  });

function openDebug() {
  const info = {
    debug: false,
  };

  gui.add(info, "debug").onChange((v) => {
    if (v) {
      planeRenderer.setMaterial(debugMtl);
    } else {
      planeRenderer.setMaterial(transparentShadowMtl);
    }
  });
}

---
order: 2
title: 物理管理器
type: 物理
label: Physics
---

物理管理器（PhysicsManager）用于管理场景中所有的物理组件，并且负责与物理后端通信，实现有关物理场景的全局操作，例如更新和射线检测等等。

## 物理更新

物理场景和渲染场景相互独立，但在程序运行过程中不断同步各自的数据。因此，和脚本一样，同步的时序也非常重要。一般来说，物理场景的更新频率和渲染场景不同，在物理管理器中可以对其进行设置：

```typescript
/** The fixed time step in seconds at which physics are performed. */
fixedTimeStep: number = 1 / 60;

/** The max sum of time step in seconds one frame. */
maxSumTimeStep: number = 1 / 3;
```

每一个渲染帧中，物理引擎都会按照固定时间步长进行更新 `fixedTimeStep`。

如果时时间间隔大于 `fixedTimeStep`，则单步模拟的最大时间步长由 `maxSumTimeStep` 确定。此时，如果按照上面列出的默认参数，有可能会发生追帧现象。
这时候可以通过调节 `maxSumTimeStep` 降低每帧物理模拟的更新次数。

如果不满一个 `fixedTimeStep`，则顺延到下一帧再处理。因此，每一个渲染帧，物理场景可能会更新多次，也可能只更新一次，因此对于有关物理组件更新，都需要放在特定的更新函数，`Script`
提供了这一接口：

```typescript
export class Script extends Component {
  /**
   * Called before physics calculations, the number of times is related to the physical update frequency.
   */
  onPhysicsUpdate(): void {
  }
}
```

物理场景在更新时，除了调用该函数，还会同步 Collider 和其所挂载的 Entity 的姿态。物理更新的时序如下：

1. 调用 `onPhysicsUpdate` 中的用户逻辑
2. `callColliderOnUpdate` 将被修改的 Entity 新姿态同步给物理碰撞器
3. 更新物理场景
4. `callColliderOnLateUpdate` 将所有 DynamicCollider 更新后的位置同步给对应的 Entity

## 使用射线检测

<playground src="physx-raycast.ts"></playground>

射线可以理解成 3D 世界中一个点向一个方向发射的一条无终点的线。射线投射在 3D 应用中非常广泛。通过射线投射，可以在用户点击屏幕时，拾取 3D 场景中的物体；也可以在射击游戏中，判断子弹能否射中目标。

![image.png](https://gw.alipayobjects.com/mdn/rms_7c464e/afts/img/A*SHM1RI49Bd4AAAAAAAAAAAAAARQnAQ)
（_图片来源于网络_）

在使用射线投射，首先要在代码中引入 [Ray](${api}math/Ray) 模块；然后生成射线，射线可以自定义生成，也可以通过相机（[camera](${api}core/Camera#viewportPointToRay)
）将屏幕输入转化成射线；最后调用 [PhysicsManager.raycast](${api}core/PhysicsManager#raycast) 方法即可检测射线投射命中的碰撞体。代码如下：

```typescript
// 加载 Raycast 模块
import {WebGLEngine, HitResult, Ray} from "@galacean/engine";
import {LitePhysics} from "@galacean/engine-physics-lite";

const engine = new WebGLEngine("canvas");
engine.physicsManager.initialize(LitePhysics);
engine.canvas.resizeByClientSize();

// 将屏幕输入转换成Ray
document.getElementById('canvas').addEventListener('click', (e) => {
  const ratio = window.devicePixelRatio;
  let ray = new Ray();
  camera.screenPointToRay(new Vector2(e.offsetX, e.offsetY).scale(ratio), ray);
  const hit = new HitResult();
  result = engine.physicsManager.raycast(ray, Number.MAX_VALUE, Layer.Everything, hit);
  if (result) {
    console.log(hit.entity.name);
  }
});
```

需要特别指出，如果想要对 Entity 启用射线投射，该 Entity 就必须拥有 **Collider** ，否则无法触发。

同时，在 Galacean 当中，还提供了 InputManager，该管理器将输入源做了封装，提供了更加易用的逻辑，使用方式可以[参考](${docs}input-cn) .

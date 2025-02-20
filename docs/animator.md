---
order: 1
title: Animator Component
type: Animation
label: Animation
---

The [Animator](${api}core/Animator) can organize [AnimationClips](${api}core/AnimationClip) through the state machine to achieve more flexible and rich animation effects.

## Basic usage
After loading the glTF model, the engine will automatically add an Animator component to the model's root entity , and add the animation clips in the model to it. You can get the Animator component directly on the root entity of the model and play the specified animation.

```typescript
engine.resourceManager
  .load<GLTFResource>("https://gw.alipayobjects.com/os/bmw-prod/5e3c1e4e-496e-45f8-8e05-f89f2bd5e4a4.glb")
  .then((asset) => {
    const { defaultSceneRoot } = asset;
    rootEntity.addChild(defaultSceneRoot);
    const animator = defaultSceneRoot.getComponent(Animator);
    animator.play("run");
});
```

### Control playback speed

You can control the playback speed of the animation through the [speed](${api}core/Animator#speed) property. The default value of `speed` is `1.0`, the larger the value, the faster the playback, the smaller the slower the playback. When the value is negative, it will play backward.

```typescript
animator.speed = 2.0；
```

### Pause/Resume
You can control the pausing and resuming of the animation by setting the animator's [enabled](${api}core/ Animator#enabled).

```typescript
// pause
animator.enabled = false;
// resume
animator.enabled = true;
```

### Set animator data

You can set the data of the animation controller through the [animatorController](${api}core/Animator#animatorController) property. The loaded glTF model will automatically add a default AnimatorController.

```typescript
animator.animatorController = new AnimatorController()；
```

### Play the specified AnimatorState

<playground src="skeleton-animation-play.ts"></playground>

You can use the [play](${api}core/Animator#play) method to play the specified AnimatorState. The parameter is the `name` of AnimatorState, and the description of other parameters is detailed in [API document](${api}core/Animator#play).

```typescript
animator.play("run");
```

If you need to start playing at a certain time in the animation, you can do the following.

```typescript
const layerIndex = 0;
// normalized time
const normalizedTimeOffset = 0.5;
animator.play("run", layerIndex, normalizedTimeOffset);
```

### Get the playing AnimatorState

You can use the [getCurrentAnimatorState](${api}core/Animator#getCurrentAnimatorState) method to get the AnimatorState currently playing. The parameter is the layer index `layerIndex` of the AnimatorState, see [API document](${api}core/Animator#getCurrentAnimatorState) for detail,then you can set the properties of the AnimationState, such as changing the default loop playback to one time.

```typescript
const currentState = animator.getCurrentAnimatorState(0);
// play once
currentState.wrapMode = WrapMode.Once;
// play loop
currentState.wrapMode = WrapMode.Loop;
```

### Get the AnimatorState by name

You can use the [findAnimatorState](${api}core/Animator#findAnimatorState) method to obtain the AnimatorState with the specified name. See [API](${api}core/Animator#getCurrentAnimatorState). Properties that can be used to set the AnimatorState, such as changing the default loop to play once.

```typescript
const state = animator.findAnimatorState('xxx');

// play once
state.wrapMode = WrapMode.Once;
// play loop
state.wrapMode = WrapMode.Loop;
```

### CrossFade

<playground src="skeleton-animation-crossfade.ts"></playground>

You can use the [crossFade](${api}core/Animator#crossFade) method to make the character transition to a specified state. The first parameter is the `name` of the animation state to be transitioned to, and the second parameter is the normalized animation transition time. For the description of other parameters, please refer to [API document](${api}core/Animator#crossFade).

### Add events to animation

<playground src="animation-event.ts"></playground>

You can use [AnimationEvent](${api}core/AnimationEvent) to add events to AnimationClip. The animation event will call the specified callback function of the component you bind to the same entity at the specified time.

```typescript
const event = new AnimationEvent();
event.functionName = "test";
event.time = 0.5;
clip.addEvent(event);
```

### Custom AnimationClip

<playground src="animation-customAnimationClip.ts"></playground>

You can create your own [AnimationClip](${api}core/AnimationClip) and bind [AnimationCurve](${api}core/AnimationCurve) to it by use [addCurveBinding](${api}core/AnimationClip#addCurveBinding).

```typescript
//custom rotate clip
const rotateClip = new AnimationClip('rotate');
const rotateState = animator.animatorController.layers[0].stateMachine.addState('rotate');
rotateState.clip = rotateClip;

const rotateCurve = new AnimationVector3Curve();
const key1 = new Keyframe<Vector3>();
key1.time = 0;
key1.value = new Vector3(0,0,0);
const key2 = new Keyframe<Vector3>();
key2.time = 10;
key2.value = new Vector3(0,360,0);
rotateCurve.addKey(key1);
rotateCurve.addKey(key2);
rotateClip.addCurveBinding('', Transform, "rotation", rotateCurve);

//custom color clip
const colorClip = new AnimationClip('color');
const colorState = animator.animatorController.layers[0].stateMachine.addState('color');
colorState.clip = colorClip;

const colorCurve = new AnimationFloatCurve();
const key1 = new Keyframe<number>();
key1.time = 0;
key1.value = 0;
const key2 = new Keyframe<number>();
key2.time = 10;
key2.value = 1;
colorCurve.addKey(key1);
colorCurve.addKey(key2);
colorClip.addCurveBinding('/light', DirectLight, "color.r", colorCurve);
```
Note: As in the second example above, you can also bind the AnimationCurve to then child entity `/light`, and the third parameter of `addCurveBinding` is not limited to component properties, it is a path that can index to the value.


## Use AnimationStateMachine to control animation

Before further introducing the usage method, let's briefly introduce the composition of the animation system for understanding. The composition of the animation system is as follows:

### Composition of animation system

![image-20210830233452874](https://gw.alipayobjects.com/zos/OasisHub/b973418a-cca7-46c9-9298-a54e7d445f70/image-20210830233452874.png)

#### [Animator](${api}core/Animator)
Used to control the playback of animations. The Animator component reads the AnimatorController as animation data. Set the variables in this Animator via AnimatorControllerParameter.

#### [AnimatorController](${api}core/AnimatorController)
Used to store animation data for Animator components. An AnimatorController contains multiple AnimatorControllerLayer for layered playback or animation additive.

#### AnimatorControllerParameter（In development）
Parameters used in Animator that allow the user to control the switching of animation states by changing the parameters in the script.

#### [AnimatorControllerLayer](${api}core/AnimatorControllerLayer)
Stores the animation state machine data, blend mode, and blend weights for this layer. When multiple AnimatorControllerLayer are playing at the same time, the effect of animation additive can be achieved by setting `blendingMode = AnimatorLayerBlendingMode.Additive`.

#### [AnimatorStateMachine](${api}core/AnimatorStateMachine)
There is an AnimatorStateMachine in each AnimatorControllerLayer, which is used to control the playback of AnimatorState and the switching and cross fade between states.

#### [BlendingMode](${api}core/AnimatorControllerLayer#blendingMode)
The blending mode of the animation layer, the default is `AnimatorLayerBlendingMode.Override`, which is overlay mode. You can achieve the effect of animation additive by setting the next layer to `AnimatorLayerBlendingMode.Additive`.

#### [AnimatorState](${api}core/AnimatorState)
AnimatorState is the basic component of AnimatorStateMachine. You can control the speed of AnimationClip, whether to loop, start and end time. Each AnimatorState needs to bind an AnimationClip, and when in this state, the AnimationClip will be played.

#### [AnimatorTransition](${api}core/AnimatorTransition)
AnimatorTransition defines when and how a state machine transitions from one state to another. It can be used to set the transition start time `exitTime` of the two animation states, the start time `offset` of the target state and the transition duration `duration`.

#### [AnimationClip](${api}core/AnimationClip)
Which store keyframe-based animation data made by designers. An AnimationClip generally corresponds to a specific action of a model, and each AnimationClip contains multiple AnimationCurves.

#### [AnimationCurve](${api}core/AnimationCurve)
A model has multiple bones entity, and the animation keyframe data of the specified properties of each bone entity in the model animation is stored in AnimationCurve. An AnimationCurve contains multiple Keyframe or keyframe data.

#### [AnimationEvent](${api}core/AnimationEvent)
AnimationEvent allows you to call the callback function of the script bound to the same entity at a specified time.

#### [Keyframe](${api}core/KeyFrame)
Stores animation keyframe data, which specifies what the value of the property of the time entity should be.

#### [Interpolation](${api}core/AnimationCurve#interpolation)
How keyframe in the AnimationCurve are interpolated. That is, when the time is between two Keyframe, how should the value of the property be calculated.

### Use AnimatorTransition for animation crossFade
You can realize the crossFade between AnimationStates by adding AnimatorTransition to AnimatorState.

```typescript
const walkState = animatorStateMachine.addState('walk');
walkState.clip = walkClip;
const runState = animatorStateMachine.addState('run');
runState.clip = runClip;
const transition = new AnimatorStateTransition();
transition.duration = 1;
transition.offset = 0;
transition.exitTime = 0.5;
transition.destinationState = runState;
walkState.addTransition(runState);
animator.play("walk");
```
In this way, every time you play the `walk` animation on the layer where the animation state machine is located, you will start to crossFade to the `run` animation halfway through the playback.

### Animation additive

<playground src="skeleton-animation-additive.ts"></playground>

Animation additive is the effect achieved by blending between AnimatorControllerLayers. The first layer is the basic animation layer. Modifying its weight and blending mode will not take effect. Add the AnimationState you want to make additive, add it to other layers and set its blending mode to `AnimatorLayerBlendingMode.Additive` to achieve the animation additive effect. The Galacean Engine supports multi-layer animation additive.

### Default play

You can set the AnimatorStateMachine's [defaultState](${api}core/AnimatorStateMachine#defaultState) to play the animation by default. This allows you to default to play without calling the `play` method when animator be set 'enabled=true'.

```typescript
const layers = animator.animatorController.layers;
layers[0].stateMachine.defaultState = animator.findAnimatorState('walk');
layers[1].stateMachine.defaultState = animator.findAnimatorState('sad_pose');
layers[1].blendingMode = AnimatorLayerBlendingMode.Additive;
```

### StateMachineScript

<playground src="animation-stateMachineScript.ts"></playground>

The StateMachineScript provides users with the life cycle hook function of the AnimatorState to write their own game logic code. Users can use the script by inheriting the [StateMachineScript](${api}core/StateMachineScript) class.

The script provides three AnimatorState cycles:

- `onStateEnter`: Call back when the AnimatorState starts to play.
- `onStateUpdate`: Call back when the AnimatorState is updated.
- `onStateExit`: callback when the AnimatorState ends.


```typescript
class theScript extends StateMachineScript {
  // onStateEnter is called when a transition starts and the state machine starts to evaluate this state
  onStateEnter(animator: Animator, stateInfo: any, layerIndex: number) {
    console.log('onStateEnter', animator, stateInfo, layerIndex);
  }

  // onStateUpdate is called on each Update frame between onStateEnter and onStateExit callbacks
  onStateUpdate(animator: Animator, stateInfo: any, layerIndex: number) {
    console.log('onStateUpdate', animator, stateInfo, layerIndex);
  }

  // onStateExit is called when a transition ends and the state machine finishes evaluating this state
  onStateExit(animator: Animator, stateInfo: any, layerIndex: number) {
    console.log('onStateExit', animator, stateInfo, layerIndex);
  }
}

animatorState.addStateMachineScript(theScript)
```

You can also write like this if you don't need to reuse your script:

```typescript
state.addStateMachineScript(
  class extends StateMachineScript {
    onStateEnter(
      animator: Animator,
      animatorState: AnimatorState,
      layerIndex: number
    ): void {
      console.log("onStateEnter: ", animatorState);
    }
  }
);
```
### Animation data reuse

Sometimes the animation data of the model is stored in other models , you can use it in the following way:

<playground src="skeleton-animation-reuse.ts"></playground>

In addition to this, there is another way, Animator's [AnimatorController](${api}core/AnimatorController) is a data storage class, it does not contain runtime data, based on this design, as long as the model's  **  hierarchy and naming of the skeleton nodes are the same**, we can reuse the animation data.

```typescript
const animator = model1.getComponent(Animator);
animator.animatorController = model2.getComponent(Animator).animatorController;
```

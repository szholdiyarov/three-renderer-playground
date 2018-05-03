import ExpoGraphics from 'expo-graphics'; // 0.0.1
import ExpoTHREE, { THREE } from 'expo-three'; // LATEST
import React from 'react';
import { PixelRatio, Platform } from 'react-native';

export default class HomeScreen extends React.Component {
  render() {
    return (
      <ExpoGraphics.View
        style={{ flex: 1 }}
        onContextCreate={this.onContextCreate}
        onRender={this.onRender}
        onResize={this.onResize}
        onShouldReloadContext={this.onShouldReloadContext}
      />
    );
  }

  componentWillMount() {
    THREE.suppressExpoWarnings(true);
  }
  componentWillUnmount() {
    THREE.suppressExpoWarnings(false);
  }

  onShouldReloadContext = () => {
    /// The Android OS loses gl context on background, so we should reload it.
    return Platform.OS === 'android';
  };

  onContextCreate = async ({ gl, canvas, width, height, scale }) => {
    console.log('onContextCreate');

    // renderer
    this.renderer = ExpoTHREE.renderer({ gl, canvas });
    this.renderer.capabilities.maxVertexUniforms = 52502;
    this.renderer.setPixelRatio(scale);
    this.renderer.setSize(width / scale, height / scale);
    this.renderer.setClearColor(0x000000, 1.0);

    /// Standard Camera
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 10000);
    this.camera.position.set(0, 6, 12);
    this.camera.lookAt(0, 0, 0);
    console.log('camera is ', this.camera);
    this.setupScene();
    await this.loadModelsAsync();
  };

  setupScene = () => {
    console.log('setupScene');
    // scene
    this.scene = new THREE.Scene();

    // Standard Background
    this.scene.background = new THREE.Color(0x999999);
    this.scene.fog = new THREE.FogExp2(0xcccccc, 0.002);

    this.scene.add(new THREE.GridHelper(50, 50, 0xffffff, 0x555555));

    this.setupLights();
  };

  setupLights = () => {
    console.log('setupLights');
    // lights
    const directionalLightA = new THREE.DirectionalLight(0xffffff);
    directionalLightA.position.set(1, 1, 1);
    this.scene.add(directionalLightA);

    const directionalLightB = new THREE.DirectionalLight(0xffeedd);
    directionalLightB.position.set(-1, -1, -1);
    this.scene.add(directionalLightB);

    const ambientLight = new THREE.AmbientLight(0x222222);
    this.scene.add(ambientLight);
  };

  /// Magic happens here!
  loadModelsAsync = async () => {
    console.log('started to load models async');
    /// Get all the files in the mesh
    const model = {
      'thomas.obj': require('../thomas/thomas.obj'),
      'thomas.mtl': require('../thomas/thomas.mtl'),
      'thomas.png': require('../thomas/thomas.png'),
    };
    console.log('the model is ', model);
    /// Load model!
    const mesh = await ExpoTHREE.loadAsync(
      [model['thomas.obj'], model['thomas.mtl']],
      null,
      name => model[name],
    );
    console.log('the mesh is ', mesh);

    /// Update size and position
    ExpoTHREE.utils.scaleLongestSideToSize(mesh, 5);
    ExpoTHREE.utils.alignMesh(mesh, { y: 1 });
    /// Smooth mesh
    // ExpoTHREE.utils.computeMeshNormals(mesh);

    /// Add the mesh to the scene
    this.scene.add(mesh);

    /// Save it so we can rotate
    this.mesh = mesh;
    console.log(model);
  };

  onResize = ({ width, height }) => {
    const scale = PixelRatio.get();
    console.log('width ', width, ', height ', height, ', camera ', this.camera);

    if (!this.camera) {
      this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 10000);
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer && this.renderer.setPixelRatio(scale);
    this.renderer && this.renderer.setSize(width, height);
  };

  onRender = delta => {
    console.log('on render');
    this.mesh.rotation.y += 0.4 * delta;
    this.renderer.render(this.scene, this.camera);
  };
}

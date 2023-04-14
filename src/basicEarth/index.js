import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { convertLatLngToPos, getGradientCanvas } from './utils';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
// import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass';
import dat from 'dat.gui';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

import './style.css';

// 구체 텍스쳐: https://www.solarsystemscope.com/textures/
// 배경 이미지: https://polyhaven.com/
// hdri 파일 변환: https://matheowis.github.io/HDRI-to-CubeMap/

const canvasSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};

export default function init() {
  const clock = new THREE.Clock();

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
  });
  renderer.outputEncoding = THREE.sRGBEncoding;
  const renderTarget = new THREE.WebGLRenderTarget(
    canvasSize.width,
    canvasSize.height,
    { samples: 2 },
  );

  const effectComposer = new EffectComposer(renderer, renderTarget);
  const textureLoader = new THREE.TextureLoader(); // 구체 텍스쳐 로더
  const cubeTextureLoader = new THREE.CubeTextureLoader(); // cube형식 배경화면 로더
  const environmentMap = cubeTextureLoader.load([
    'assets/basicEarth/environments/px.png',
    'assets/basicEarth/environments/nx.png',
    'assets/basicEarth/environments/py.png',
    'assets/basicEarth/environments/ny.png',
    'assets/basicEarth/environments/pz.png',
    'assets/basicEarth/environments/nz.png',
  ]);
  environmentMap.encoding = THREE.sRGBEncoding;

  const container = document.querySelector('#app');
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = environmentMap;
  scene.environment = environmentMap;

  const camera = new THREE.PerspectiveCamera(
    80,
    canvasSize.width / canvasSize.height,
    0.1,
    100,
  );
  camera.position.set(0, 0, 3);

  const controls = new OrbitControls(camera, renderer.domElement); // 마우스 드래그 컨트롤
  controls.enableDamping = true; // undrag시 부드럽게 멈추기 (damping)
  controls.dampingFactor = 0.1;

  const gui = new dat.GUI();
  gui.hide();

  const addLight = () => {
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(2.65, 2.13, 1.02);

    scene.add(light);
  };

  const addPostEffects = (/*obj*/) => {
    // const { earthGroup } = obj;

    const renderPass = new RenderPass(scene, camera);
    effectComposer.addPass(renderPass);

    // const filmPass = new FilmPass(1, 1, 4000, false);
    // effectComposer.addPass(filmPass);

    const shaderPass = new ShaderPass(GammaCorrectionShader);
    // vertexShader: 영역, fragment: 픽셀별
    const customShaderPass = new ShaderPass({
      uniforms: {
        uBrightness: { value: 0.3 },
        uPosition: { value: new THREE.Vector2(0, 0) },
        uColor: { value: new THREE.Vector3(0, 0, 0.15) },
        uAlpha: { value: 0.5 },
        tDiffuse: { value: null },
      },
      vertexShader,
      fragmentShader,
    });

    // gui.add(customShaderPass.uniforms.uPosition.value, 'x', -1, 1, 0.01);
    // gui.add(customShaderPass.uniforms.uPosition.value, 'y', -1, 1, 0.01);
    // gui
    //   .add(customShaderPass.uniforms.uBrightness, 'value', 0, 1, 0.01)
    //   .name('brightness');

    effectComposer.addPass(customShaderPass);

    const unrealBloomPass = new UnrealBloomPass(
      new THREE.Vector2(canvasSize.width, canvasSize.height),
    );
    unrealBloomPass.strength = 0.4;
    unrealBloomPass.threshold = 0.7;
    unrealBloomPass.radius = 0.7;
    effectComposer.addPass(unrealBloomPass);
    effectComposer.addPass(shaderPass);

    const smaaPass = new SMAAPass();
    effectComposer.addPass(smaaPass);
  };

  const createPoint1 = () => {
    const point = {
      lat: 37.56668 * (Math.PI / 180),
      lng: 126.97841 * (Math.PI / 180),
    };

    const position = convertLatLngToPos(point, 1.3);

    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.02, 0.002, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0x263d64, transparent: true }),
    );

    mesh.position.set(position.x, position.y, position.z);
    mesh.rotation.set(0.9, 2.46, 1);

    return mesh;
  };

  const createPoint2 = () => {
    const point = {
      lat: 5.55363 * (Math.PI / 100),
      lng: -0.0196481 * (Math.PI / 100),
    };

    const position = convertLatLngToPos(point, 1.3);

    const mesh = new THREE.Mesh(
      new THREE.TorusGeometry(0.02, 0.002, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0x263d64, transparent: true }),
    );

    mesh.position.set(position.x, position.y, position.z);
    mesh.rotation.set(-0.15, 0, 0);

    return mesh;
  };

  const createStar = (count = 500) => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i] = (Math.random() - 0.5) * 5; // -3 ~ 3
      positions[i + 1] = (Math.random() - 0.5) * 5;
      positions[i + 2] = (Math.random() - 0.5) * 5;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3),
    );

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.01,
      transparent: true,
      depthWrite: false, // 텍스쳐가 겹쳐도 투과되도록
      map: textureLoader.load('assets/basicEarth/particle.png'),
      alphaMap: textureLoader.load('assets/basicEarth/particle.png'), // png 검은배경 제거
      color: 0xbcc6c6,
    });

    const star = new THREE.Points(particleGeometry, particleMaterial);

    return star;
  };

  const createEarth = () => {
    // StandardMaterial은 조명이 필요함
    const material = new THREE.MeshStandardMaterial({
      map: textureLoader.load('assets/basicEarth/earth-night-map.jpg'),
      opacity: 0.9,
      roughness: 0.7, // 거칠질감
      metalness: 0, // 금속질감
      transparent: true,
    });

    const geometry = new THREE.SphereGeometry(1.3, 30, 30);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.y = -Math.PI / 2;

    return mesh;
  };

  const createCurve = (pos1, pos2) => {
    const points = [];
    for (let i = 0; i <= 100; i++) {
      // pos1, pos2 두 좌표사이의 i/100 위치의 벡터를 생성
      const pos = new THREE.Vector3().lerpVectors(pos1, pos2, i / 100);
      pos.normalize(); // 1미만의 값으로 정규화

      const wave = Math.sin((Math.PI * i) / 100);

      pos.multiplyScalar(1.3 + 0.4 * wave); // n배

      points.push(pos);
    }
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, 20, 0.003);

    const gradientCanvas = getGradientCanvas('#757F94', '#263D74');
    const texture = new THREE.CanvasTexture(gradientCanvas);

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  };

  const create = () => {
    const earthGroup = new THREE.Group();

    const earth = createEarth();
    const star = createStar();
    const point1 = createPoint1();
    const point2 = createPoint2();
    const curve = createCurve(point1.position, point2.position);

    earthGroup.add(earth, point1, point2, curve);

    scene.add(earthGroup, star);

    return { earthGroup, point1, point2, curve, star };
  };

  const resize = () => {
    canvasSize.width = window.innerWidth;
    canvasSize.height = window.innerHeight;

    camera.aspect = canvasSize.width / canvasSize.height;
    camera.updateProjectionMatrix();

    renderer.setSize(canvasSize.width, canvasSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    effectComposer.setSize(canvasSize.width, canvasSize.height);
  };

  const addEvent = () => {
    window.addEventListener('resize', resize);
  };

  const draw = (obj) => {
    const { earthGroup, point1, point2, curve, star } = obj;

    // 회전
    earthGroup.rotation.x += 0.0005;
    earthGroup.rotation.y += 0.0005;

    star.rotation.x += 0.001;
    star.rotation.y += 0.001;

    controls.update();
    effectComposer.render();

    const timeElampsed = clock.getElapsedTime();

    let drawRangeCount = curve.geometry.drawRange.count;
    const progress = timeElampsed / 2.5;
    const speed = 3;

    drawRangeCount = progress * speed * 960;

    curve.geometry.setDrawRange(0, drawRangeCount);

    if (timeElampsed > 4) {
      point1.material.opacity = 5 - timeElampsed;
      point2.material.opacity = 5 - timeElampsed;
      curve.material.opacity = 5 - timeElampsed;
    }

    // renderer.render(scene, camera);
    requestAnimationFrame(() => {
      draw(obj);
    });
  };

  const initialize = () => {
    const obj = create();

    addLight();
    addPostEffects(obj);
    addEvent();
    resize();
    draw(obj);
  };

  initialize();
}

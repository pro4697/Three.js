import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// 구체 텍스쳐: https://www.solarsystemscope.com/textures/
// 배경 이미지: https://polyhaven.com/
// hdri 파일 변환: https://matheowis.github.io/HDRI-to-CubeMap/

window.addEventListener('load', () => {
  init();
});

const canvasSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};

function init() {
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setSize(canvasSize.width, canvasSize.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const container = document.querySelector('#app');
  container.appendChild(renderer.domElement);

  // 구체 텍스쳐 로더
  const textureLoader = new THREE.TextureLoader();

  // cube형식 배경화면 로더
  const cubeTextureLoader = new THREE.CubeTextureLoader();
  const environmentMap = cubeTextureLoader.load([
    'assets/environments/px.png',
    'assets/environments/nx.png',
    'assets/environments/py.png',
    'assets/environments/nx.png',
    'assets/environments/pz.png',
    'assets/environments/nx.png',
  ]);
  environmentMap.encoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  scene.background = environmentMap;
  scene.environment = environmentMap;

  const camera = new THREE.PerspectiveCamera(
    75,
    canvasSize.width / canvasSize.height,
    0.1,
    100,
  );
  camera.position.set(0, 0, 3);

  // 마우스 드래그 컨트롤
  const controls = new OrbitControls(camera, renderer.domElement);

  // undrag시 부드럽게 멈추기 (damping)
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;

  const addLight = () => {
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(2.65, 2.13, 1.02);

    scene.add(light);
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
      size: 0.002,
      transparent: true,
      depthWrite: false, // 텍스쳐가 겹쳐도 투과되도록
      map: textureLoader.load('assets/particle.png'),
      alphaMap: textureLoader.load('assets/particle.png'), // png 검은배경 제거
      color: 0xbcc6c6,
    });

    const star = new THREE.Points(particleGeometry, particleMaterial);

    return star;
  };

  // 테스트 object
  const createEarth = () => {
    // StandardMaterial은 조명이 필요함
    const material = new THREE.MeshStandardMaterial({
      map: textureLoader.load('assets/earth-night-map.jpg'),
      roughness: 0.7, // 거칠질감
      metalness: 0, // 금속질감
    });

    const geometry = new THREE.SphereGeometry(1.3, 30, 30);
    const mesh = new THREE.Mesh(geometry, material);

    return mesh;
  };

  const create = () => {
    const earth = createEarth();
    const star = createStar();

    scene.add(earth, star);

    return { earth, star };
  };

  const resize = () => {
    canvasSize.width = window.innerWidth;
    canvasSize.height = window.innerHeight;

    camera.aspect = canvasSize.width / canvasSize.height;
    camera.updateProjectionMatrix();

    renderer.setSize(canvasSize.width, canvasSize.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };

  const addEvent = () => {
    window.addEventListener('resize', resize);
  };

  const draw = (obj) => {
    const { earth, star } = obj;

    // 회전
    earth.rotation.x += 0.0005;
    earth.rotation.y += 0.0005;

    star.rotation.x += 0.001;
    star.rotation.y += 0.001;

    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(() => {
      draw(obj);
    });
  };

  const initialize = () => {
    addLight();
    const obj = create();
    addEvent();
    resize();
    draw(obj);
  };

  initialize();
}

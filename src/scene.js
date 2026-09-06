import * as THREE from 'three';
import { createParticles } from './particles.js';
import { createPen } from './pen.js';

function makeCanvasWoodTex() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  // base gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#4a2f1b');
  grad.addColorStop(1, '#2b1a11');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  // add streaks for wood grain
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 1600; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 1 + Math.random() * 2;
    ctx.fillStyle = `rgba(0,0,0,${0.02 + Math.random() * 0.06})`;
    ctx.fillRect(x, y, w, 1 + Math.random() * 2);
  }
  // subtle noise overlay
  const image = ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = (Math.random() - 0.5) * 6;
    image.data[i] = Math.max(0, Math.min(255, image.data[i] + v));
    image.data[i+1] = Math.max(0, Math.min(255, image.data[i+1] + v));
    image.data[i+2] = Math.max(0, Math.min(255, image.data[i+2] + v));
  }
  ctx.putImageData(image, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

function makeParticleSprite() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size/2, cy = size/2, r = size/2 - 2;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, 'rgba(255, 222, 139, 0.95)');
  grad.addColorStop(0.5, 'rgba(255, 200, 120, 0.5)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,size,size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearMipMapLinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export async function initScene({ container }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
  renderer.shadowMap.enabled = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.02);

  const camera = new THREE.PerspectiveCamera(50, 2, 0.1, 100);
  camera.position.set(0, 1.6, 3.8);

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const hemi = new THREE.HemisphereLight(0xffe9d6, 0x02050a, 0.35);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffcfa0, 1.2);
  sun.position.set(-3, 5, -2);
  sun.castShadow = true;
  sun.shadow.radius = 4;
  sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xffe6c8, 0.18);
  fill.position.set(2, 1, 2);
  scene.add(fill);

  const woodTex = makeCanvasWoodTex();
  const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.7, metalness: 0.0 });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), woodMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x2b2320, roughness: 0.9 });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(10, 4), wallMat);
  backWall.position.set(0, 2, -4.5);
  backWall.receiveShadow = true;
  scene.add(backWall);

  const deskGeom = new THREE.BoxGeometry(1.6, 0.08, 0.8);
  const desk = new THREE.Mesh(deskGeom, woodMat);
  desk.position.set(0, 0.8, -1.4);
  desk.castShadow = true;
  desk.receiveShadow = true;
  scene.add(desk);

  const bookMat = new THREE.MeshStandardMaterial({ color: 0x2b1f12, roughness: 0.6 });
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 0.24), bookMat);
  book.position.set(0, 0.88, -1.4);
  book.castShadow = true;
  scene.add(book);

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0,
    transmission: 1.0,
    transparent: true,
    opacity: 1.0,
    ior: 1.33
  });
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 24), glassMat);
  glass.position.set(0.35, 0.86, -1.25);
  glass.castShadow = true;
  scene.add(glass);

  const penObj = createPen();
  penObj.group.position.set(-0.28, 0.88, -1.3);
  scene.add(penObj.group);

  for (let i = 0; i < 8; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.3), bookMat);
    b.position.set(-1.6 + (i % 4) * 0.35, 1.3 - Math.floor(i / 4) * 0.1, -3.9);
    b.rotation.y = (Math.random() - 0.5) * 0.05;
    scene.add(b);
  }

  // create procedural particle sprite
  const sprite = makeParticleSprite();

  const particles = createParticles({ scene, origin: new THREE.Vector3(0, 0.92, -1.4), sprite });

  let t = 0;
  const clock = new THREE.Clock();

  let vignette = 0.6;

  let cameraMoving = false;
  let cameraMoveStart = 0;
  const cameraMoveDuration = 12.0;

  particles.onCall = () => {
    cameraMoving = true;
    cameraMoveStart = clock.getElapsedTime();
  };

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function onPointerDown(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = - ((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length) {
      const first = intersects[0].object;
      if (first.userData && first.userData.interactivePhrase) {
        console.log('Interactive phrase clicked — Sequence 01 complete (stopping here)');
        // stop further motion if desired
      }
    }
  }
  renderer.domElement.addEventListener('pointerdown', onPointerDown);

  let running = true;
  function animate() {
    if (!running) return;
    const dt = clock.getDelta();
    t += dt;

    const microX = Math.sin(t * 0.2) * 0.003 + Math.sin(t * 0.7) * 0.0012;
    const microY = Math.cos(t * 0.13) * 0.0018 + Math.sin(t * 0.4) * 0.0008;
    camera.position.x = microX;
    camera.position.y = 1.6 + microY;

    if (cameraMoving) {
      const elapsed = clock.getElapsedTime() - cameraMoveStart;
      const k = Math.min(1, elapsed / cameraMoveDuration);
      const ease = k < 0.5 ? 2 * k * k : -1 + (4 - 2 * k) * k;
      camera.position.z = 3.8 - (3.8 - 1.6) * ease;
      vignette = 0.6 * (1 - ease);
    }

    particles.update(dt, camera);
    penObj.update(dt);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  function start() {
    sun.intensity = 0.0;
    const rampStart = performance.now();
    function revealStep() {
      const now = performance.now();
      const elapsed = (now - rampStart) / 1000;
      if (elapsed < 4) {
        sun.intensity = 0.0;
      } else {
        const k = Math.min(1, (elapsed - 4) / 5);
        sun.intensity = 0.2 + 1.0 * k;
      }
      if (elapsed < 10) {
        requestAnimationFrame(revealStep);
      } else {
        particles.start();
      }
    }
    revealStep();
    animate();
  }

  return { start, stop: () => { running = false; } };
}

import * as THREE from 'three';

export function createParticles({ scene, origin, sprite }) {
  const group = new THREE.Group();
  scene.add(group);

  const PARTICLE_COUNT = 900; // tuned for mobile
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[3 * i] = origin.x + (Math.random() - 0.5) * 0.12;
    positions[3 * i + 1] = origin.y + (Math.random() - 0.5) * 0.12;
    positions[3 * i + 2] = origin.z + (Math.random() - 0.5) * 0.12;
    sizes[i] = 6 + Math.random() * 18;
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    map: sprite,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    color: new THREE.Color(0xffd78b)
  });

  const points = new THREE.Points(geometry, mat);
  points.frustumCulled = false;
  group.add(points);

  let running = false;
  let time = 0;
  const attractorA = origin.clone().add(new THREE.Vector3(0.03, 0.02, -0.015));
  const attractorB = origin.clone().add(new THREE.Vector3(-0.03, 0.02, 0.015));

  function start() {
    running = true;
  }

  function update(dt, camera) {
    if (!running) return;
    time += dt;
    const pos = geometry.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = 3 * i;
      const p = new THREE.Vector3(pos[ix], pos[ix + 1], pos[ix + 2]);

      const aOff = Math.sin(time * 0.6 + i * 0.01) * 0.025;
      const bOff = Math.cos(time * 0.5 + i * 0.012) * 0.02;
      const a = attractorA.clone().add(new THREE.Vector3(aOff, Math.sin(i * 0.1 + time) * 0.01, 0));
      const b = attractorB.clone().add(new THREE.Vector3(bOff, Math.cos(i * 0.07 + time) * 0.01, 0));

      const toA = a.clone().sub(p).multiplyScalar(0.02);
      const toB = b.clone().sub(p).multiplyScalar(0.02);
      const blend = 0.5 + 0.5 * Math.sin(time * 0.2 + i * 0.03);
      p.add(toA.multiplyScalar(blend)).add(toB.multiplyScalar(1 - blend));

      p.x += (Math.sin(time + i) * 0.0006);
      p.y += (Math.cos(time * 0.8 + i * 0.5) * 0.0004);

      const dirToCam = camera.position.clone().sub(p);
      const distToCam = dirToCam.length();
      if (distToCam < 0.6) {
        dirToCam.setLength(0.0008);
        p.add(dirToCam);
      } else {
        p.add(dirToCam.setLength(-0.0002));
      }

      pos[ix] = p.x;
      pos[ix + 1] = p.y;
      pos[ix + 2] = p.z;
    }
    geometry.attributes.position.needsUpdate = true;

    if (time > 1.2 && !createParticles._called) {
      createParticles._called = true;
      if (typeof createParticles._onCall === 'function') createParticles._onCall();
    }
  }

  createParticles._onCall = null;
  Object.defineProperty(createParticles, 'onCall', {
    set(fn) { createParticles._onCall = fn; }
  });

  return { start, update, group, set onCall(fn) { createParticles._onCall = fn; } };
}

import * as THREE from 'three';

export function createPen() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.18, 12), new THREE.MeshStandardMaterial({ color: 0x990000, roughness: 0.5 }));
  body.rotation.z = Math.PI / 2;
  body.position.set(0, 0, 0);
  group.add(body);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.005, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0x222222 }));
  tip.rotation.z = Math.PI / 2;
  tip.position.set(0.09, 0, 0);
  group.add(tip);

  let time = 0;
  let levitating = false;
  let inkPoints = [];
  let inkMesh = null;

  function update(dt) {
    time += dt;
    group.rotation.z = Math.sin(time * 0.8) * 0.02;
    if (time > 10 && !levitating) {
      levitating = true;
    }
    if (levitating) {
      const lift = Math.min(1, (time - 10) / 6);
      group.position.y = lift * 0.06;
      group.rotation.y = Math.sin(time * 0.7) * 0.08;
      if (lift > 0.6) {
        const tipWorld = new THREE.Vector3();
        tip.getWorldPosition(tipWorld);
        inkPoints.push(tipWorld.clone());
        if (inkPoints.length > 4) {
          if (inkMesh) group.remove(inkMesh);
          const curve = new THREE.CatmullRomCurve3(inkPoints);
          const tubeGeom = new THREE.TubeGeometry(curve, Math.max(4, inkPoints.length * 3), 0.006, 8, false);
          const mat = new THREE.MeshBasicMaterial({ color: 0xffd78b, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
          inkMesh = new THREE.Mesh(tubeGeom, mat);
          inkMesh.userData.interactivePhrase = true;
          group.add(inkMesh);
        }
      }
    }
  }

  return { group, update };
}

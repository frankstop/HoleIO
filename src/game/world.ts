import * as THREE from 'three';
import { BOT_COLORS, BOT_NAMES, PROP_DEFINITIONS, WORLD_SIZE, type PropDefinition, type PropKind } from './config';

export interface PropEntity {
  id: number;
  definition: PropDefinition;
  group: THREE.Group;
  start: THREE.Vector3;
  active: boolean;
  falling: boolean;
  fallTarget?: HoleEntity;
  velocityY: number;
  spin: THREE.Vector3;
  respawnAt: number;
}

export interface HoleEntity {
  id: number;
  name: string;
  group: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  score: number;
  radius: number;
  color: number;
  isPlayer: boolean;
  alive: boolean;
  invulnerableUntil: number;
  respawnAt: number;
  nextDecision: number;
  target?: THREE.Vector3;
}

const material = (color: number, roughness = 0.75, metalness = 0.05) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

function shadow(mesh: THREE.Object3D): void {
  mesh.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
}

function box(group: THREE.Group, size: [number, number, number], color: number, y = size[1] / 2, position: [number, number, number] = [0, y, 0]): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color));
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}

function cylinder(group: THREE.Group, radius: number, height: number, color: number, y = height / 2, segments = 10): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material(color));
  mesh.position.y = y;
  group.add(mesh);
  return mesh;
}

export function createPropMesh(kind: PropKind, color: number): THREE.Group {
  const group = new THREE.Group();
  switch (kind) {
    case 'can':
      cylinder(group, 0.13, 0.28, color, 0.14, 8);
      break;
    case 'cone': {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 8), material(color));
      cone.position.y = 0.36;
      group.add(cone);
      box(group, [0.62, 0.08, 0.62], 0x242c34, 0.04);
      break;
    }
    case 'hydrant':
      cylinder(group, 0.26, 0.72, color, 0.36, 10);
      cylinder(group, 0.38, 0.12, 0xb92f3d, 0.65, 10);
      break;
    case 'bench':
      box(group, [1.8, 0.16, 0.58], color, 0.68);
      box(group, [1.8, 0.75, 0.12], color, 0.86, [0, 0.86, 0.27]);
      box(group, [0.12, 0.7, 0.12], 0x24323a, 0.35, [-0.65, 0.35, 0]);
      box(group, [0.12, 0.7, 0.12], 0x24323a, 0.35, [0.65, 0.35, 0]);
      break;
    case 'tree': {
      cylinder(group, 0.28, 2.7, 0x6f4b2e, 1.35, 8);
      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.55, 0), material(color));
      crown.position.y = 3.25;
      group.add(crown);
      break;
    }
    case 'car':
      box(group, [3.6, 0.8, 1.65], color, 0.68);
      box(group, [1.9, 0.65, 1.48], 0xb7e5ef, 1.35, [-0.25, 1.35, 0]);
      for (const x of [-1.18, 1.18]) for (const z of [-0.88, 0.88]) cylinder(group, 0.32, 0.2, 0x1b232a, 0.34, 10).rotation.z = Math.PI / 2, group.children[group.children.length - 1].position.set(x, 0.34, z * 0.78);
      break;
    case 'bus':
      box(group, [8.2, 2.35, 2.6], color, 1.4);
      for (let x = -3; x <= 3; x += 1.5) box(group, [0.95, 0.72, 0.04], 0x9fe1ef, 1.75, [x, 1.75, 1.31]);
      break;
    case 'container':
      box(group, [6.8, 2.5, 2.7], color, 1.25);
      for (let x = -2.6; x < 3; x += 1) box(group, [0.05, 2.25, 2.74], 0xb53f3c, 1.25, [x, 1.25, 0]);
      break;
    case 'house': {
      box(group, [9, 5.4, 7.2], color, 2.7);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(6.2, 3.4, 4), material(0xb94f45));
      roof.position.y = 7.05;
      roof.rotation.y = Math.PI / 4;
      group.add(roof);
      box(group, [1.5, 2.6, 0.12], 0x33576b, 1.3, [0, 1.3, 3.66]);
      break;
    }
    case 'shop':
      box(group, [10.5, 4.2, 8.2], color, 2.1);
      box(group, [8.4, 1.8, 0.18], 0xaee7ed, 1.5, [0, 1.5, 4.18]);
      box(group, [11.2, 0.34, 8.8], 0xe9d59b, 4.32);
      break;
    case 'apartment':
      box(group, [13.5, 15, 10.2], color, 7.5);
      for (let y = 3; y < 14; y += 3.1) for (let x = -4.5; x <= 4.5; x += 3) box(group, [1.4, 1.25, 0.12], 0x9bd5e0, y, [x, y, 5.16]);
      break;
    case 'tower':
      box(group, [15, 38, 14], color, 19);
      for (let y = 3; y < 37; y += 3) {
        box(group, [15.08, 0.18, 14.08], 0xd3f4f6, y, [0, y, 0]);
      }
      break;
  }
  shadow(group);
  return group;
}

function addRoad(scene: THREE.Scene, x: number, z: number, width: number, depth: number): void {
  const road = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshStandardMaterial({ color: 0x33414b, roughness: 0.94 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(x, 0.025, z);
  road.receiveShadow = true;
  scene.add(road);
  const sidewalkMaterial = new THREE.MeshStandardMaterial({ color: 0xc8cbc1, roughness: 0.92 });
  if (width > depth) {
    for (const side of [-1, 1]) {
      const sidewalk = new THREE.Mesh(new THREE.PlaneGeometry(width, 1.5), sidewalkMaterial);
      sidewalk.rotation.x = -Math.PI / 2;
      sidewalk.position.set(x, 0.04, z + side * (depth / 2 + 0.76));
      sidewalk.receiveShadow = true;
      scene.add(sidewalk);
    }
  } else {
    for (const side of [-1, 1]) {
      const sidewalk = new THREE.Mesh(new THREE.PlaneGeometry(1.5, depth), sidewalkMaterial);
      sidewalk.rotation.x = -Math.PI / 2;
      sidewalk.position.set(x + side * (width / 2 + 0.76), 0.04, z);
      sidewalk.receiveShadow = true;
      scene.add(sidewalk);
    }
  }
  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xe7c956 });
  if (width > depth) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(width - 1, 0.15), lineMaterial);
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0.035, z);
    scene.add(line);
  } else {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.15, depth - 1), lineMaterial);
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0.035, z);
    scene.add(line);
  }
}

function addDistrictLabel(scene: THREE.Scene, text: string, position: THREE.Vector3): void {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(7,21,32,.82)';
  ctx.roundRect(2, 2, 508, 92, 18);
  ctx.fill();
  ctx.font = '700 34px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f7fbff';
  ctx.fillText(text, 256, 50);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthWrite: false }));
  sprite.position.copy(position);
  sprite.scale.set(18, 3.4, 1);
  scene.add(sprite);
}

export function createCity(scene: THREE.Scene): void {
  const water = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_SIZE + 56, WORLD_SIZE + 56), new THREE.MeshStandardMaterial({ color: 0x4fa9c8, roughness: 0.28, metalness: 0.12 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.6;
  scene.add(water);

  const districts = [
    { x: -60, z: 60, color: 0x6d914c },
    { x: 60, z: 60, color: 0xb6ad8d },
    { x: -60, z: -60, color: 0x7b817d },
    { x: 60, z: -60, color: 0x8f9694 },
  ];
  for (const district of districts) {
    const ground = new THREE.Mesh(new THREE.BoxGeometry(116, 1, 116), new THREE.MeshStandardMaterial({ color: district.color, roughness: 0.92 }));
    ground.position.set(district.x, -0.5, district.z);
    ground.receiveShadow = true;
    scene.add(ground);
  }

  [-60, 0, 60].forEach((z) => addRoad(scene, 0, z, WORLD_SIZE - 4, z === 0 ? 12 : 9));
  [-60, 0, 60].forEach((x) => addRoad(scene, x, 0, x === 0 ? 12 : 9, WORLD_SIZE - 4));

  const crosswalkMaterial = new THREE.MeshBasicMaterial({ color: 0xf4f0df });
  for (const offset of [-4.2, -2.8, -1.4, 0, 1.4, 2.8, 4.2]) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 4.6), crosswalkMaterial);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(offset, 0.055, 9.4);
    scene.add(stripe);
    const stripeVertical = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.7), crosswalkMaterial);
    stripeVertical.rotation.x = -Math.PI / 2;
    stripeVertical.position.set(9.4, 0.055, offset);
    scene.add(stripeVertical);
  }

  for (const x of [-112, 112]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(2, 1.1, WORLD_SIZE), material(0xe9e2ca));
    wall.position.set(x, 0.35, 0);
    scene.add(wall);
  }
  for (const z of [-112, 112]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(WORLD_SIZE, 1.1, 2), material(0xe9e2ca));
    wall.position.set(0, 0.35, z);
    scene.add(wall);
  }

  const pond = new THREE.Mesh(new THREE.CircleGeometry(17, 32), new THREE.MeshStandardMaterial({ color: 0x5eb5c5, roughness: 0.25, metalness: 0.1 }));
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(-72, 0.04, 70);
  scene.add(pond);

  addDistrictLabel(scene, 'RIVERDALE PARK', new THREE.Vector3(-86, 5, 108));
  addDistrictLabel(scene, 'HARBOR 7', new THREE.Vector3(-84, 5, -108));
  addDistrictLabel(scene, 'METRO CORE', new THREE.Vector3(78, 8, -108));
  addDistrictLabel(scene, 'SUNNYVALE', new THREE.Vector3(82, 5, 108));
}

function seeded(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function spawnProps(scene: THREE.Scene, seed = 7261): PropEntity[] {
  const random = seeded(seed);
  const props: PropEntity[] = [];
  const counts = [70, 40, 24, 18, 20, 18, 8, 10, 8, 5, 6, 4];
  let id = 0;
  PROP_DEFINITIONS.forEach((definition, defIndex) => {
    for (let i = 0; i < counts[defIndex]; i += 1) {
      let x = 0;
      let z = 0;
      const district = definition.tier <= 3 ? 0 : definition.tier <= 5 ? (random() < 0.5 ? 1 : 2) : 3;
      const centerX = district === 0 || district === 2 ? -58 : 58;
      const centerZ = district === 0 || district === 1 ? 58 : -58;
      do {
        x = centerX + (random() - 0.5) * 102;
        z = centerZ + (random() - 0.5) * 102;
      } while (Math.abs(x) < 8 || Math.abs(z) < 8 || (definition.tier > 4 && Math.hypot(x, z) < 34));
      const group = createPropMesh(definition.kind, definition.color + Math.floor((random() - 0.5) * 0x151515));
      group.position.set(x, 0, z);
      group.rotation.y = random() * Math.PI * 2;
      scene.add(group);
      props.push({ id: id++, definition, group, start: group.position.clone(), active: true, falling: false, velocityY: 0, spin: new THREE.Vector3(), respawnAt: 0 });
    }
  });
  return props;
}

export function createHole(scene: THREE.Scene, id: number, name: string, color: number, position: THREE.Vector3, isPlayer = false): HoleEntity {
  const group = new THREE.Group();
  const shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(1.24, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16, depthWrite: false }));
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.052;
  group.add(shadowDisc);
  const voidDisc = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: 0x000307 }));
  voidDisc.rotation.x = -Math.PI / 2;
  voidDisc.position.y = 0.063;
  group.add(voidDisc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.04, 0.105, 10, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.075;
  group.add(ring);
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.025, 6, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }));
  innerRing.rotation.x = Math.PI / 2;
  innerRing.position.y = 0.08;
  group.add(innerRing);
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 256;
  labelCanvas.height = 96;
  const labelContext = labelCanvas.getContext('2d')!;
  labelContext.font = '900 42px Arial';
  labelContext.textAlign = 'center';
  labelContext.textBaseline = 'middle';
  labelContext.lineWidth = 9;
  labelContext.strokeStyle = '#071520';
  labelContext.strokeText(isPlayer ? 'YOU' : name, 128, 48);
  labelContext.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
  labelContext.fillText(isPlayer ? 'YOU' : name, 128, 48);
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(labelCanvas), transparent: true, depthWrite: false }));
  label.position.set(0, 1.9, 0);
  label.scale.set(3.4, 1.28, 1);
  label.userData.isHoleLabel = true;
  group.add(label);
  group.position.copy(position);
  scene.add(group);
  return { id, name, group, position: group.position, velocity: new THREE.Vector3(), score: 0, radius: 1, color, isPlayer, alive: true, invulnerableUntil: 0, respawnAt: 0, nextDecision: 0 };
}

export function spawnBots(scene: THREE.Scene): HoleEntity[] {
  return BOT_NAMES.map((name, index) => {
    const angle = index / BOT_NAMES.length * Math.PI * 2;
    return createHole(scene, index + 1, name, BOT_COLORS[index], new THREE.Vector3(Math.cos(angle) * 33, 0, Math.sin(angle) * 33));
  });
}

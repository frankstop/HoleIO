import * as THREE from 'three';
import { GameAudio } from './audio';
import { MATCH_DURATION, TIERS, WORLD_SIZE, type GameMode } from './config';
import { InputController } from './input';
import { canEat, clampWorld, formatTime, radiusForScore, scoreAfterDeath, speedForRadius, tierForScore, tierProgress } from './logic';
import { createCity, createHole, spawnBots, spawnProps, type HoleEntity, type PropEntity } from './world';

export type GamePhase = 'menu' | 'countdown' | 'playing' | 'paused' | 'respawning' | 'results';

export interface GameSnapshot {
  phase: GamePhase;
  mode: GameMode;
  seconds: number;
  formattedTime: string;
  score: number;
  radius: number;
  tier: ReturnType<typeof tierForScore>;
  progress: number;
  rank: number;
  leaderboard: { name: string; score: number; isPlayer: boolean; color: string }[];
  radar: { x: number; z: number; radius: number; isPlayer: boolean; color: string }[];
  destroyed: number;
  totalProps: number;
}

export interface GameCallbacks {
  onSnapshot: (snapshot: GameSnapshot) => void;
  onPhase: (phase: GamePhase, payload?: unknown) => void;
  onToast: (message: string) => void;
}

export class SingularityGame {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly camera: THREE.PerspectiveCamera;
  private scene = new THREE.Scene();
  private readonly clock = new THREE.Clock();
  private input: InputController;
  private player?: HoleEntity;
  private bots: HoleEntity[] = [];
  private props: PropEntity[] = [];
  private phase: GamePhase = 'menu';
  private mode: GameMode = 'classic';
  private seconds = MATCH_DURATION;
  private countdown = 3;
  private elapsed = 0;
  private lastHudUpdate = 0;
  private destroyed = 0;
  private lastTier = 1;
  private respawnCount = 0;
  private timeScale = 1;
  private reducedMotion = false;
  private animationFrame = 0;
  private readonly audio = new GameAudio();
  private skin = { rim: '#2de7f0', accent: '#8bffff' };

  constructor(private readonly mount: HTMLElement, private readonly callbacks: GameCallbacks) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(mount.clientWidth, mount.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.setAttribute('aria-label', 'Project Singularity 3D city playfield');
    mount.appendChild(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(48, mount.clientWidth / mount.clientHeight, 0.1, 600);
    this.input = new InputController(this.renderer.domElement, () => this.togglePause());
    window.addEventListener('resize', this.resize);
    document.addEventListener('visibilitychange', this.visibilityPause);
    this.buildScene();
    this.animate();
  }

  private buildScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x91d5ec);
    this.scene.fog = new THREE.FogExp2(0xa8d7e6, 0.00235);
    const hemi = new THREE.HemisphereLight(0xeafaff, 0x5d6746, 2.15);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff1cf, 3.4);
    sun.position.set(-70, 110, 55);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -95;
    sun.shadow.camera.right = 95;
    sun.shadow.camera.top = 95;
    sun.shadow.camera.bottom = -95;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 260;
    this.scene.add(sun);
    createCity(this.scene);
    this.props = spawnProps(this.scene);
    this.player = createHole(this.scene, 0, 'YOU', Number.parseInt(this.skin.rim.slice(1), 16), new THREE.Vector3(-42, 0, 62), true);
    this.bots = [];
    this.camera.position.set(-42, 34, 90);
    this.camera.lookAt(this.player.position);
  }

  start(mode: GameMode, skin: { rim: string; accent: string }): void {
    this.audio.stopMusic();
    this.skin = skin;
    this.mode = mode;
    this.seconds = mode === 'classic' ? MATCH_DURATION : Number.POSITIVE_INFINITY;
    this.countdown = 3;
    this.elapsed = 0;
    this.destroyed = 0;
    this.lastTier = 1;
    this.respawnCount = 0;
    this.buildScene();
    if (mode === 'classic') this.bots = spawnBots(this.scene);
    if (mode === 'classic' && new URLSearchParams(window.location.search).has('showcase') && this.player) {
      this.player.score = 420;
      this.player.radius = radiusForScore(this.player.score);
      this.player.position.set(42, 0, 58);
      this.syncHoleScale(this.player);
      const showcaseScores = [1240, 890, 310, 275, 210, 145, 95];
      const showcasePositions = [
        [-44, -34], [76, 24], [10, 72], [-58, 40], [64, -48], [-78, -18], [90, 76],
      ];
      this.bots.forEach((bot, index) => {
        bot.score = showcaseScores[index];
        bot.radius = radiusForScore(bot.score);
        bot.position.set(showcasePositions[index][0], 0, showcasePositions[index][1]);
        this.syncHoleScale(bot);
      });
    }
    this.phase = 'countdown';
    this.callbacks.onPhase('countdown', { value: 3 });
    this.audio.countdown(3);
    this.audio.startMusic();
    this.clock.getDelta();
  }

  returnToMenu(): void {
    this.phase = 'menu';
    this.audio.stopMusic();
    this.callbacks.onPhase('menu');
  }

  togglePause(): void {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.callbacks.onPhase('paused');
    } else if (this.phase === 'paused') {
      this.phase = 'playing';
      this.callbacks.onPhase('playing');
      this.clock.getDelta();
    }
  }

  setMuted(value: boolean): void {
    this.audio.setMuted(value);
    if (!value && (this.phase === 'playing' || this.phase === 'countdown')) this.audio.startMusic();
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  setTimeScale(value: number): void {
    this.timeScale = Math.min(2, Math.max(0.5, value));
  }

  resetZen(): void {
    if (this.mode === 'zen') this.start('zen', this.skin);
  }

  private visibilityPause = (): void => {
    if (document.hidden && this.phase === 'playing') this.togglePause();
  };

  private resize = (): void => {
    const width = this.mount.clientWidth;
    const height = this.mount.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, width < 720 ? 1.25 : 1.75));
    this.renderer.setSize(width, height);
  };

  private animate = (): void => {
    this.animationFrame = requestAnimationFrame(this.animate);
    const rawDelta = Math.min(0.05, this.clock.getDelta());
    const delta = rawDelta * this.timeScale;
    if (this.phase === 'countdown') this.updateCountdown(delta);
    if (this.phase === 'playing' || this.phase === 'respawning') this.updateGame(delta);
    this.animateScene(rawDelta);
    this.renderer.render(this.scene, this.camera);
  };

  private updateCountdown(delta: number): void {
    const before = Math.ceil(this.countdown);
    this.countdown -= delta;
    const after = Math.ceil(this.countdown);
    if (after !== before && after > 0) {
      this.audio.countdown(after);
      this.callbacks.onPhase('countdown', { value: after });
    }
    if (this.countdown <= 0) {
      this.audio.countdown(0);
      this.phase = 'playing';
      this.callbacks.onPhase('playing');
    }
  }

  private updateGame(delta: number): void {
    if (!this.player) return;
    this.elapsed += delta;
    if (this.mode === 'classic') {
      this.seconds = Math.max(0, this.seconds - delta);
      if (this.seconds <= 10 && Math.ceil(this.seconds) !== Math.ceil(this.seconds + delta)) this.audio.countdown(Math.ceil(this.seconds));
      if (this.seconds <= 0) {
        this.finishMatch();
        return;
      }
    }
    this.updatePlayer(delta);
    this.updateBots(delta);
    this.updateProps(delta);
    this.updateCombat();
    this.updateRespawns();
    this.updateCamera(delta);
    if (this.elapsed - this.lastHudUpdate > 0.1) {
      this.lastHudUpdate = this.elapsed;
      this.callbacks.onSnapshot(this.snapshot());
    }
  }

  private updatePlayer(delta: number): void {
    if (!this.player || !this.player.alive) return;
    const direction = this.input.direction();
    const desired = new THREE.Vector3(direction.x, 0, direction.y).multiplyScalar(speedForRadius(this.player.radius));
    const damping = 1 - Math.exp(-8.5 * delta);
    this.player.velocity.lerp(desired, damping);
    this.moveHole(this.player, delta);
  }

  private moveHole(hole: HoleEntity, delta: number): void {
    hole.position.addScaledVector(hole.velocity, delta);
    hole.position.x = clampWorld(hole.position.x, hole.radius, WORLD_SIZE / 2 - 7);
    hole.position.z = clampWorld(hole.position.z, hole.radius, WORLD_SIZE / 2 - 7);
  }

  private updateBots(delta: number): void {
    const now = this.elapsed;
    const holes = [this.player!, ...this.bots].filter((hole) => hole.alive);
    for (const bot of this.bots) {
      if (!bot.alive) continue;
      if (now >= bot.nextDecision) {
        bot.nextDecision = now + 0.42 + Math.random() * 0.38;
        const threat = holes.find((hole) => hole !== bot && hole.radius >= bot.radius * 1.15 && hole.position.distanceTo(bot.position) < 20);
        if (threat) {
          const away = bot.position.clone().sub(threat.position).setY(0).normalize().multiplyScalar(30);
          bot.target = bot.position.clone().add(away);
        } else {
          const prey = holes.filter((hole) => hole !== bot && bot.radius >= hole.radius * 1.25 && hole.position.distanceTo(bot.position) < 30).sort((a, b) => a.position.distanceTo(bot.position) - b.position.distanceTo(bot.position))[0];
          if (prey && Math.random() > 0.35) bot.target = prey.position.clone();
          else {
            const targets = this.props.filter((prop) => prop.active && !prop.falling && canEat(bot.radius, prop.definition.radius));
            targets.sort((a, b) => (a.group.position.distanceTo(bot.position) / Math.max(1, a.definition.points)) - (b.group.position.distanceTo(bot.position) / Math.max(1, b.definition.points)));
            bot.target = targets[0]?.group.position.clone() ?? new THREE.Vector3((Math.random() - 0.5) * 190, 0, (Math.random() - 0.5) * 190);
          }
        }
      }
      const direction = bot.target?.clone().sub(bot.position).setY(0).normalize() ?? new THREE.Vector3();
      const desired = direction.multiplyScalar(speedForRadius(bot.radius) * (0.82 + bot.id * 0.018));
      bot.velocity.lerp(desired, 1 - Math.exp(-5.2 * delta));
      this.moveHole(bot, delta);
    }
  }

  private updateProps(delta: number): void {
    const holes = [this.player!, ...this.bots].filter((hole) => hole.alive);
    for (const prop of this.props) {
      if (!prop.active) {
        if (this.mode === 'classic' && this.elapsed >= prop.respawnAt) this.respawnProp(prop);
        continue;
      }
      if (!prop.falling) {
        for (const hole of holes) {
          const distance = Math.hypot(prop.group.position.x - hole.position.x, prop.group.position.z - hole.position.z);
          if (distance <= hole.radius * 1.08 && canEat(hole.radius, prop.definition.radius)) {
            prop.falling = true;
            prop.fallTarget = hole;
            prop.velocityY = -0.4;
            prop.spin.set((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 4);
            break;
          }
        }
      } else if (prop.fallTarget?.alive) {
        const target = prop.fallTarget;
        const pull = Math.min(1, delta * 4.8);
        prop.group.position.x = THREE.MathUtils.lerp(prop.group.position.x, target.position.x, pull);
        prop.group.position.z = THREE.MathUtils.lerp(prop.group.position.z, target.position.z, pull);
        prop.velocityY -= 28 * delta;
        prop.group.position.y += prop.velocityY * delta;
        if (!this.reducedMotion) {
          prop.group.rotation.x += prop.spin.x * delta;
          prop.group.rotation.y += prop.spin.y * delta;
          prop.group.rotation.z += prop.spin.z * delta;
        }
        const shrink = Math.max(0.18, 1 + prop.group.position.y / 8);
        prop.group.scale.setScalar(shrink);
        if (prop.group.position.y <= -6) this.consumeProp(prop, target);
      } else {
        this.respawnProp(prop);
      }
    }
  }

  private consumeProp(prop: PropEntity, hole: HoleEntity): void {
    prop.active = false;
    prop.falling = false;
    prop.group.visible = false;
    prop.respawnAt = this.elapsed + prop.definition.respawn;
    const previousTier = tierForScore(hole.score).id;
    hole.score += prop.definition.points;
    hole.radius = radiusForScore(hole.score);
    this.syncHoleScale(hole);
    if (hole.isPlayer) {
      this.destroyed += 1;
      this.audio.swallow(prop.definition.tier);
      const currentTier = tierForScore(hole.score).id;
      if (currentTier > previousTier) {
        this.lastTier = currentTier;
        this.audio.tierUp();
        this.callbacks.onToast(`TIER ${currentTier} — ${tierForScore(hole.score).name.toUpperCase()}`);
      }
    }
  }

  private respawnProp(prop: PropEntity): void {
    prop.active = true;
    prop.falling = false;
    prop.fallTarget = undefined;
    prop.group.visible = true;
    prop.group.position.copy(prop.start);
    prop.group.position.x += (Math.random() - 0.5) * 5;
    prop.group.position.z += (Math.random() - 0.5) * 5;
    prop.group.rotation.set(0, Math.random() * Math.PI * 2, 0);
    prop.group.scale.setScalar(1);
  }

  private syncHoleScale(hole: HoleEntity): void {
    hole.group.scale.setScalar(hole.radius);
    const label = hole.group.children.find((child) => child.userData.isHoleLabel);
    if (label) {
      label.scale.set(3.4 / hole.radius, 1.28 / hole.radius, 1 / hole.radius);
      label.position.y = 1.9 / hole.radius;
    }
  }

  private updateCombat(): void {
    if (this.mode !== 'classic') return;
    const holes = [this.player!, ...this.bots].filter((hole) => hole.alive);
    for (let i = 0; i < holes.length; i += 1) {
      for (let j = i + 1; j < holes.length; j += 1) {
        const a = holes[i];
        const b = holes[j];
        const distance = a.position.distanceTo(b.position);
        const predator = a.radius >= b.radius * 1.15 ? a : b.radius >= a.radius * 1.15 ? b : undefined;
        const prey = predator === a ? b : predator === b ? a : undefined;
        if (predator && prey && this.elapsed >= prey.invulnerableUntil && distance < predator.radius * 0.72) {
          this.devourHole(predator, prey);
        } else if (!predator && distance < (a.radius + b.radius) * 0.46) {
          const push = a.position.clone().sub(b.position).setY(0).normalize().multiplyScalar(0.55);
          a.position.add(push);
          b.position.sub(push);
        }
      }
    }
  }

  private devourHole(predator: HoleEntity, prey: HoleEntity): void {
    if (this.elapsed < prey.invulnerableUntil) return;
    const reward = Math.max(25, Math.floor(prey.score * 0.5));
    predator.score += reward;
    predator.radius = Math.min(14, Math.max(radiusForScore(predator.score), predator.radius + prey.radius * 0.15));
    this.syncHoleScale(predator);
    prey.alive = false;
    prey.group.visible = false;
    prey.respawnAt = this.elapsed + 4;
    this.callbacks.onToast(`${predator.name} DEVOURED ${prey.name}!  +${reward}`);
    if (predator.isPlayer) this.audio.victory();
    if (prey.isPlayer) {
      prey.score = scoreAfterDeath(prey.score);
      this.respawnCount += 1;
      this.audio.defeated();
      this.phase = 'respawning';
      this.callbacks.onPhase('respawning', { seconds: 4 });
    } else {
      prey.score = scoreAfterDeath(prey.score);
    }
  }

  private updateRespawns(): void {
    for (const hole of [this.player!, ...this.bots]) {
      if (!hole.alive && this.elapsed >= hole.respawnAt) {
        hole.alive = true;
        hole.group.visible = true;
        hole.radius = 1;
        hole.score = Math.max(0, hole.score);
        hole.position.set(-44 + Math.random() * 20, 0, 56 + Math.random() * 28);
        hole.invulnerableUntil = this.elapsed + 3.5;
        this.syncHoleScale(hole);
        if (hole.isPlayer) {
          this.phase = 'playing';
          this.callbacks.onPhase('playing');
          this.callbacks.onToast('GHOST SHIELD — 3.5 SECONDS');
        }
      }
    }
  }

  private updateCamera(delta: number): void {
    if (!this.player) return;
    const radius = this.player.radius;
    const distance = 14 + 6.5 * radius;
    const height = 18 + 7 * radius;
    const desired = new THREE.Vector3(this.player.position.x, height, this.player.position.z + distance);
    this.camera.position.lerp(desired, 1 - Math.exp(-6.5 * delta));
    this.camera.lookAt(this.player.position.x, 0, this.player.position.z - radius * 0.45);
  }

  private animateScene(delta: number): void {
    const time = performance.now() * 0.001;
    for (const hole of [this.player, ...this.bots]) {
      if (!hole?.alive) continue;
      const ring = hole.group.children[2] as THREE.Mesh;
      const inner = hole.group.children[3] as THREE.Mesh;
      if (!this.reducedMotion) {
        ring.rotation.z = time * (hole.isPlayer ? 0.65 : -0.4);
        inner.rotation.z = -time * 1.2;
        const pulse = 1 + Math.sin(time * 4 + hole.id) * 0.025;
        ring.scale.setScalar(pulse);
      }
      const invulnerable = this.elapsed < hole.invulnerableUntil;
      (ring.material as THREE.MeshBasicMaterial).opacity = invulnerable ? 0.35 + Math.sin(time * 10) * 0.25 : 0.95;
    }
  }

  private snapshot(): GameSnapshot {
    const player = this.player!;
    const sorted = [player, ...this.bots].sort((a, b) => b.score - a.score);
    return {
      phase: this.phase,
      mode: this.mode,
      seconds: this.seconds,
      formattedTime: this.mode === 'zen' ? '∞' : formatTime(this.seconds),
      score: player.score,
      radius: player.radius,
      tier: tierForScore(player.score),
      progress: tierProgress(player.score),
      rank: sorted.indexOf(player) + 1,
      leaderboard: sorted.slice(0, 5).map((hole) => ({ name: hole.name, score: hole.score, isPlayer: hole.isPlayer, color: `#${hole.color.toString(16).padStart(6, '0')}` })),
      radar: [player, ...this.bots].filter((hole) => hole.alive).map((hole) => ({ x: hole.position.x, z: hole.position.z, radius: hole.radius, isPlayer: hole.isPlayer, color: `#${hole.color.toString(16).padStart(6, '0')}` })),
      destroyed: this.destroyed,
      totalProps: this.props.length,
    };
  }

  private finishMatch(): void {
    this.phase = 'results';
    this.audio.stopMusic();
    const snapshot = this.snapshot();
    const previousBest = Number(localStorage.getItem('singularity-best') ?? 0);
    if (snapshot.score > previousBest) localStorage.setItem('singularity-best', String(snapshot.score));
    localStorage.setItem('singularity-level', String(Math.max(Number(localStorage.getItem('singularity-level') ?? 1), snapshot.tier.id)));
    this.callbacks.onSnapshot(snapshot);
    this.callbacks.onPhase('results', { snapshot, respawns: this.respawnCount, best: Math.max(previousBest, snapshot.score) });
    if (snapshot.rank === 1) this.audio.victory();
  }

  destroy(): void {
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.visibilityPause);
    this.input.destroy();
    this.renderer.dispose();
    this.mount.replaceChildren();
  }
}

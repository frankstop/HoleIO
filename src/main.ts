import './style.css';
import { SKINS, type GameMode } from './game/config';
import { SingularityGame, type GamePhase, type GameSnapshot } from './game/game';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <main class="app-shell" data-phase="menu">
    <section class="game-stage" id="game-stage" aria-label="3D game"></section>

    <section class="title-screen" id="title-screen" aria-labelledby="game-title">
      <div class="title-vignette"></div>
      <div class="title-content">
        <div class="brand-mark" aria-hidden="true"><span></span><span></span></div>
        <h1 id="game-title">PROJECT<br><strong>SINGULARITY</strong></h1>
        <p>Start small. Swallow the city. Become unstoppable.</p>
        <div class="mode-actions">
          <button class="primary-button" data-action="play" data-mode="classic"><span>PLAY CLASSIC</span><small>120 seconds · 7 rivals</small></button>
          <button class="secondary-button" data-action="play" data-mode="zen"><span>ZEN DEMOLITION</span><small>Endless · no rivals</small></button>
        </div>
        <div class="menu-footer">
          <button class="text-button" data-action="skins">CUSTOMIZE</button>
          <span class="best-score">BEST <strong id="best-score">0</strong></span>
          <button class="text-button" data-action="settings">SETTINGS</button>
        </div>
      </div>
      <div class="control-hint"><kbd>WASD</kbd><span>or move your pointer to steer</span></div>
    </section>

    <section class="hud" id="hud" aria-label="Match status">
      <div class="leaderboard glass-panel">
        <h2><span aria-hidden="true">♛</span> METRO MAYHEM</h2>
        <ol id="leaderboard"></ol>
      </div>
      <div class="timer" id="timer" aria-label="Time remaining">02:00</div>
      <div class="score-panel glass-panel">
        <span class="vortex-icon" aria-hidden="true"></span>
        <strong id="score">0</strong>
        <small id="tier-label">SCAVENGER</small>
      </div>
      <div class="kill-toast" id="toast" role="status" aria-live="polite"></div>
      <div class="radar-wrap glass-panel">
        <canvas id="radar" width="116" height="116" aria-label="Rival radar"></canvas>
      </div>
      <div class="progress-wrap glass-panel">
        <div class="progress-track"><span id="progress-fill"></span></div>
        <div><strong id="progress-tier">TIER 1</strong><span id="progress-label">NEXT: STREET DECOR</span></div>
      </div>
      <div class="hud-controls">
        <button class="round-button" data-action="pause" aria-label="Pause game">Ⅱ</button>
        <button class="round-button" data-action="mute" aria-label="Mute audio">♪</button>
      </div>
      <div class="zen-tools glass-panel" id="zen-tools">
        <button data-action="reset-zen">RESET CITY</button>
        <label>SPEED <input id="time-scale" type="range" min="0.5" max="2" step="0.25" value="1"></label>
        <span id="destroyed-label">0% DEMOLISHED</span>
      </div>
      <div class="joystick-hint" aria-hidden="true"><span></span></div>
    </section>

    <div class="center-message countdown" id="countdown" aria-live="assertive">3</div>
    <div class="center-message respawn" id="respawn"><span>VOID DISPERSED</span><strong>REFORMING…</strong></div>

    <section class="modal" id="pause-modal" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <div class="modal-card">
        <p class="modal-kicker">CITY FROZEN</p>
        <h2 id="pause-title">PAUSED</h2>
        <button class="primary-button" data-action="resume">RESUME</button>
        <button class="secondary-button" data-action="restart">RESTART MATCH</button>
        <button class="text-button" data-action="menu">EXIT TO TITLE</button>
      </div>
    </section>

    <section class="modal" id="results-modal" role="dialog" aria-modal="true" aria-labelledby="results-title">
      <div class="modal-card results-card">
        <p class="modal-kicker" id="result-kicker">MATCH COMPLETE</p>
        <h2 id="results-title">METRO MAYHEM</h2>
        <div class="podium-position" id="result-rank">#1</div>
        <div class="result-stats">
          <div><strong id="result-score">0</strong><span>SCORE</span></div>
          <div><strong id="result-tier">1</strong><span>TIER</span></div>
          <div><strong id="result-best">0</strong><span>BEST</span></div>
        </div>
        <button class="primary-button" data-action="replay">PLAY AGAIN</button>
        <button class="text-button" data-action="menu">BACK TO TITLE</button>
      </div>
    </section>

    <section class="drawer" id="skins-drawer" role="dialog" aria-modal="true" aria-labelledby="skins-title">
      <div class="drawer-card">
        <button class="close-button" data-action="close-drawers" aria-label="Close">×</button>
        <p class="modal-kicker">VOID SIGNATURE</p>
        <h2 id="skins-title">Choose your rim</h2>
        <div class="skin-grid" id="skin-grid"></div>
      </div>
    </section>

    <section class="drawer" id="settings-drawer" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div class="drawer-card settings-card">
        <button class="close-button" data-action="close-drawers" aria-label="Close">×</button>
        <p class="modal-kicker">GAME OPTIONS</p>
        <h2 id="settings-title">Settings</h2>
        <label class="setting-row"><span><strong>Sound</strong><small>Procedural music and effects</small></span><input id="sound-setting" type="checkbox" checked></label>
        <label class="setting-row"><span><strong>Reduced motion</strong><small>Limits pulses and tumbling</small></span><input id="motion-setting" type="checkbox"></label>
        <label class="setting-row"><span><strong>High contrast</strong><small>Strengthens HUD edges</small></span><input id="contrast-setting" type="checkbox"></label>
        <div class="controls-list"><strong>CONTROLS</strong><span>WASD / Arrow keys</span><span>Pointer follow</span><span>Touch drag</span><span>Gamepad stick</span><span>P / Esc to pause</span></div>
      </div>
    </section>
  </main>
`;

const shell = document.querySelector<HTMLElement>('.app-shell')!;
const titleScreen = document.querySelector<HTMLElement>('#title-screen')!;
const hud = document.querySelector<HTMLElement>('#hud')!;
const countdown = document.querySelector<HTMLElement>('#countdown')!;
const respawn = document.querySelector<HTMLElement>('#respawn')!;
const pauseModal = document.querySelector<HTMLElement>('#pause-modal')!;
const resultsModal = document.querySelector<HTMLElement>('#results-modal')!;
const skinsDrawer = document.querySelector<HTMLElement>('#skins-drawer')!;
const settingsDrawer = document.querySelector<HTMLElement>('#settings-drawer')!;
const toast = document.querySelector<HTMLElement>('#toast')!;
const radar = document.querySelector<HTMLCanvasElement>('#radar')!;
const radarContext = radar.getContext('2d')!;

const storedSkin = localStorage.getItem('singularity-skin') ?? 'classic';
let selectedSkin = SKINS.find((skin) => skin.id === storedSkin) ?? SKINS[0];
let activeMode: GameMode = 'classic';
let toastTimer = 0;

const game = new SingularityGame(document.querySelector<HTMLElement>('#game-stage')!, {
  onSnapshot: updateHud,
  onPhase: setPhase,
  onToast: showToast,
});

function setPhase(phase: GamePhase, payload?: unknown): void {
  shell.dataset.phase = phase;
  titleScreen.hidden = phase !== 'menu';
  hud.hidden = phase === 'menu' || phase === 'results';
  countdown.hidden = phase !== 'countdown';
  respawn.hidden = phase !== 'respawning';
  pauseModal.hidden = phase !== 'paused';
  resultsModal.hidden = phase !== 'results';
  if (phase === 'countdown') countdown.textContent = String((payload as { value?: number })?.value ?? 3);
  if (phase === 'results') updateResults((payload as { snapshot: GameSnapshot; best: number }).snapshot, (payload as { best: number }).best);
  if (phase === 'paused') pauseModal.querySelector<HTMLElement>('button')?.focus();
}

function updateHud(snapshot: GameSnapshot): void {
  document.querySelector('#timer')!.textContent = snapshot.formattedTime;
  document.querySelector('#timer')!.classList.toggle('urgent', snapshot.seconds <= 15);
  document.querySelector('#score')!.textContent = snapshot.score.toLocaleString();
  document.querySelector('#tier-label')!.textContent = snapshot.tier.shortName;
  document.querySelector('#progress-tier')!.textContent = `TIER ${snapshot.tier.id}`;
  document.querySelector('#progress-label')!.textContent = snapshot.tier.id === 8 ? 'MAXIMUM MASS' : `NEXT: ${snapshot.tier.nextLabel}`;
  (document.querySelector('#progress-fill') as HTMLElement).style.width = `${snapshot.progress * 100}%`;
  document.querySelector('#leaderboard')!.innerHTML = snapshot.leaderboard.map((entry, index) => `
    <li class="${entry.isPlayer ? 'is-player' : ''}"><span>${index + 1}</span><i style="--player-color:${entry.color}"></i><b>${entry.isPlayer ? 'YOU' : entry.name}</b><strong>${entry.score.toLocaleString()}</strong></li>
  `).join('');
  document.querySelector('#destroyed-label')!.textContent = `${Math.round(snapshot.destroyed / snapshot.totalProps * 100)}% DEMOLISHED`;
  document.querySelector('#zen-tools')!.toggleAttribute('hidden', snapshot.mode !== 'zen');
  drawRadar(snapshot);
}

function drawRadar(snapshot: GameSnapshot): void {
  const size = radar.width;
  radarContext.clearRect(0, 0, size, size);
  const gradient = radarContext.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(31,72,90,.72)');
  gradient.addColorStop(1, 'rgba(4,16,25,.92)');
  radarContext.fillStyle = gradient;
  radarContext.beginPath();
  radarContext.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
  radarContext.fill();
  radarContext.strokeStyle = 'rgba(104,219,231,.18)';
  [0.25, 0.47].forEach((factor) => {
    radarContext.beginPath();
    radarContext.arc(size / 2, size / 2, size * factor, 0, Math.PI * 2);
    radarContext.stroke();
  });
  snapshot.radar.forEach((entry) => {
    radarContext.fillStyle = entry.color;
    radarContext.shadowColor = entry.color;
    radarContext.shadowBlur = entry.isPlayer ? 10 : 5;
    radarContext.beginPath();
    radarContext.arc(size / 2 + entry.x / 240 * size, size / 2 + entry.z / 240 * size, entry.isPlayer ? 4.5 : Math.min(5, 2 + entry.radius * 0.18), 0, Math.PI * 2);
    radarContext.fill();
  });
  radarContext.shadowBlur = 0;
}

function updateResults(snapshot: GameSnapshot, best: number): void {
  document.querySelector('#result-kicker')!.textContent = snapshot.rank === 1 ? 'CITY CONQUERED' : 'MATCH COMPLETE';
  document.querySelector('#result-rank')!.textContent = `#${snapshot.rank}`;
  document.querySelector('#result-score')!.textContent = snapshot.score.toLocaleString();
  document.querySelector('#result-tier')!.textContent = String(snapshot.tier.id);
  document.querySelector('#result-best')!.textContent = best.toLocaleString();
  document.querySelector('#best-score')!.textContent = best.toLocaleString();
}

function showToast(message: string): void {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2500);
}

function startGame(mode: GameMode): void {
  activeMode = mode;
  closeDrawers();
  game.start(mode, selectedSkin);
}

function closeDrawers(): void {
  skinsDrawer.hidden = true;
  settingsDrawer.hidden = true;
}

function renderSkins(): void {
  const level = Number(localStorage.getItem('singularity-level') ?? 1);
  document.querySelector('#skin-grid')!.innerHTML = SKINS.map((skin) => {
    const locked = level < skin.unlock;
    return `<button class="skin-option ${skin.id === selectedSkin.id ? 'selected' : ''}" data-skin="${skin.id}" ${locked ? 'disabled' : ''} style="--rim:${skin.rim};--accent:${skin.accent}">
      <span class="skin-preview"><i></i></span><strong>${skin.name}</strong><small>${locked ? `REACH TIER ${skin.unlock}` : skin.id === selectedSkin.id ? 'EQUIPPED' : 'AVAILABLE'}</small>
    </button>`;
  }).join('');
}

document.addEventListener('click', (event) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action], [data-skin]');
  if (!target) return;
  if (target.dataset.skin) {
    const skin = SKINS.find((candidate) => candidate.id === target.dataset.skin);
    if (skin) {
      selectedSkin = skin;
      localStorage.setItem('singularity-skin', skin.id);
      renderSkins();
    }
    return;
  }
  switch (target.dataset.action) {
    case 'play': startGame(target.dataset.mode as GameMode); break;
    case 'pause': game.togglePause(); break;
    case 'resume': game.togglePause(); break;
    case 'restart': startGame(activeMode); break;
    case 'replay': startGame(activeMode); break;
    case 'menu': game.returnToMenu(); break;
    case 'skins': renderSkins(); skinsDrawer.hidden = false; break;
    case 'settings': settingsDrawer.hidden = false; break;
    case 'close-drawers': closeDrawers(); break;
    case 'reset-zen': game.resetZen(); break;
    case 'mute': {
      const input = document.querySelector<HTMLInputElement>('#sound-setting')!;
      input.checked = !input.checked;
      game.setMuted(!input.checked);
      target.classList.toggle('is-muted', !input.checked);
      target.textContent = input.checked ? '♪' : '×';
      break;
    }
  }
});

document.querySelector<HTMLInputElement>('#time-scale')!.addEventListener('input', (event) => game.setTimeScale(Number((event.target as HTMLInputElement).value)));
document.querySelector<HTMLInputElement>('#sound-setting')!.addEventListener('change', (event) => game.setMuted(!(event.target as HTMLInputElement).checked));
document.querySelector<HTMLInputElement>('#motion-setting')!.addEventListener('change', (event) => {
  const enabled = (event.target as HTMLInputElement).checked;
  document.documentElement.classList.toggle('reduced-motion', enabled);
  game.setReducedMotion(enabled);
});
document.querySelector<HTMLInputElement>('#contrast-setting')!.addEventListener('change', (event) => document.documentElement.classList.toggle('high-contrast', (event.target as HTMLInputElement).checked));

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  document.querySelector<HTMLInputElement>('#motion-setting')!.checked = true;
  document.documentElement.classList.add('reduced-motion');
  game.setReducedMotion(true);
}
document.querySelector('#best-score')!.textContent = Number(localStorage.getItem('singularity-best') ?? 0).toLocaleString();
closeDrawers();
setPhase('menu');

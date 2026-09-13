import * as THREE from 'three';

export class InputController {
  private keys = new Set<string>();
  private pointer = new THREE.Vector2();
  private pointerActive = false;
  private touchAnchor = new THREE.Vector2();
  private touchCurrent = new THREE.Vector2();
  private gamepadDirection = new THREE.Vector2();

  constructor(private readonly element: HTMLElement, private readonly onPause: () => void) {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    element.addEventListener('pointermove', this.handlePointerMove);
    element.addEventListener('pointerdown', this.handlePointerDown);
    element.addEventListener('pointerup', this.handlePointerUp);
    element.addEventListener('pointercancel', this.handlePointerUp);
    element.addEventListener('contextmenu', (event) => event.preventDefault());
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    this.keys.add(event.code);
    if (event.code === 'Escape' || event.code === 'KeyP') this.onPause();
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code);
  };

  private handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') {
      this.touchAnchor.set(event.clientX, event.clientY);
      this.touchCurrent.copy(this.touchAnchor);
      this.pointerActive = true;
      this.element.setPointerCapture(event.pointerId);
    }
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerType === 'touch' && this.pointerActive) {
      this.touchCurrent.set(event.clientX, event.clientY);
      return;
    }
    const rect = this.element.getBoundingClientRect();
    this.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height * 2 - 1));
    this.pointerActive = true;
  };

  private handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') this.pointerActive = false;
  };

  direction(): THREE.Vector2 {
    const keyboard = new THREE.Vector2(
      Number(this.keys.has('KeyD') || this.keys.has('ArrowRight')) - Number(this.keys.has('KeyA') || this.keys.has('ArrowLeft')),
      Number(this.keys.has('KeyS') || this.keys.has('ArrowDown')) - Number(this.keys.has('KeyW') || this.keys.has('ArrowUp')),
    );
    if (keyboard.lengthSq() > 0) return keyboard.normalize();

    const pads = navigator.getGamepads?.() ?? [];
    const pad = pads.find(Boolean);
    if (pad) {
      this.gamepadDirection.set(Math.abs(pad.axes[0] ?? 0) > 0.15 ? pad.axes[0] : 0, Math.abs(pad.axes[1] ?? 0) > 0.15 ? pad.axes[1] : 0);
      if (this.gamepadDirection.lengthSq() > 0.03) return this.gamepadDirection.clone().normalize();
    }

    if (!this.pointerActive) return new THREE.Vector2();
    if (this.touchAnchor.distanceToSquared(this.touchCurrent) > 0) {
      return this.touchCurrent.clone().sub(this.touchAnchor).clampLength(0, 65).divideScalar(65);
    }
    const vector = new THREE.Vector2(this.pointer.x, -this.pointer.y);
    if (vector.length() < 0.12) return new THREE.Vector2();
    return vector.clampLength(0, 1);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.element.removeEventListener('pointermove', this.handlePointerMove);
    this.element.removeEventListener('pointerdown', this.handlePointerDown);
    this.element.removeEventListener('pointerup', this.handlePointerUp);
    this.element.removeEventListener('pointercancel', this.handlePointerUp);
  }
}

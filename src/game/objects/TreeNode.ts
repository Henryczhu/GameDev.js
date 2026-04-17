import * as Phaser from 'phaser';

export class TreeNode extends Phaser.GameObjects.Zone {
    spawnCooldown = 1;
    currentCooldown = 1;
    maxSpawns = 10;
    currentSpawns = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, width = 1, height = 1) {
        super(scene, x, y, width, height);
        this.setOrigin(0, 0);
        scene.add.existing(this);
    }

    registerSpawn() {
        this.currentSpawns++;
    }

    unregisterSpawn() {
        this.currentSpawns--;
    }

    /** Advance cooldown; returns true when this node should spawn trees. */
    tickCooldown(deltaS: number): boolean {
        this.currentCooldown -= deltaS;
        if (this.currentCooldown <= 0) {
            this.currentCooldown = this.spawnCooldown;
            return true;
        }
        return false;
    }
}

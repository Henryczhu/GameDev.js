import * as Phaser from 'phaser';
import type { Machine } from './Machine';

export class LaserBeam extends Phaser.GameObjects.Sprite {
    damage = 50;

    constructor(scene: Phaser.Scene, x: number, y: number, machineDepth: number) {
        super(scene, x, y, 'laser', 1);
        this.setOrigin(0, 0.5);
        this.setScale(0.5);
        this.setDepth(machineDepth + 1);
        scene.add.existing(this);
    }

    alignTo(machine: Machine, laserRange: number) {
        const angle = machine.rotation - Math.PI / 4;
        const dispX = Math.cos(angle) * 10;
        const dispY = Math.sin(angle) * 10;
        this.setPosition(machine.x + dispX, machine.y + dispY);
        this.setRotation(angle);
        this.setScale((laserRange / 128) * 0.5, 0.5);
    }
}

import * as Phaser from 'phaser';
import { LaserBeam } from './LaserBeam';

export class Machine extends Phaser.GameObjects.Sprite {
    private static nextId = 0;
    readonly id = Machine.nextId++;
    rev = 0;
    rotUntilNext = 2 * Math.PI;
    readonly laser: LaserBeam;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'machine');
        scene.add.existing(this);
        this.laser = new LaserBeam(scene, x, y, this.depth);
    }

    tick(deltaS: number) {
        this.rotation += 5 * deltaS;
        this.rotUntilNext -= 5 * deltaS;
        if (this.rotUntilNext <= 0) {
            this.rev += 1;
            this.rotUntilNext = 2 * Math.PI + this.rotUntilNext;
        }
    }
}

import * as Phaser from 'phaser';
import { TreeNode } from './TreeNode';

export class Tree extends Phaser.GameObjects.Sprite {
    health = 100;
    /** Used with lastHitRev so multiple machines do not share one counter. */
    lastHitMachineId = -1;
    lastHitRev = -1;
    readonly spawnNode: TreeNode;
    private releasedSpawn = false;

    constructor(scene: Phaser.Scene, x: number, y: number, spawnNode: TreeNode) {
        super(scene, x, y, 'trees', 0);
        this.spawnNode = spawnNode;
        this.setOrigin(0, 0);
        scene.add.existing(this);
        this.setDepth(this.y + this.x * 1e-4);
        spawnNode.registerSpawn();
    }

    override destroy(fromScene?: boolean) {
        if (!this.releasedSpawn) {
            this.releasedSpawn = true;
            this.spawnNode.unregisterSpawn();
        }
        super.destroy(fromScene);
    }
}

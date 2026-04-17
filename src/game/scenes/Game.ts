import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { EventBus } from '../EventBus';
import { Machine } from '../objects/Machine';
import { Tree } from '../objects/Tree';
import { TreeNode } from '../objects/TreeNode';

export class Game extends Scene {
    private tileGrid: number[][] = [];
    private readonly treeNodeTileAnchors: [number, number][] = [
        [3, 4],
        [15, 2],
        [5, 12],
        [30, 5],
        [20, 12],
    ];
    private treeNodes!: Phaser.GameObjects.Group;
    private trees!: Phaser.GameObjects.Group;
    private machines!: Phaser.GameObjects.Group;
    private readonly laserRange = 100;

    constructor () {
        super('Game');
    }

    private createTileGrid() {
        for (let r = 0; r < 24; r++) {
            this.tileGrid.push([]);
            for (let c = 0; c < 42; c++) {
                const roll = Math.random() * 10 - 6;
                if (roll <= 1) {
                    this.tileGrid[r].push(5);
                } else {
                    this.tileGrid[r].push(Math.floor(roll) + 4);
                }
            }
        }
    }

    private createTreeNodes() {
        const tileSize = 16;
        this.treeNodes = this.add.group();
        for (const [col, row] of this.treeNodeTileAnchors) {
            const marker = new TreeNode(this, col * tileSize, row * tileSize);
            this.treeNodes.add(marker);
        }
    }

    private checkNodeCooldowns(deltaS: number) {
        const nodes = this.treeNodes.getChildren() as TreeNode[];
        for (const treeNode of nodes) {
            if (treeNode.tickCooldown(deltaS)) {
                this.spawnTreesAroundNode(2, 100, treeNode);
            }
        }
    }

    private spawnTreesAroundNode(amt: number, radius: number, node: TreeNode) {
        for (let i = 0; i < amt; i++) {
            if (node.currentSpawns >= node.maxSpawns) {
                break;
            }
            const angle = Math.random() * 2 * Math.PI;
            const mag = Math.random() * radius;
            const x = node.x + Math.cos(angle) * mag;
            const y = node.y + Math.sin(angle) * mag;
            const tree = new Tree(this, x, y, node);
            this.trees.add(tree);
        }
    }

    private spawnDamagePopup(tree: Tree, amount: number) {
        const b = tree.getBounds();
        const x = b.x + b.width * 0.5 + Phaser.Math.Between(-10, 10);
        const y = b.y + b.height * 0.5 + Phaser.Math.Between(-6, 2);
        const text = this.add.text(x, y, `-${amount}`, {
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            color: '#ff7966',
            stroke: '#5c211a',
            strokeThickness: 3,
        });
        text.setOrigin(0.5, 0.5);
        text.setDepth(100_000);
        this.tweens.add({
            targets: text,
            y: text.y - 36,
            alpha: 0,
            duration: 1000,
            ease: 'Sine.easeOut',
            onComplete: () => {
                text.destroy();
            },
        });
    }

    private checkLaserTreeCollisions() {
        const trees = this.trees.getChildren() as Tree[];
        const machines = this.machines.getChildren() as Machine[];

        for (const tree of trees) {
            let overlappingAny = false;
            for (const machine of machines) {
                const laserBounds = machine.laser.getBounds();
                const hit = Phaser.Geom.Intersects.RectangleToRectangle(laserBounds, tree.getBounds());
                if (!hit) {
                    continue;
                }
                overlappingAny = true;
                if (tree.lastHitMachineId === machine.id && tree.lastHitRev === machine.rev) {
                    continue;
                }
                const damage = machine.laser.damage;
                tree.setTint(0xff7777);
                tree.health -= damage;
                this.spawnDamagePopup(tree, damage);
                tree.lastHitMachineId = machine.id;
                tree.lastHitRev = machine.rev;
                if (tree.health <= 0) {
                    tree.destroy();
                    break;
                }
            }
            if (!overlappingAny) {
                tree.clearTint();
            }
        }
    }

    private placeMachine(pointer: Phaser.Input.Pointer) {
        if (!pointer.leftButtonDown()) {
            return;
        }
        const machine = new Machine(this, pointer.worldX, pointer.worldY);
        this.machines.add(machine);
    }

    preload () {
        this.load.setPath('assets');

        this.load.spritesheet('ground_tiles', 'ground_tiles.png', {
            frameWidth: 16,
            frameHeight: 16
        });
        this.load.spritesheet('trees', 'trees.png', {
            frameWidth: 32,
            frameHeight: 48,
        });

        this.load.image('machine', 'machine_00.png');
        this.load.spritesheet('laser', 'laser.png', {
            frameWidth: 128,
            frameHeight: 64,
        });

        this.createTileGrid();
    }

    create () {
        this.trees = this.add.group();
        this.machines = this.add.group();

        for (let r = 0; r < this.tileGrid.length; r++) {
            for (let c = 0; c < this.tileGrid[r].length; c++) {
                this.add.sprite(c * 16, r * 16, 'ground_tiles', this.tileGrid[r][c]).setOrigin(0, 0);
            }
        }
        this.createTreeNodes();
        for (const node of this.treeNodes.getChildren()) {
            this.spawnTreesAroundNode(5, 100, node as TreeNode);
        }

        this.input.on('pointerdown', this.placeMachine, this);
        this.events.once('shutdown', () => {
            this.input.off('pointerdown', this.placeMachine, this);
        });

        EventBus.emit('current-scene-ready', this);
    }

    update (_time: number, delta: number) {
        const deltaS = delta / 1000;
        const machines = this.machines.getChildren() as Machine[];
        for (const machine of machines) {
            machine.tick(deltaS);
            machine.laser.alignTo(machine, this.laserRange);
        }
        this.checkLaserTreeCollisions();
        this.checkNodeCooldowns(deltaS);
    }
}

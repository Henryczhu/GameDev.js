import { Scene } from 'phaser';
import * as Phaser from 'phaser'
import { EventBus } from '../EventBus';

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
    private machine!: Phaser.GameObjects.Sprite;
    private laserBeam!: Phaser.GameObjects.Sprite;
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
            const marker = this.add.zone(col * tileSize, row * tileSize, 1, 1);
            marker.setOrigin(0, 0);
            marker.setData('spawn_cooldown', 1);
            marker.setData('current_cooldown', 1);
            marker.setData('max_spawns', 10);
            marker.setData('current_spawns', 0);
            this.treeNodes.add(marker);
        }
    }

    private checkNodeCooldowns(delta_s : number) {
        const treeNodes = this.treeNodes.getChildren() as Phaser.GameObjects.Zone[];
        for (const treeNode of treeNodes) {
            treeNode.data.inc('current_cooldown', -delta_s);
            if (treeNode.getData('current_cooldown') <= 0) {
                this.spawnTreesAroundNode(2, 100, treeNode);
                treeNode.setData('current_cooldown', treeNode.getData('spawn_cooldown'));
            }
        }
    }

    private spawnTreesAroundNode (amt: number, radius: number, node: Phaser.GameObjects.Zone) {
        for (let i = 0; i < amt; i++) {
            if (node.getData('current_spawns') >= node.getData('max_spawns')) {
                break;
            }
            const angle = Math.random() * 2 * Math.PI;
            const mag = Math.random() * radius;
            const x = node.x + Math.cos(angle) * mag;
            const y = node.y + Math.sin(angle) * mag;
            const tree = this.add.sprite(x, y, 'trees', 0).setOrigin(0, 0);
            tree.setDepth(tree.y + tree.x * 1e-4);
            tree.setData('health', 100);
            tree.setData('last_hit_rev', -1);
            tree.setData('spawn_node', node);
            node.data.inc('current_spawns', 1);
            this.trees.add(tree);
        }
    }

    private checkLaserTreeCollisions() {
        const laserBounds = this.laserBeam.getBounds();
        const trees = this.trees.getChildren() as Phaser.GameObjects.Sprite[];

        for (const tree of trees) {
            const hit = Phaser.Geom.Intersects.RectangleToRectangle(laserBounds, tree.getBounds());
            if (hit) {
                if (tree.getData('last_hit_rev') == this.machine.getData('rev')) {
                    continue;
                }
                tree.setTint(0xff7777);
                tree.data.inc('health', -50);
                tree.setData('last_hit_rev', this.machine.getData('rev'));
                if (tree.getData('health') <= 0) {
                    const node = tree.getData('spawn_node') as Phaser.GameObjects.Zone | undefined;
                    if (node) {
                        node.data.inc('current_spawns', -1);
                    }
                    tree.destroy();
                }
            } else {
                tree.clearTint();
            }
        }
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
        })
        

        this.createTileGrid();
    }

    create () {   
        this.trees = this.add.group();

        for (let r = 0; r < this.tileGrid.length; r++) {
            for (let c = 0; c < this.tileGrid[r].length; c++) {
                this.add.sprite(c * 16, r * 16, 'ground_tiles', this.tileGrid[r][c]).setOrigin(0, 0);
            }
        }
        this.createTreeNodes();
        for (const node of this.treeNodes.getChildren()) {
            this.spawnTreesAroundNode(5, 100, node as Phaser.GameObjects.Zone);
        }
        const p = this.input.activePointer;
        this.machine = this.add.sprite(p.worldX, p.worldY, 'machine');
        this.machine.setData('rev', 0);
        this.machine.setData('rot_until_next', 2 * Math.PI);
        this.laserBeam = this.add.sprite(p.worldX, p.worldY, 'laser', 1)
            .setOrigin(0, 0.5)
            .setScale(0.5)
            .setDepth(this.machine.depth + 1);
        EventBus.emit('current-scene-ready', this);
    }

    update (_time: number, _delta: number) {
        const delta_s = _delta / 1000;
        const p = this.input.activePointer;
        this.machine.setPosition(p.worldX, p.worldY);
        this.machine.rotation += 5 * delta_s;
        this.machine.data.inc('rot_until_next', -5 * delta_s);
        if (this.machine.getData('rot_until_next') <= 0) {
            this.machine.data.inc('rev', 1);
            this.machine.setData('rot_until_next', 2 * Math.PI + this.machine.getData('rot_until_next'));
        }

        let angle = this.machine.rotation - Math.PI / 4;
        let disp = [Math.cos(angle) * 10, Math.sin(angle) * 10]
        this.laserBeam.setPosition(p.worldX + disp[0], p.worldY + disp[1]);
        this.laserBeam.setRotation(angle);
        this.laserBeam.setScale((this.laserRange / 128) * 0.5, 0.5);
        this.checkLaserTreeCollisions();
        this.checkNodeCooldowns(delta_s);
    }
}

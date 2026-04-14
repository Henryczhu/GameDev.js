import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        this.load.setPath('assets');
        
        // this.load.image('', '.png');
    }

    create ()
    {   
        EventBus.emit('current-scene-ready', this);
    }
}

import { useRef } from 'react';
import * as Phaser from 'phaser'
import { IRefPhaserGame, PhaserGame } from './PhaserGame';

function App()
{

    const phaserRef = useRef<IRefPhaserGame | null>(null);

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} />
        </div>
    )
}

export default App

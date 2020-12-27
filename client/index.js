import {Terminal} from './libs/xterm';
import {FitAddon} from './libs/xterm-addon-fit';

const term = new Terminal();
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

window.onload = function() {
    term.open(document.getElementById('terminal'));
    fitAddon.fit();
}
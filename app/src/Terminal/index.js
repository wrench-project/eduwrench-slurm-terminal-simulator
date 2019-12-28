import {Terminal} from 'xterm';
import {FitAddon} from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import './index.css'

let input = '';
let extension = '';
let pastInputs = [];
let pastInputIndex = 0;
let fakeFileSystem = {};

function processInput(term) {
    term.write('\r\n');
    if(input === '') {
        return;
    }
    let parts = input.split(' ');
    if(parts.length === 1) {
        term.write(parts[0]);
        term.write('\r\n');
    }
}

function arrowKeys(term, keyCode) {
    if(keyCode === 38) {
        if(pastInputIndex > 0) {
            for(let i = 0; i < input.length; input++) {
                term.write('\b \b');
            }
            input = pastInputs[--pastInputIndex];
            term.write(input);
        }
        console.log(pastInputIndex)
        return true;
    }

    if(keyCode === 40) {
        pastInputIndex++;
        console.log(pastInputIndex)
        if(pastInputIndex < pastInputs.length) {
            for(let i = 0; i < input.length; input++) {
                term.write('\b \b');
            }
            input = pastInputs[pastInputIndex];
            term.write(input);
        }
        if(pastInputIndex >= pastInputs.length) {
            for(let i = 0; i < input.length; input++) {
                term.write('\b \b');
            }
            pastInputIndex = pastInputs.length;
            input = '';
        }
        return true;
    }

    if(keyCode === 37 || keyCode === 39) {
        return true;
    }

    return false;
}

function runTerminal() {
    let term = new Terminal();
    let fitAddOn = new FitAddon();

    term.loadAddon(fitAddOn);
    term.setOption('cursorBlink', true);
    term.open(document.getElementById('terminal'));
    fitAddOn.fit();
    term.write('Hello World\r\nTerminal:~$ ');
    term.onKey(dat => {
        let key = dat.key;
        let keyCode = dat.domEvent.keyCode;
        //console.log(keyCode);

        if(keyCode === 67) {
            term.write(`^C\r\nTerminal:~${extension}$ `);
            pastInputIndex = pastInputs.length;
            input = '';
            return;
        }

        if(arrowKeys(term, keyCode)) {
            return;
        }

        if(key === '\r') {
            processInput(term);
            term.write(`Terminal:~${extension}$ `);
            pastInputs.push(input);
            pastInputIndex = pastInputs.length;
            input = '';
        } else if(key.charCodeAt(0) === 127) {
            if(input.length > 0) {
                input = input.slice(0,-1);
                term.write('\b \b');
            }
        } else {
            input += key;
            term.write(key);
        }
    });
}

export default runTerminal;
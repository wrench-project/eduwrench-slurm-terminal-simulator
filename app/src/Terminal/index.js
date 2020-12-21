import {Terminal} from 'xterm';
import {FitAddon} from 'xterm-addon-fit'
import {setTime} from '../Clock'
import 'xterm/css/xterm.css'
import './index.css'
import { ConfigFile } from '../TextArea';

let input = '';
let extension = '';
let pastInputs = [];
let pastInputIndex = 0;
let fakeFileSystem = {};

function showTextArea() {
    let textArea = document.getElementById('textarea');
    let textButton = document.getElementById('textbutton');
    textButton.hidden = false;
    textArea.hidden = false;
    textArea.value = ConfigFile;
}

// Executes server call in order for each implemented call
// If not, it just echos what was written.
async function makeServerCall(input, term) {
    if(input === "time") {
        fetch('http://localhost:8080/time', {
            method: 'GET'
        })
        .then((response) => response.json())
        .then((res) => {
            let date = new Date(res['time']);
            setTime(res['time']);
            term.write(date.toISOString());
            term.write('\r\n');
            term.write(`Terminal:~${extension}$ `);
        });
    } else if(input === "query") {
        fetch('http://localhost:8080/query', {
            method: 'GET'
        })
        .then((response) => response.json())
        .then((res) => {
            let date = new Date(res['time']);
            let query = res['query'];
            setTime(res['time']);
            term.write(date.toISOString() + `: ${query}`);
            term.write('\r\n');
            term.write(`Terminal:~${extension}$ `);
        });
    } else if(input === "batch") {
        fetch('http://localhost:8080/query', {
            method: 'GET'
        })
        .then((response) => response.json())
        .then((res) => {
            let date = new Date(res['time']);
            let query = res['query'];
            setTime(res['time']);
            term.write(date.toISOString() + `: ${query}`);
            term.write('\r\n');
            term.write(`Terminal:~${extension}$ `);
        });
    } else {
        term.write(input);
        term.write('\r\n');
        term.write(`Terminal:~${extension}$ `);
    }
}

// Processes input to see what processing needs to be done.
async function processInput(term) {
    term.write('\r\n');
    if(input === '') {
        return;
    }
    let parts = input.split(' ');
    if(parts.length === 1) {
        makeServerCall(parts[0], term);
    }
    if(parts.length === 2) {
        if((parts[0] === 'nano' || parts[0] === 'vim') && parts[1] === 'config') {
            showTextArea();
        }
    }
}

// Handles the arrow key functionality, preventing arrow key movement
// and retaining history of past commands through up and down keys.
function arrowKeys(term, keyCode) {
    if(keyCode === 38) {
        if(pastInputIndex > 0) {
            for(let i = 0; i < input.length; i++) {
                console.log('b')
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
            for(let i = 0; i < input.length; i++) {
                term.write('\b \b');
            }
            input = pastInputs[pastInputIndex];
            term.write(input);
        }
        if(pastInputIndex >= pastInputs.length) {
            for(let i = 0; i < input.length; i++) {
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

// Sets up and runs the terminal while managing the keystroke inputs.
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

        if(arrowKeys(term, keyCode)) {
            return;
        }

        if(key === '\r') {
            processInput(term);
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
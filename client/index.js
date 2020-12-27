import {Terminal} from './libs/xterm';
import {FitAddon} from './libs/xterm-addon-fit';

// Load terminal library
const term = new Terminal();
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

// Holds current simulation time
let simTime = new Date(0);

// Holds clock DOM element to remove need to find it every second.
let clock;

// Holds list of events which occurred on the server
let events = [];

window.onload = main;

function initializeTerminal() {
    term.open(document.getElementById('terminal'));
    fitAddon.fit();
}

function queryServer() {
    return simTime.getTime();
}

function updateClockAndQueryServer() {
    // Increment simulation time by 1 second
    simTime.setTime(simTime.getTime() + 1000);

    // Query server for current time
    let serverTime = queryServer();
    if(Math.abs(serverTime - simTime.getTime()) > 500) {
        simTime.setTime(serverTime);
    }

    // Convert to 12 hour system (Can change it back to 24 hour system)
    let hour = simTime.getUTCHours();
    let AMPM = 'AM';
    if(hour > 11) {
        AMPM = 'PM';
    }
    if(hour > 12) {
        hour -= 12;
    } else if(hour == 0) {
        hour = 12;
    }
    clock.innerText = `${hour}${simTime.toISOString().substr(13,6)} ${AMPM}`;
}

function main() {
    initializeTerminal();
    clock = document.getElementById('clock');
    setInterval(updateClockAndQueryServer, 1000);
}
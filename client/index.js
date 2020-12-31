/**
 * Main file which runs all the javascript.
 */

import {Terminal} from './libs/xterm';
import {FitAddon} from './libs/xterm-addon-fit';
import {Filesystem} from './filesystem';

// Load terminal library
const term = new Terminal();
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
let termBuffer;

// Creates faked filesystem
const filesystem = new Filesystem();

// Holds current simulation time
let simTime = new Date(0);

// Flag to signify whether text is being edited
let fileOpen = false;

// Variables to hold DOM elements
let clock;
let add1Button;
let add10Button;
let add60Button;

// Holds list of events which occurred on the server
let events = [];

// Once HTML is loaded run main function
window.onload = main;

/**
 * Shows text edit area, save button, and save/close button.
 * @param {Text of document} text 
 */
function editFile(text) {

}

/**
 * Runs specified commands and faked programs.
 */
function processCommand() {
    let currentLine = termBuffer.getLine(termBuffer.cursorY).translateToString(true).split(/^~.*?\$ /)[1].split(" ");
    let command = currentLine[0];
    
    // Checking for which command to execute
    if(command == "clear") {
        term.clear();
        return;
    }
    if(command == "ls") {
        let ls;
        if(currentLine.length > 1) {
            ls = filesystem.ls(currentLine[1]);
        } else {
            ls = filesystem.ls();
        }
        if(ls != "") {
            term.write(filesystem.ls() + "\r\n");
        }
        return;
    }
    // Possible to shift the multiple directory creation to filesystem. Can pass multiple parameters as an array.
    if(command == "mkdir") {
        if(currentLine.length > 1) {
            for(let i = 1; i < currentLine.length; i++) {
                let f = filesystem.mkdir(currentLine[i]);
                if(f != "") {
                    term.write(f + "\r\n");
                }
            }
        } else {
            term.write("Missing argument\r\n");
        }
        return;
    }
    if(command == "touch") {
        if(currentLine.length > 1) {
            for(let i = 1; i < currentLine.length; i++) {
                let f = filesystem.create(currentLine[i]);
                if(f != "") {
                    term.write(f + "\r\n");
                }
            }
        } else {
            term.write("Missing argument\r\n");
        }
        return;
    }
    if(command == "rm") {
        if(currentLine.length == 1) {
            term.write("Missing argument\r\n");
            return;
        }
        // Handles single argument rm.
        if(currentLine.length == 2) {
            if(currentLine[1] == "-r") {
                term.write("Missing argument\r\n");
                return;
            }
            let f = filesystem.rm(currentLine[1]);
            if(f != "") {
                term.write(f + "\r\n");
            }
            return;
        }
        // Handles recursive rm
        if(currentLine[1] == "-r") {
            for(let i = 2; i < currentLine.length; i++) {
                let f = filesystem.rm(currentLine[i], true);
                if(f != "") {
                    term.write(f + "\r\n");
                }
            }
            return;
        }
        // Handle multiple arguments non-recursive
        for(let i = 2; i < currentLine.length; i++) {
            let f = filesystem.rm(currentLine[i]);
            if(f != "") {
                term.write(f + "\r\n");
            }
        }
    }
    if(command == "cat") {
        if(currentLine.length > 1) {
            for(let i = 1; i < currentLine.length; i++) {
                let f = filesystem.open(currentLine[i]);
                if(f != null) {
                    term.write(f + "\r\n");
                } else {
                    term.write("File not found or is directory\r\n");
                }
            }
        } else {
            term.write("Missing argument\r\n");
        }
        return;
    }
    if(command == "edit") {
        if(currentLine.length > 1) {
            let f = filesystem.open(currentLine[i]);
            if(f != null) {
                editFile(f);
            } else {
                term.write("File not found or is directory\r\n");
            }
        } else {
            term.write("Missing argument\r\n");
        }
        return;
    }
    term.write(`Command '${command}' not found.\r\n`);
}

/**
 * Process what happens when arrow key commands are executed.
 */
function handleArrowKeys(seq) {
    let currentLine = termBuffer.getLine(termBuffer.cursorY).translateToString(true);
    if (seq == '\u001B\u005B\u0041') {
        console.log('up'); 
    }
    if (seq == '\u001B\u005B\u0042') {
        console.log('down'); 
    }
    if (seq == '\u001B\u005B\u0043') {
        if(termBuffer.cursorX < currentLine.length) { 
            term.write(seq);
        }
    }
    if (seq == '\u001B\u005B\u0044') {
        if(termBuffer.cursorX > 3) {
            term.write(seq);
        } 
    }
}

// Non-control character regex
const notControl = /^[\w\d\s]$/;

/**
 * Processes and executes the character commands when inputted.
 * @param {Input typed into the terminal, generally a single character} seq 
 */
function processInput(seq) {
    console.log(seq.length + " " + seq.charCodeAt(0).toString(16));
    if(fileOpen) {
        return;
    }
    switch(seq) {
        case '\x03':
            term.write('^C\r\n~$ ');
            break;
        case '\x7f':
            if(termBuffer.cursorX > 2) {
                term.write('\b \b');
            }
            break;
        case '\r':
            term.write('\r\n')
            processCommand();
            term.write('~$ ');
            break;
        default:
            if(notControl.test(seq)) {
                term.write(seq);
            } else if(seq.length == 3 && seq.charAt(0) == '\x1b') {
                handleArrowKeys(seq);
            }
    }
}

/**
 * Initializes the terminal to be usable on webapp.
 */
function initializeTerminal() {
    term.open(document.getElementById('terminal'));
    term.setOption('cursorBlink', true);
    // Currently experimental hence this weird calling approach which does not match xterm docs
    termBuffer = term.buffer.active;

    // Finalize setup
    fitAddon.fit();
    term.write("Terminal initialized...\r\n\r\n~$ ")
    term.onData(processInput);
    term.focus();
}

/**
 * Sends a get request to server to get current server simulated time and events which occurred.
 * TODO: Implementation of function.
 */
function queryServer() {
    return simTime.getTime();
}

/**
 * Function called to update the digital clock face to the current simulated time.
 */
function updateClock() {
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

/**
 * Function called every second to update the clock and query the server.
 */
function updateClockAndQueryServer() {
    // Increment simulation time by 1 second
    simTime.setTime(simTime.getTime() + 1000);

    // Query server for current time
    let serverTime = queryServer();
    if(Math.abs(serverTime - simTime.getTime()) > 500) {
        simTime.setTime(serverTime);
    }
    updateClock();
}

/**
 * FUNCTIONS USED TO HANDLE MOVING TIME BUTTONS
 */
function add1() {
    simTime.setTime(simTime.getTime() + 60000);
    updateClock();
}

function add10() {
    simTime.setTime(simTime.getTime() + 600000);
    updateClock();
}

function add60() {
    simTime.setTime(simTime.getTime() + 3600000);
    updateClock();
}

/**
 * Entry function to run after the HTML has fully loaded.
 */
function main() {
    initializeTerminal();
    
    // Get and set DOM elements
    clock = document.getElementById('clock');
    add1Button = document.getElementById('add1');
    add10Button = document.getElementById('add10');
    add60Button = document.getElementById('add60');

    // Set up functions which need to be updated every specified interval
    setInterval(updateClockAndQueryServer, 1000);

    // Setup event handlers
    add1Button.addEventListener("click", add1, false);
    add10Button.addEventListener("click", add10, false);
    add60Button.addEventListener("click", add60, false);
}
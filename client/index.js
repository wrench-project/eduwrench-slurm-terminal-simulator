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

// Creates fake filesystem
const filesystem = new Filesystem();

// Data structures for command history
let history = []
let historyCursor = -1;
const historyDepth = 16;

// Global to keep track of trailing white spaces on the command-line
// (because backspace does not remove them)
let trailingWhiteSpaces = 0;

// Holds current simulation time
let simTime = new Date(0);

// Flag to signify whether text is being edited
let fileOpen = false;

// Variables to hold DOM elements
let clock;
let textArea;
let batchEditor;
let resetButton;
let cancelButton;
let saveAndExitButton;
let slurmNodesInput;
let slurmHoursInput;
let slurmMinutesInput;
let slurmSecondsInput;

// parallel program and cluster characteristics, all obtained from the server
let pp_name;
let pp_seqwork;
let pp_parwork;
let num_cluster_nodes;

// Once HTML is loaded run main function
window.onload = main;

// Miscellaneous values
let openedFile = "";
//let serverAddress = "192.168.0.20/api";
let serverAddress = "localhost/api";

// Unsupported commands with error messages
let unsupportedCommands = {};
unsupportedCommands["vi"] = "(use the 'edit' command)";
unsupportedCommands["vim"] = "(use the 'edit' command)";
unsupportedCommands["nano"] = "(use the 'edit' command)";
unsupportedCommands["jedit"] = "(use the 'edit' command)";
unsupportedCommands["emacs"] = "(use the 'edit' command)";

/**********************************************************************/
/* HELPER FUNCTIONS                                                   */
/**********************************************************************/

// Function that returns the prompt string, with control characters for color
function prompt() {
    return `\u001B[1;34m${filesystem.getWorkingDir()}$\u001B[0m `;
    // return `${filesystem.getWorkingDir()}$ `;
}

// Returns the prompt length, ignoring the control characters for color
function promptLength() {
    // return `\u001B[1;34m${filesystem.getWorkingDir()}$\u001B[0m `.length;
    return `${filesystem.getWorkingDir()}$ `.length;
}

// Function used to pad zeroes to the left of the value.
function padZero(val) {
    // Checks if it is a string and if a number, if the number is less than 10.
    // This means this function cannot pad values with three digits unless it is a string.
    // If file is converted from javascript to typescript, it will be simple to solve.
    if(val.length === 1 || (typeof(val) == 'number' && val < 10)) {
        val = "0" + val;
    }
    return val;
}

// Function used to pad left with white spaces
function padIntegerWithSpace(val, maxVal) {
    if (typeof(val) == 'number') {
        let numDigitsVal = Math.floor(Math.log10(val));
        let numDigitsMaxVal = Math.floor(Math.log10(maxVal));
        if (numDigitsMaxVal >  numDigitsVal) {
            val =  " ".repeat(numDigitsMaxVal - numDigitsVal) + val;
        }
    }
    return val;
}

// Function to get the current terminal command line
function getCurrentCommandLine(trimRight) {
    // Retrieves the current line number of the terminal. Currently might have a bug in the library since it is
    // experimental for the version being used.
    let lineNum = termBuffer.cursorY + termBuffer.viewportY;
    // Return the trimmed line
    let to_return = termBuffer.getLine(lineNum).translateToString(true);
    // to_return = to_return.replace(prompt(), "");
    to_return = to_return.substr(promptLength(), to_return.length - promptLength());
    if (trimRight) {
        to_return = to_return.trimRight();
    }
    return to_return;
}

// Function to erase the current command line
function eraseCurrentCommandLine() {
    let totalNumCharacters = getCurrentCommandLine(false).length;
    let toMoveToTheRight = totalNumCharacters - termBuffer.cursorX + 3;
    let toErase = totalNumCharacters;
    for (let i=0; i < toMoveToTheRight; i++) {
        term.write(" ");
    }
    for (let i=0; i < toErase; i++) {
        term.write('\b \b');
    }
}

/**
 * Cancel interaction with text editor and go back to terminal
 */
function exitTextEditor() {

    // Adjust the editing area and environmental values
    textArea.contentEditable = false;
    textArea.style.display = "none";
    batchEditor.style.display = "none";
    openedFile = "";
    fileOpen = false;

    // This particular line is needed if closing the editBatchFile. Doesn't
    // affect regular file opening
    textEditor.setAttribute("contentEditable", true);

    // Show terminal and reset time button
    resetButton.style.display = "";
    document.getElementById('terminal').style.display = "";

    // Restarts blinking on line.
    term.setOption('cursorBlink', true);
}

/**
 * Saves the file to fake filesystem and returns control to terminal
 * while hiding text editor
 */
function saveAndExitTextEditor() {

    // Saves file to filesystem
    filesystem.saveFile(openedFile, textEditor.innerText);

    // Exit the text editor
    exitTextEditor();

}

/**
 * Opens up the batch configuration file.
 * @param filename: Name of file to open
 * @param text: Text in the file to be opened
 */
function editBatchFile(filename, text) {

    // Hide terminal
    document.getElementById('terminal').style.display = "none";
    resetButton.style.display = "none";

    // Makes sure the text is not directly editable.
    textEditor.setAttribute("contentEditable", false);

    // Set input fields to values in the file
    let lines = text.split("\n");
    for (let l of lines) {
        // console.log("LINES = " + l);
        if (l.startsWith("#SBATCH --nodes=")) {
            slurmNodesInput.value = l.replace("#SBATCH --nodes=","").trim();
        } else if (l.startsWith("#SBATCH --time ")) {
            let timeSpec = l.replace("#SBATCH --time", "").trim().split(":");
            slurmHoursInput.value = timeSpec[0];
            slurmMinutesInput.value = timeSpec[1];
            slurmSecondsInput.value = timeSpec[2];
        }
    }

    // Sets up the text area to be representative of file with environmental variables set.
    textEditor.innerText = text;
    textArea.style.display = "block";
    batchEditor.style.display = "block";
    fileOpen = true;
    openedFile = filename;
    term.setOption('cursorBlink', false);
}

/**
 * Shows text edit area, save button, and save/close button.
 * @param filename: Name of file
 * @param text: Text of document
 */
function editFile(filename, text) {
    // Hide terminal
    document.getElementById('terminal').style.display = "none";
    resetButton.style.display = "none";

    // Sets up the text area to be representative of file with environmental variables set.
    textEditor.innerText = text;
    textArea.style.display = "block";
    fileOpen = true;
    openedFile = filename;
    term.setOption('cursorBlink', false);
}

/**
 * Executes when one of the form areas while editing the batch config file has been changed.
 */
function changeBatch() {
    // Retrieves the values and set them to the global variables.
    let slurmNodes = parseInt(slurmNodesInput.value);
    let slurmHour = parseInt(slurmHoursInput.value);
    let slurmMinute = parseInt(slurmMinutesInput.value);
    let slurmSeconds = parseInt(slurmSecondsInput.value);

    // Retrieves the string version of the values.
    let slurmNodesText = slurmNodes.toString();
    let slurmHourText = padZero(slurmHour.toString());
    let slurmMinuteText = padZero(slurmMinute.toString());
    let slurmSecondsText = padZero(slurmSeconds.toString());

    // Determine NaN-ness
    let slurmNodesIsNaN = isNaN(slurmNodes);
    let slurmHourIsNaN = isNaN(slurmHour);
    let slurmMinuteIsNaN = isNaN(slurmMinute);
    let slurmSecondsIsNaN = isNaN(slurmSeconds);

    // Update background color if Nan
    slurmNodesInput.style.backgroundColor   = (slurmNodesIsNaN   ? "#FF3333" : "#FFFFFF");
    slurmHoursInput.style.backgroundColor   = (slurmHourIsNaN    ? "#FF3333" : "#FFFFFF");
    slurmMinutesInput.style.backgroundColor = (slurmMinuteIsNaN  ? "#FF3333" : "#FFFFFF");
    slurmSecondsInput.style.backgroundColor = (slurmSecondsIsNaN ? "#FF3333" : "#FFFFFF");

    // Disable the save button if at least one Nan
    saveAndExitButton.disabled = slurmNodesIsNaN || slurmHourIsNaN || slurmMinuteIsNaN || slurmSecondsIsNaN;

    // Regenerates the content displayed.
    let batchSlurm = "#!/bin/bash\n#SBATCH --nodes=";
    batchSlurm += slurmNodesText;
    batchSlurm += "\n#SBATCH --tasks-per-node=1\n#SBATCH --cpus-per-task=10\n#SBATCH --time ";
    batchSlurm += slurmHourText
    batchSlurm += ":";
    batchSlurm += slurmMinuteText;
    batchSlurm += ":";
    batchSlurm += slurmSecondsText;
    batchSlurm += "\n#SBATCH --error=job-%A.err\n#SBATCH --output=job-%A.out\nsrun ./" + pp_name;

    textEditor.innerText = batchSlurm;
}

/**
 * Sends batch file info to server for simulation. Async because it uses await
 * @param config: Configuration File
 */
async function sendBatch(config) {
    // Splits the content of the batch configuration file by new lines.
    config = config.split('\n');

    // Extracts the needed values: duration, seconds, and node count from the file.
    let dur = config[4].split(' ')[2].split(':');
    let sec = parseInt(dur[0]) * 3600 + parseInt(dur[1]) * 60 + parseInt(dur[2]);
    let nodes = parseInt(config[1].split('=')[1]);
    let parallel_program = config[7].split('/')[1];

    // Sets the body of the request
    let body = {
        job: {
            durationInSec: sec,
            numNodes: nodes
        },
    }

    // Sends a POST request to the server to add a new job
    let res = await fetch(`http://${serverAddress}/addJob`, { method: 'POST', body: JSON.stringify(body)});

    // Parses the return value and decides what to generate/write
    res = await res.json();
    if(!res.success) {
        term.write("sbatch: requested number of nodes exceeds available number of nodes (fix your .slurm file)\r\n");
    } else {
        // Writes to terminal the job name. Since the server returns "standard_job_x" we need to remove the standard
        // section hence the split and slice.
        let job_name = res.jobID.split("_").slice(1).join("_");
        term.write('\r' + job_name + "\r\n");
    }
}

/**
 * Used to cancel the simulated job running or waiting through a POST request
 * @param jobName: Name of the job to be canceled
 */
function cancelJob(jobName) {
    // Sets up the body
    let body = {
        jobName: "standard_" + jobName
    }

    // Sends the request asynchronously and parses as JSON
    fetch(`http://${serverAddress}/cancelJob`, { method: 'POST', body: JSON.stringify(body)})
        .then(res => res.json())
        .then(res => {
            // Prints the cancellation success
            let status = "Successfully cancelled " + jobName;
            if(!res.success) {
                status = "Job cannot be cancelled. Does not exist or no permission."
            }
            term.write("\r" + status + "\r\n" + prompt());
        });
}

/**
 * Retrieves current queue of jobs in server (batch scheduler)
 */
async function getQueue() {
    // Makes GET request to get the current queue
    let res = await fetch(`http://${serverAddress}/getQueue`, { method: 'POST' });
    res = await res.json();

    // Writes the table headers
    term.write('\rJOBNAME   USER       NODES  START TIME      REQ TIME   STATUS\r\n');

    for(const q of res.queue) {
        // Writes to terminal each job within the queue
        let q_parse = q.split(",");
        // Sets job name which will display only 15 characters
        let jobName = q_parse[1].split("_").slice(1).join("_").slice(0, 10);
        // Sets user name which will display only 10 characters
        let user = q_parse[0].slice(0, 10);
        // Sets up node count
        let nodes = q_parse[2];
        // Sets up requested time
        let rTime = q_parse[3];
        // Sets the startTime to closest whole millisecond value
        let startTime = Math.round(parseFloat(q_parse[4]));
        // Sets up variable if startTime is not available since job isn't running
        let sTime = "n/a            "
        // Sets up variable which could change if job is running or not.
        // let status = '\u001B[1mRUNNING\u001B[0m';
        let status = '\u001B[1;32mRUNNING\u001B[0m';
        // Pads the string with spaces to make sure it fits into table formatting
        while (jobName.length < 9) {
            jobName += ' ';
        }
        while (user.length < 10) {
            user += ' ';
        }
        while (nodes.length < 6) {
            nodes += ' ';
        }
        // Sets up the startTime variable correctly where if negative means it's not running.
        if (startTime < 0) {
            status = 'PENDING';
        } else {
            // Finds out the time and correctly generates the UTC time
            let t = new Date(0);
            t.setSeconds(startTime);
            let day = padZero(t.getUTCMonth() + 1) + "/" + padZero(t.getUTCDate())
            sTime = day + " " + padZero(t.getUTCHours()) + ":" + padZero(t.getUTCMinutes()) +
                ":" + padZero(t.getUTCSeconds()) + " ";
        }
        // Format the requested time
        {
            // Finds out the time and correctly generates the UTC time
            let t = new Date(0);
            t.setSeconds(Math.round(parseFloat(rTime)));
            rTime = padZero(t.getUTCHours()) + ":" + padZero(t.getUTCMinutes()) +
                ":" + padZero(t.getUTCSeconds()) + "  ";
        }
        // Write to terminal the job
        term.write(`${jobName} ${user} ${nodes} ${sTime} ${rTime} ${status}` + "\r\n");
    }
    term.write(prompt());
}

function getDate(t) {
    let d = new Date(t);
    let time = padZero(d.getUTCHours()) + ":" + padZero(d.getUTCMinutes()) + ":" + padZero(d.getUTCSeconds()) + " UTC";
    return padZero(d.getUTCMonth() + 1) + "/" + padZero(d.getUTCDate()) + " " + time;
}

/**
 * Runs specified commands and faked programs.
 */
async function processCommand(commandLine) {

    // Remove doublespaces and extra space and stuff
    commandLine = commandLine.replace(/ +/g, ' ');
    commandLine = commandLine.trim();
    // Command recall from history
    if(commandLine.startsWith("!")) {
        let number;
        if (commandLine.charAt(1) === "!") {
            number = history.length;
        } else {
            let next_token = commandLine.split("!")[1];
            number = parseInt(next_token);
            if (isNaN(number) || (number < 1) || (number > history.length)) {
                term.write("event not found\r\n");
                return;
            }
        }
        let tokens = commandLine.split(" ");
        tokens[0] = history[number-1];
        commandLine = tokens.join(" ");
    }

    if (commandLine !== "") {
        history.push(commandLine);
    } else {
        return;
    }

    // Splits up the current line into parts based on the space while removing the unneeded parts of it
    let commandLineTokens = commandLine.split(" ");
    // Since the first command line argument is the command set it as a separate variable.
    let command = commandLineTokens[0];

    // Check for unsupported commands
    if (command in unsupportedCommands) {
        term.write("command '" + command + "' is not supported " + unsupportedCommands[command] + "\r\n");
        return;
    }

    // Clears the terminal. Currently might have a bug where the line where clear is called isn't cleared
    // but ignorable.
    if(command === "clear") {
        term.clear();
        return;
    }

    // Help command
    if(command === "help") {
        if (commandLineTokens.length === 1) {
            printHelp("");
        } else if (commandLineTokens.length === 2) {
            printHelp(commandLineTokens[1]);
        } else {
            term.write("help: invalid number of arguments\r\n");
        }
        return;
    }

    // Fake sleep
    if(command === "sleep") {
        if (commandLineTokens.length !== 2) {
            term.write("sleep: invalid number of arguments\r\n");
            return;
        }
        let tokens = commandLineTokens[1].split(":");
        let timeToSleep = 0;
        let unit = 1;
        for (let i=tokens.length-1; i >= 0; i--) {
            const parsed = parseInt(tokens[i]);
            if (isNaN(parsed)) {
                term.write("sleep: invalid argument\r\n");
                return;
            }
            timeToSleep += unit*parsed;
            unit *= 60;
        }
        await addTime(timeToSleep);
        return;
    }

    // Print command-history
    if(command === "history") {
        for (let i = Math.max(0, history.length - historyDepth); i < history.length; i++) {
            term.write(" " + padIntegerWithSpace(i+1, history.length ) + "  " + history[i] + "\r\n");
        }
        return;
    }


    // List files in the filesystem in specified directory.
    if(command === "ls") {
        let fileArguments = [];
        let flagArguments = [];
        for (let i=1; i < commandLineTokens.length; i++) {
            let arg = commandLineTokens[i];
            if (arg.startsWith("-")) {
                if (arg !== "-l") {
                    term.write("ls: unknown option '" + arg + "'\r\n");
                    return;
                }
                flagArguments.push(arg);
            } else {
                fileArguments.push(arg);
            }
        }
        if (fileArguments.length === 0) {
            fileArguments.push(".");
        }

        // console.log("fileArguments = " + fileArguments);

        let isDashL = flagArguments.includes("-l");

        let stringToPrint = "";
        let firstLine = true;
        for (let path of fileArguments) {
            let results = filesystem.listFiles(path);
            if (results[0] !== "") {
                term.write("ls: " + results[0] + "\r\n");
                return;
            } else {
                if (fileArguments.length > 1 && filesystem.isDirectory(path)) {
                    stringToPrint += (!firstLine ? "\n" : "") +  path + ": \n";
                    firstLine = false;
                }
                for (let t of results[1]) {
                    if (isDashL) {
                        // console.log(t);
                        let permissions = "";
                        if (t.type === "dir") {
                            permissions += "d";
                        } else {
                            permissions += "-";
                        }
                        permissions += "r";
                        if (t.deletable) {
                            permissions += "w";
                        } else {
                            permissions += "-";
                        }
                        if (t.type === "bin" || t.type === "dir") {
                            permissions += "x";
                        } else {
                            permissions += "-";
                        }
                        stringToPrint += permissions + "  " + "slurm_user   " + getDate(t.created) + "   " + (t.type === "dir" ? "\u001B[1;32m" : "") + (t.type === "bin" ? "\u001B[1;31m" : "") + t.name + (t.type === "bin" ? "\u001B[0m" : "") + (t.type === "dir" ? "/\u001B[0m" : "")  + "\n";
                    } else {
                        stringToPrint += (t.type === "dir" ? "\u001B[1;32m" : "") + (t.type === "bin" ? "\u001B[1;31m" : "") + t.name + (t.type === "bin" ? "\u001B[0m" : "") + (t.type === "dir" ? "/\u001B[0m" : "") + "   ";
                    }
                }
                if (!isDashL) {
                    stringToPrint += "\n";
                }
            }
        }

        if (stringToPrint !== "") {
            stringToPrint = justifyText(stringToPrint, 100, true, false);
            term.write(stringToPrint);
        }
        return;
    }

    // Print the current working directory
    if(command === "pwd") {
        let pwd;

        // If multiple command line arguments error
        if(commandLineTokens.length > 1) {
            term.write("pwd: too many arguments\r\n");
        } else {
            pwd = filesystem.getWorkingDir(commandLineTokens[1]);
            term.write(pwd + "\r\n");
        }
        return;
    }
    // Future implementation: Possible to shift the multiple directory creation to filesystem. Can pass multiple parameters as an array.
    // Implements the make directory command
    if(command === "mkdir") {
        // Since the command requires an argument checks for that otherwise prints error.
        if(commandLineTokens.length > 1) {
            // If multiple directories are to be made loop through arguments and create them.
            for(let i = 1; i < commandLineTokens.length; i++) {
                // Creates the directory while providing the current simulated time.
                let f = filesystem.mkdir(commandLineTokens[i], simTime.getTime());
                // If filesystem returns an error, print out error.
                if(f !== "") {
                    term.write("mkdir: " + f + "\r\n");
                }
            }
        } else {
            term.write("mkdir: missing argument\r\n");
        }
        return;
    }
    // Command used to create a file. Doesn't actually update the file updated date (since that doesn't exist in this version).
    if(command === "touch") {
        // Since the command requires an argument checks for that otherwise prints error.
        if(commandLineTokens.length > 1) {
            // If multiple files are to be made loop through arguments and create them.
            for(let i = 1; i < commandLineTokens.length; i++) {
                // Creates the file while providing the current simulated time.
                let f = filesystem.createFile(commandLineTokens[i], simTime.getTime(), false, true);
                // If filesystem returns an error, print out error.
                if(f !== "") {
                    term.write("touch: " + f + "\r\n");
                }
            }
        } else {
            term.write("touch: missing argument\r\n");
        }
        return;
    }

    if(command === "cp") {
        if (commandLineTokens.length < 3) {
            term.write("cp: missing argument\r\n");
            return;
        }
        if (commandLineTokens.length > 3) {
            term.write("cp: to many arguments\r\n");
            return;
        }
        let f = filesystem.copyFile(commandLineTokens[1], commandLineTokens[2], simTime.getTime());
        if (f !== "") {
            term.write("cp: " + f + "\r\n");
        }
        return;
    }

    // Removes files and/or directories.
    if(command === "rm") {
        // Since the command requires an argument checks for that otherwise prints error.
        if(commandLineTokens.length === 1) {
            term.write("rm: missing argument\r\n");
            return;
        }
        // Handles single argument rm.
        if(commandLineTokens.length === 2) {
            // If missing file or directory name, prints error since flag isn't one.
            if(commandLineTokens[1] === "-r") {
                term.write("rm: missing argument\r\n");
                return;
            }
            // Removes file if error occurs like removing directory then writes error.
            let f = filesystem.removeFile(commandLineTokens[1]);
            if(f !== "") {
                term.write("rm: " + f + "\r\n");
            }
            return;
        }
        // Handles recursive rm
        if(commandLineTokens[1] === "-r") {
            // Removes all the files using filesystem
            for(let i = 2; i < commandLineTokens.length; i++) {
                let f = filesystem.removeFile(commandLineTokens[i], true);
                if(f !== "") {
                    term.write("rm: " + f + "\r\n");
                }
            }
            return;
        }
        // Handle multiple arguments non-recursive
        for(let i = 1; i < commandLineTokens.length; i++) {
            let f = filesystem.removeFile(commandLineTokens[i]);
            if(f !== "") {
                term.write("rm: " + f + "\r\n");
            }
        }
        return;
    }
    // Prints file contents to terminal
    if(command === "cat") {
        // Since the command requires an argument checks for that otherwise prints error.
        if(commandLineTokens.length > 1) {
            // Handling for multiple files to print
            for(let i = 1; i < commandLineTokens.length; i++) {
                let f = filesystem.openFile(commandLineTokens[i]);
                // Makes sure it isn't a "binary" since that shouldn't be opened
                if (f === -1) {
                    term.write("cat: operation not permitted\r\n");
                } else if(f != null) {
                    // Replaces the new line with carriage return and new line
                    // or else won't print to terminal correctly.
                    f = f.replace(/\n/g, '\r\n');
                    term.write(f + "\r\n");
                } else {
                    term.write("cat: file not found\r\n");
                }
            }
        } else {
            term.write("cat: missing argument\r\n");
        }
        return;
    }
    if (command === "whoami") {
        if(commandLineTokens.length > 1) {
            term.write("whoami: too many arguments\r\n");
        } else {
            term.write("slurm_user\r\n");
        }
        return;
    }
    // Calls directory change
    if(command === "cd") {
        // Since the command requires an argument checks for that otherwise prints error.
        if(commandLineTokens.length === 2) {
            if(!filesystem.changeWorkingDir(commandLineTokens[1])) {
                term.write("cd: cannot navigate to directory\r\n");
            }
        } else if (commandLineTokens.length === 1) {
            filesystem.changeWorkingDir("/");
        } else {
            term.write("cd: too many argument\r\n");
        }
        return;
    }
    // Allows editing of files
    if(command === "edit") {
        // Since the command requires an argument checks for that otherwise prints error.
        if(commandLineTokens.length > 1) {
            let f = filesystem.openFile(commandLineTokens[1]);
            if(f != null) {
                // Hardcoded file representing a batch config file which will open in a custom manner.
                // Otherwise opens it normally unless it is a "binary" file.
                if(commandLineTokens[1].endsWith(".slurm")) {
                    editBatchFile(commandLineTokens[1], f);
                } else if(f === -1) {
                    term.write("edit: file is binary\r\n");
                } else {
                    editFile(commandLineTokens[1], f);
                }
            } else {
                term.write("edit: operation not permitted\r\n");
            }
            return;
        }
    }
    // Command to send the batch file.
    if(command === "sbatch") {
        // Since the command requires an argument checks for that otherwise prints error.
        if(commandLineTokens.length > 1) {
            let filename = commandLineTokens[1];
            let f = filesystem.openFile(filename);
            // Checks if it is the hard-coded config file.
            if(f != null && commandLineTokens[1].endsWith(".slurm")) {
                await sendBatch(f);
            } else if (f == null) {
                term.write("sbatch: file not found\r\n");
            } else {
                term.write("sbatch: batch file must have .slurm extension\r\n");
            }
        } else {
            term.write("sbatch: missing argument\r\n");
        }
        return;
    }
    // Command to retrieve and print the queue
    if(command === "squeue") {
        if (commandLineTokens.length !== 1) {
            term.write("squeue: too many arguments\r\n");
        } else {
            await getQueue();
        }
        return;
    }
    // Command to cancel a job.
    if(command === "scancel") {
        // Since the command requires an argument checks for that otherwise prints error.
        if(commandLineTokens.length === 2) {
            cancelJob(commandLineTokens[1]);
        } else if (commandLineTokens.length > 2) {
            term.write("scancel: too many arguments\r\n");
        } else {
            term.write("scancel: missing argument\r\n");
        }
        return;
    }

    // Implements equivalent of date -r in linux systems to print date of creation
    if(command === "date") {
        // const printDate = function(t) {
        //     let d = new Date(t);
        //     let time = padZero(d.getUTCHours()) + ":" + padZero(d.getUTCMinutes()) + ":" + padZero(d.getUTCSeconds()) + " UTC";
        //     term.write(padZero(d.getUTCMonth() + 1) + "/" + padZero(d.getUTCDate()) + " " + time + "\r\n");
        // };

        if (commandLineTokens.length === 1) {
            term.write(getDate(simTime.getTime()) + "\r\n");
            // printDate(simTime.getTime());
        } else {
            term.write("Usage: date [-r <path>]\r\n");
        }
        return;
    }

    // The user must have typed a path?
    let f = filesystem.fileExists(command);
    if (f[0] === true) {
        if (f[1] === "bin") {
            term.write(`cannot execute programs on the cluster's head node\r\n`);
        } else {
            term.write(`operation not allowed\r\n`);
        }
    } else {
        term.write(`command '${command}' not found.\r\n`);
    }
}

/**
 * Process TAB completion
 */
function handleTab() {

    let currentLine = getCurrentCommandLine(false);
    currentLine = currentLine.substr(0, currentLine.length - trailingWhiteSpaces);

    // currentLine = currentLine.trimRight();
    let lastWord;
    if (currentLine.endsWith("/.") || currentLine.endsWith("/..") || currentLine.endsWith(" .") || currentLine.endsWith(" ..")) {
        term.write("/");
        trailingWhiteSpaces--;
        return;
    }
    if (currentLine.endsWith(" ")) {
        lastWord = "";
    } else {
        let tokens = currentLine.trim().split(" ");
        lastWord = tokens[tokens.length - 1];
    }

    let completion = filesystem.tabCompletion(lastWord);
    if (completion.length === 1) {
        term.write("\b \b".repeat(lastWord.length));
        term.write(completion[0]);
        trailingWhiteSpaces -= (completion[0].length - lastWord.length);
        if (trailingWhiteSpaces < 0) trailingWhiteSpaces = 0;
    } else {
        term.write("\r\n");
        for (const c of completion) {
            term.write(c + "\r\n");
        }
        term.write(prompt());
        term.write(currentLine);
    }
}

/**
 * Process what happens when arrow key commands are executed.
 */
function handleArrowKeys(seq) {
    let currentLine = getCurrentCommandLine(true);

    // UP ARROW
    if (seq === '\u001B\u005B\u0041') {
        if (history.length === 0 || historyCursor === 0) {
            return;
        }
        if (historyCursor === -1) {
            historyCursor = history.length -1;
        } else {
            historyCursor -= 1;
        }
        eraseCurrentCommandLine();
        term.write(history[historyCursor]);
    }

    // DOWN ARROW
    if (seq === '\u001B\u005B\u0042') {
        if ((historyCursor === -1) || (historyCursor === history.length -1)) {
            return;
        }
        historyCursor += 1;
        eraseCurrentCommandLine();
        term.write(history[historyCursor]);
    }

    // RIGHT ARROW
    if (seq === '\u001B\u005B\u0043') {
        if(termBuffer.cursorX < promptLength() + currentLine.length) {
            term.write(seq);
        }
    }
    // LEFT ARROW
    if (seq === '\u001B\u005B\u0044') {
        if(termBuffer.cursorX > promptLength()) {
            term.write(seq);
        }
    }
}

// Non-control character regex
const notControl = /^[\S\s]$/;

/**
 * Processes and executes the character commands when inputted.
 * @param seq: Input typed into the terminal, generally a single character
 */
async function processInput(seq) {
    // COMMENTED OUT DEBUGGING CODE TO BE REMOVED
    // console.log(seq.length + " " + seq.charCodeAt(0).toString(16));

    // Ignores any input if a file is open
    if(fileOpen) {
        return;
    }

    let wasBackSpace = false;
    // Switch statement to handle special characters
    switch(seq) {
        // Case to handle Ctrl-C to cancel input
        case '\x03':
            term.write(`^C\r\n` + prompt());
            break;
        // Case to handle backspace
        case '\x7f':
            if(termBuffer.cursorX > filesystem.getWorkingDir().length + 2) {
                term.write("\u001B\u005B\u0044");
                term.write(' ');
                term.write("\u001B\u005B\u0044");
            }
            trailingWhiteSpaces++;
            break;
        // Case to trigger command processing
        case '\t':
            handleTab();
            break;
        case '\r':
            let commandLine = getCurrentCommandLine(true).trimLeft();
            term.write('\r\n')
            let executedCommandLine;
            let p = processCommand(commandLine);
            executedCommandLine = await p;

            historyCursor = -1;
            term.write(prompt());
            trailingWhiteSpaces = 0;
            break;
        // Otherwise write to console.
        default:
            // Since arrow keys are handled differently and there are other control characters not implemented
            if(notControl.test(seq)) {
                term.write(seq);
                trailingWhiteSpaces--;
                if (trailingWhiteSpaces < 0) trailingWhiteSpaces = 0;
            } else if(seq.length === 3 && seq.charAt(0) === '\x1b') {
                handleArrowKeys(seq);
                trailingWhiteSpaces = 0;
            }
    }
    // console.log("trailing: "  + trailingWhiteSpaces);
}

/**
 * Justify text by adding required "\r\n" characters.
 * @param text: the text to justify
 * @param numColumns: the number of columns
 * @param leftTrim: true/false
 * @param leaveBlankLines: true/false
 * @return the justified text.
 */
function justifyText(text, numColumns, leftTrim, leaveBlankLines) {
    let lines = text.split("\n");
    let new_lines = [];
    for (let l of lines) {
        let col = 0;
        let words = l .split(" ");
        let new_line = "";
        for (let i=0; i < words.length; i++)  {
            let w = words[i];
            if (col + w.length + 1 < numColumns) {
                new_line += w + " ";
                col += w.length + 1;
            } else if (w.length > numColumns) {
                new_line += w;
                new_lines.push(new_line);
                new_line = "";
                col = 0;
            } else {
                new_lines.push(new_line)
                new_line = w + " ";
                col = w.length + 1;
            }
        }
        new_lines.push(new_line);
    }
    let valid_lines = [];
    for (let l of new_lines) {
        if (l === undefined) continue;
        if (l.trim() === "" && !leaveBlankLines) continue
        valid_lines.push(l);
    }

    let justified = "";
    for (let i=0; i < valid_lines.length; i++) {
        valid_lines[i] = valid_lines[i].trimRight()
        if (leftTrim) {
            valid_lines[i] = valid_lines[i].trimLeft();
        }
        justified += valid_lines[i] + "\r\n";
    }

    return justified;
}



/**
 * Print help messages
 * @param topic: help topic
 */
function printHelp(topic) {
    let helpMessage = "";

    if (topic === "") {
        helpMessage += "Invoke the help command as follows for help on these topics:\n";
        helpMessage += "  - help about: what this is all about\n";
        helpMessage += "  - help shell: supported Shell commands\n";
        helpMessage += "  - help slurm: supported Slurm commands";
    } else if (topic === "about") {
        helpMessage += "This terminal provides a simulation of a batch-scheduled cluster's head node. ";
        helpMessage += "The cluster hosts \u001B[1m" + num_cluster_nodes + " compute nodes\u001B[0m, which can be ";
        helpMessage += "used to execute parallel programs.\n\n"
        helpMessage += "A parallel program called \u001B[1m" + pp_name + "\u001B[0m is located in your home ";
        helpMessage += "directory  (at path '/'). Its \u001B[1msequential execution time\u001B[0m on one compute ";
        helpMessage += "node is \u001B[1m" + (pp_seqwork + pp_parwork) + "\u001B[0m seconds. ";
        helpMessage += "But \u001B[1m" + pp_parwork + " seconds\u001B[0m of this execution can be \u001B[1mperfectly parallelized\u001B[0m "
        helpMessage += "across multiple compute nodes.\n\n";
        helpMessage += "Your goal is to execute this program by submitting a batch job to Slurm.  ";
        helpMessage += "Refer to the pedagogic module narrative for more information on what you should do.\n\n";
        helpMessage += "Important: this is all in simulated time, which allows you to fast forward at will ";
        helpMessage += "(using the 'sleep' shell command, which returns quicker than you think and advances the simulated time!)";
    } else if (topic === "shell") {
        helpMessage += "This terminal supports simple versions of the following commands:\n\n";
        helpMessage += "  - \u001B[1msleep [[h:]m:]s\u001B[0m      (block for pecified amount of time,\n";
        helpMessage += "                          ~10000x faster than real time)\n";
        helpMessage += "  - \u001B[1mclear\u001B[0m                (clear the terminal)\n";
        helpMessage += "  - \u001B[1mpwd\u001B[0m                  (show working directory)\n";
        helpMessage += "  - \u001B[1mcd <path>\u001B[0m            (change working directory)\n";
        helpMessage += "  - \u001B[1mls [-l] [path]\u001B[0m       (list files, -l for full info))\n";
        helpMessage += "  - \u001B[1mcat <path to file>\u001B[0m   (show file content)\n";
        helpMessage += "  - \u001B[1mcp <path> <path>\u001B[0m     (copy files)\n";
        helpMessage += "  - \u001B[1mrm [-r] <path>\u001B[0m       (remove files, -r for recursive)\n";
        helpMessage += "  - \u001B[1mdate\u001B[0m                 (show current date UTC)\n";
        helpMessage += "  - \u001B[1mhistory\u001B[0m              (show command history, \n";
        helpMessage += "                          supports !! and !<num> to recall commands)\n";
        helpMessage += "  - \u001B[1medit <path to file>\u001B[0m  (edit a file)";
    } else if (topic === "slurm") {
        helpMessage += "This terminal supports simple versions of the following Slurm commands:\n\n";
        helpMessage += "  - \u001B[1msbatch <path to .slurm file>\u001B[0m   (submit a batch job)\r\n";
        helpMessage += "  - \u001B[1msqueue\u001B[0m                         (show batch queue state)\n";
        helpMessage += "  - \u001B[1mscancel <job name>\u001B[0m             (cancel batch job)\n\n";
        helpMessage += "Your home directory (at path '/') contains a file called 'batch.slurm', which is a Slurm batch script. ";
        helpMessage += "You can edit this file with the 'edit' command.";
    } else {
        helpMessage = "help: unknown help topic";
    }
    term.write(justifyText(helpMessage + "\n", 70, false, true));
}

async function resetSimulation() {

    // Sends a POST request to the server
    let res = await fetch(`http://${serverAddress}/reset`, { method: 'POST'});

    term.clear();

    // Do a start
    await fetch(`http://${serverAddress}/start`, { method: 'POST' });

    filesystem.resetTime();

    // Erase the prompt because it seems it's still there... not sure why
    for (let i=0; i < promptLength(); i++) {
        term.write("\b");
    }
    term.write("All .out and .err files have been removed and time was reset to zero.\r\n");
    term.write("Type 'help' for instructions...\r\n\r\n" + prompt())

    // Query server for current time and update clock
    let serverTime = await queryServer();
    simTime.setTime(serverTime);
    updateClock();

}

/**
 * Initializes the terminal to be usable on webapp.
 */
function initializeTerminal() {
    let doc = document.getElementById('terminal');
    term.open(doc);
    term.setOption('cursorBlink', true);
    // Currently experimental hence this weird calling approach which does not match xterm docs
    termBuffer = term.buffer.active;

    // Add pre-existing files into filesystem
    filesystem.createFile("batch.slurm", 0, false, false);
    filesystem.createFile(pp_name, 0, true, false);
    // filesystem.createFile("README_shell", 0, false, false);
    // filesystem.createFile("README_slurm", 0, false, false);

    // Add text to files
    let batchSlurm = "#!/bin/bash\n#SBATCH --nodes=" + num_cluster_nodes;
    batchSlurm += "\n#SBATCH --tasks-per-node=1\n#SBATCH --cpus-per-task=10\n#SBATCH --time ";
    batchSlurm += "10:00:00";
    batchSlurm += "\n#SBATCH --error=job-%A.err\n#SBATCH --output=job-%A.out\nsrun ./" + pp_name;
    filesystem.saveFile("batch.slurm", batchSlurm);
    filesystem.saveFile(pp_name, "This is binary.");

    // Finalize setup
    fitAddon.fit();
    term.write("Terminal initialized. Type 'help' for instructions...\r\n\r\n" + prompt())
    term.onData(processInput);
    term.focus();
}

/**
 * Sends a get request to server to get current server simulated time and events which occurred.
 */
async function queryServer() {
    let res = await fetch(`http://${serverAddress}/query`, { method: 'GET' });
    res = await res.json();
    handleEvents(res.events);
    // console.log("SERVER TOLD ME TIME = " + res["time"]);
    return res["time"];
}

/**
 * Handles all events generated by server and creates corresponding files for success.
 * @param events: Array of events containing complete and failures from server
 */
async function handleEvents(events) {
    // Loop through array of events
    for(const e of events) {
        // Parse through events
        let eParse = e.split(" ");
        let time = Math.round(parseFloat(eParse[0]));
        let status = eParse[1];
        let jobName = eParse[3].slice(0, -1);

        // Checks if job has been completed and creates a binary file representative of output file.
        if(status === "StandardJobCompletedEvent") {
            let fileName = jobName.split("_").slice(1).join("_") + ".out";
            filesystem.createFile(fileName, time * 1000, false, true);
            filesystem.saveFile(fileName, "Job successfully completed");
        } else if (status === "StandardJobFailedEvent") {
            let fileName = jobName.split("_").slice(1).join("_") + ".err";
            filesystem.createFile(fileName, time * 1000, false, true);
            filesystem.saveFile(fileName, "Program killed due to job expiring");
        } else {
            console.log("Unknown event status: " + status);
        }
    }
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
    } else if(hour === 0) {
        hour = 12;
    }
    clock.innerText = `${hour}${simTime.toISOString().substr(13,6)} ${AMPM}`;
}

/**
 * Function called every second to update the clock and query the server.
 */
async function updateClockAndQueryServer() {
    // Increment simulation time by 1 second
    simTime.setTime(simTime.getTime() + 1000);

    // Query server for current time
    let serverTime = await queryServer();
    if(Math.abs(serverTime - simTime.getTime()) > 500) {
        simTime.setTime(serverTime);
    }

    updateClock();
}

/**
 * Adds x minute to clock and updates server.
 */
async function addTime(numSeconds) {

    simTime.setTime(simTime.getTime() + numSeconds * 1000);
    let body = {
        increment: numSeconds
    };
    let res = await fetch(`http://${serverAddress}/addTime`, { method: 'POST', body: JSON.stringify(body)});
    res = await res.json();
    handleEvents(res.events);
    updateClock();
}


/**
 * Entry function to run after the HTML has fully loaded.
 */
function main() {

    // Set up functions which need to be updated every specified interval
    setInterval(updateClockAndQueryServer, 1000);

    // Initialize server clock and retrieve parallel program info
    fetch(`http://${serverAddress}/start`, { method: 'POST' })
        .then(res => res.json())
        .then(res => {
            // Prints the cancellation success
            // term.write("\r" + res["pp_name"] + "\r\n" + prompt());
            pp_name = res["pp_name"];
            pp_seqwork = res["pp_seqwork"];
            pp_parwork = res["pp_parwork"];
            num_cluster_nodes = res["num_cluster_nodes"];
            initializeTerminal();
        });

    // Get and set DOM elements
    clock = document.getElementById('clock');
    textArea = document.getElementById('textArea');
    batchEditor = document.getElementById('batchEditor');
    resetButton = document.getElementById('resetbutton');
    cancelButton = document.getElementById('cancel');
    saveAndExitButton = document.getElementById('exit');
    slurmNodesInput = document.getElementById('slurmNodes');
    slurmHoursInput = document.getElementById('slurmHours');
    slurmMinutesInput = document.getElementById('slurmMinutes');
    slurmSecondsInput = document.getElementById('slurmSeconds');

    // Setup event handlers
    resetButton.addEventListener("click", resetSimulation, false);
    cancelButton.addEventListener("click", exitTextEditor, false);
    saveAndExitButton.addEventListener("click", saveAndExitTextEditor, false);
    slurmNodesInput.addEventListener("change", changeBatch, false);
    slurmHoursInput.addEventListener("change", changeBatch, false);
    slurmMinutesInput.addEventListener("change", changeBatch, false);
    slurmSecondsInput.addEventListener("change", changeBatch, false);
}

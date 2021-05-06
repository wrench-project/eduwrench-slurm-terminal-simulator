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

// Create command history
let history = []
let historyCursor = -1;
const historyDepth = 16;

// Holds current simulation time
let simTime = new Date(0);

// Flag to signify whether text is being edited
let fileOpen = false;

// Variables to hold DOM elements
let clock;
let add1Button;
let add10Button;
let add60Button;
let textArea;
let batchEditor;
let saveAndExitButton;
let slurmNodesInput;
let slurmHoursInput;
let slurmMinutesInput;
let slurmSecondsInput;

// batch.slurm variables
let slurmNodes = 2;
let slurmHour = 0;
let slurmMinute = 1;
let slurmSeconds = 0;

// parallel program characteristics
let pp_name;

// Once HTML is loaded run main function
window.onload = main;

// Miscellaneous values
let openedFile = "";
// let jobNum = 1;
//let serverAddress = "192.168.0.20/api";
let serverAddress = "localhost/api";

// Unsupported commands with error messages
let unsupportedCommands = {};
unsupportedCommands["vi"] = "(use the 'edit' command)";
unsupportedCommands["nano"] = "(use the 'edit' command)";
unsupportedCommands["jedit"] = "(use the 'edit' command)";
unsupportedCommands["emacs"] = "(use the 'edit' command)";

/**********************************************************************/
/* HELPER FUNCTIONS                                                   */
/**********************************************************************/

function prompt() {
    return `${filesystem.getWorkingDir()}$ `;
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
function getCurrentCommandLine() {
    // Retrieves the current line number of the terminal. Currently might have a bug in the library since it is
    // experimental for the version being used.
    let lineNum = termBuffer.cursorY + termBuffer.viewportY;
    // Return the trimmed line
    return termBuffer.getLine(lineNum).translateToString(true).split(/^.*?\$ /)[1];
}

// Function to erase the current command line
function eraseCurrentCommandLine() {
    let totalNumCharacters = getCurrentCommandLine().length;
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
 * Saves the file to fake filesystem and returns control to terminal
 * while hiding text editor
 */
function exitFile() {
    // Saves file to filesystem
    filesystem.saveFile(openedFile, textEditor.innerText);

    // Adjust the editing area and environmental values
    textArea.contentEditable = false;
    textArea.style.display = "none";
    batchEditor.style.display = "none";
    openedFile = "";
    fileOpen = false;

    // This particular line is needed if closing the editBatchFile. Doesn't
    // effect regular file opening
    textEditor.setAttribute("contentEditable", true);

    // Restarts blinking on line.
    term.setOption('cursorBlink', true);
}

/**
 * Opens up the batch configuration file.
 * @param filename: Name of file to open
 * @param text: Text in the file to be opened
 */
function editBatchFile(filename, text) {
    // Makes sure the text is not directly editable.
    textEditor.setAttribute("contentEditable", false);
    // Sets up the current variables of file to be displayed in the form.
    slurmNodesInput.value = slurmNodes;
    slurmHoursInput.value = padZero(slurmHour.toString());
    slurmMinutesInput.value = padZero(slurmMinute.toString());
    slurmSecondsInput.value = padZero(slurmSeconds.toString());

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
    slurmNodes = parseInt(slurmNodesInput.value);
    slurmHour = parseInt(slurmHoursInput.value);
    slurmMinute = parseInt(slurmMinutesInput.value);
    slurmSeconds = parseInt(slurmSecondsInput.value);

    // Retrieves the string version of the values.
    let slurmNodesText = slurmNodes.toString();
    let slurmHourText = padZero(slurmHour.toString());
    let slurmMinuteText = padZero(slurmMinute.toString());
    let slurmSecondsText = padZero(slurmSeconds.toString());

    // Regenerates the content displayed.
    let batchSlurm = "#!/bin/bash\n#SBATCH --nodes=" + slurmNodesText;
    batchSlurm += "\n#SBATCH --tasks-per-node=1\n#SBATCH --cpus-per-task=10\n#SBATCH --time ";
    batchSlurm += slurmHourText + ":" + slurmMinuteText + ":" + slurmSecondsText;
    batchSlurm += "\n#SBATCH --output=job-%A.err\n#SBATCH --output=job-%A.out\nsrun ./" + pp_name;
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


    // console.log("jobNum = " + jobNum);
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
        // filesystem.createFile(".err", simTime.getTime());
        // filesystem.saveFile(".err", "Number of nodes exceeds what is available in system");
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
function getQueue() {
    // Makes GET request to get the current queue
    fetch(`http://${serverAddress}/getQueue`, { method: 'GET' })
        .then(res => res.json())
        .then(res => {
            // Writes the table headers
            term.write('\rJOBNAME         USER       NODES TIME         STATUS\r\n');
            // Writes to terminal each job within the queue
            for(const q of res.queue) {
                let q_parse = q.split(",");
                // Sets job name which will display only 15 characters
                let jobName = q_parse[1].split("_").slice(1).join("_").slice(0,15);
                // Sets user name which will display only 10 characters
                let user = q_parse[0].slice(0,10);
                // Sets up node count
                let nodes = q_parse[2];
                // Sets the startTime to closest whole millisecond value
                let startTime = Math.round(parseFloat(q_parse[4]));
                // Sets up variable if startTime is not available since job isn't running
                let sTime = "0           "
                // Sets up variable which could change if job is running or not.
                let status = 'RUNNING';
                // Pads the string with spaces to make sure it fits into table formatting
                while(jobName.length < 15) {
                    jobName += ' ';
                }
                while(user.length < 10) {
                    user += ' ';
                }
                while(nodes.length < 5) {
                    nodes += ' ';
                }
                // Sets up the startTime variable correctly where if negative means it's not running.
                if(startTime < 0) {
                    status = 'READY';
                } else {
                    // Finds out the time and correctly generates the UTC time
                    let t = new Date(0);
                    t.setSeconds(startTime);
                    sTime = padZero(t.getUTCHours()) + ":" + padZero(t.getUTCMinutes()) +
                        ":" + padZero(t.getUTCSeconds()) + " UTC";
                }
                // Write to terminal the job
                term.write(`${jobName} ${user} ${nodes} ${sTime} ${status}` + "\r\n");
            }
            term.write(prompt());
        });
}

/**
 * Runs specified commands and faked programs.
 */
async function processCommand(commandLine) {

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

    // Print command-history
    if(command === "history") {
        for (let i = Math.max(0, history.length - historyDepth); i < history.length; i++) {
            term.write(" " + padIntegerWithSpace(i+1, history.length ) + "  " + history[i] + "\r\n");
        }
        return;
    }


    // List files in the filesystem in specified directory.
    if(command === "ls") {
        let ls;
        // If multiple command line arguments, request the faked filesystem to retrieve those filenames,
        // otherwise if only ls, then the current directory.
        if(commandLineTokens.length === 2) {
            ls = filesystem.listFiles(commandLineTokens[1]);
        } else if (commandLineTokens.length === 1) {
            ls = filesystem.listFiles();
        } else {
            term.write("ls: too many arguments\r\n");
            return;
        }
        if (ls[0] !== "") {
            term.write(ls[0]+"\r\n");
            return;
        }
        // If no error, print file names to console.
        const maxColumn = 80;
        if (ls[0] === "") {
            let columnsUsed = 0;
            for (const name of ls[1]) {
                if (name.length < maxColumn && columnsUsed + name.length > maxColumn) {
                    term.write("\r\n");
                    term.write(name + "    ");
                    columnsUsed = 0;
                } else {
                    term.write(name + "    ");
                }
                columnsUsed += name.length + 4;
            }
            if (columnsUsed > 0) {
                term.write("\r\n");
            }
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
                    term.write(f + "\r\n");
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
                let f = filesystem.createFile(commandLineTokens[i], simTime.getTime());
                // If filesystem returns an error, print out error.
                if(f !== "") {
                    term.write(f + "\r\n");
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
        let f = filesystem.copyFile(commandLineTokens[1], commandLineTokens[2]);
        if (f !== "") {
            term.write(f + "\r\n");
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
                term.write(f + "\r\n");
            }
            return;
        }
        // Handles recursive rm
        if(commandLineTokens[1] === "-r") {
            // Removes all the files using filesystem
            for(let i = 2; i < commandLineTokens.length; i++) {
                let f = filesystem.removeFile(commandLineTokens[i], true);
                if(f !== "") {
                    term.write(f + "\r\n");
                }
            }
            return;
        }
        // Handle multiple arguments non-recursive
        for(let i = 1; i < commandLineTokens.length; i++) {
            let f = filesystem.removeFile(commandLineTokens[i]);
            if(f !== "") {
                term.write(f + "\r\n");
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
        getQueue();
        return;
    }
    // Command to cancel a job.
    if(command === "scancel") {
        // Since the command requires an argument checks for that otherwise prints error.
        if(commandLineTokens.length > 1) {
            cancelJob(commandLineTokens[1]);
        } else {
            term.write("squeue: missing argument\r\n");
        }
        return;
    }

    // Implements equivalent of date -r in linux systems to print date of creation
    if(command === "date") {
        const printDate = function(t) {
            let d = new Date(t);
            let time = padZero(d.getUTCHours()) + ":" + padZero(d.getUTCMinutes()) + ":" + padZero(d.getUTCSeconds()) + " UTC";
            term.write(padZero(d.getUTCMonth() + 1) + "/" + padZero(d.getUTCDate()) + " " + time + "\r\n");
        };

        if (commandLineTokens.length === 1) {
            printDate(simTime.getTime());
        } else if (commandLineTokens.length === 3) {
            // Since the command requires an argument checks for that otherwise prints error.
            if (commandLineTokens[1] !== "-r") {
                term.write("Usage: date [-r <path>]\r\n");
            } else {
                let f = filesystem.getDate(commandLineTokens[2]);
                if (f === "") {
                    term.write("date: file does not exist\r\n");
                } else {
                    // Prints date without printing the year
                    printDate(f);
                }
            }
        } else {
            term.write("Usage: date [-r <path>]\r\n");
        }
        return;
    }
    term.write(`command '${command}' not found.\r\n`);
}

/**
 * Process TAB completion
 */
function handleTab() {
    let currentLine = getCurrentCommandLine();
    let tokens = currentLine.trim().split(" ");
    let lastWord = tokens[tokens.length - 1];
    let completion = filesystem.tabCompletion(lastWord);
    if (completion.length === 1) {
        term.write("\b \b".repeat(lastWord.length));
        term.write(completion[0]);
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
    let currentLine = getCurrentCommandLine();

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
        if(termBuffer.cursorX < prompt().length + currentLine.length) {
            term.write(seq);
        }
    }
    // LEFT ARROW
    if (seq === '\u001B\u005B\u0044') {
        if(termBuffer.cursorX > 3) {
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
    // Switch statement to handle special characters
    switch(seq) {
        // Case to handle Ctrl-C to cancel input
        case '\x03':
            term.write(`^C\r\n` + prompt());
            break;
        // Case to handle backspace
        case '\x7f':
            if(termBuffer.cursorX > filesystem.getWorkingDir().length + 2) {
                term.write('\b \b');
            }
            break;
        // Case to trigger command processing
        case '\t':
            handleTab();
            break;
        case '\r':
            let commandLine = getCurrentCommandLine().trim();
            term.write('\r\n')
            let executedCommandLine;
            let p = processCommand(commandLine);
            executedCommandLine = await p;

            historyCursor = -1;
            term.write(prompt());
            break;
        // Otherwise write to console.
        default:
            // Since arrow keys are handled differently and there are other control characters not implemented
            if(notControl.test(seq)) {
                term.write(seq);
            } else if(seq.length === 3 && seq.charAt(0) === '\x1b') {
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

    // Add pre-existing files into filesystem
    filesystem.createFile("batch.slurm", 0, false, false);
    filesystem.createFile(pp_name, 0, true, false);
    filesystem.createFile("README", 0, false, false);

    // Add text to files
    let batchSlurm = "#!/bin/bash\n#SBATCH --nodes=" + slurmNodes;
    batchSlurm += "\n#SBATCH --tasks-per-node=1\n#SBATCH --cpus-per-task=10\n#SBATCH --time ";
    batchSlurm += "00:01:00";
    batchSlurm += "\n#SBATCH --output=job-%A.err\n#SBATCH --output=job-%A.out\nsrun ./" + pp_name;
    filesystem.saveFile("batch.slurm", batchSlurm);

    filesystem.saveFile(pp_name, "This is binary.");


    let READMEText = "This terminal supports simple versions of the following commands:\n";
    READMEText += "  - clear (clear the terminal)\n";
    READMEText += "  - pwd (show working directory)\n";
    READMEText += "  - cd <path> (change working directory)\n";
    READMEText += "  - ls [path] (list files)\n";
    READMEText += "  - cat <path to file> (show file content)\n";
    READMEText += "  - cp <path> <path> (copy files)\n";
    READMEText += "  - rm [-r] <path> (remove files)\n";
    READMEText += "  - date [-r <path>] (show current date or a file's last modification date)\n";
    READMEText += "  - history (show command history, support !! and !x to recall commands)\n";
    READMEText += " It also supports simple versions of the following Slurm commands\n";
    READMEText += "  - sbatch <path to .slurm file> (submit a batch job)\n";
    READMEText += "  - squeue (show batch queue)\n";
    READMEText += "  - scancel <job name> (cancel batch job)\n";
    READMEText += "Finally, it supports a non-standard command to edit files:\n";
    READMEText += "  - edit <path to file>\n";

    filesystem.saveFile("README", READMEText);

    // Finalize setup
    fitAddon.fit();
    term.write("Terminal initialized...\r\n\r\n/$ ")
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
    return res["time"];
}

/**
 * Handles all events generated by server and creates corresponding files for success.
 * @param events: Array of events containing complete and failures from server
 * @param time: Current server time to represent what time output file will be created
 */
async function handleEvents(events) {
    // Loop through array of events
    for(const e of events) {
        // Parse through events
        let eParse = e.split(" ");
        let time = Math.round(parseFloat(eParse[0]));
        let status = eParse[1];
        let jobName = eParse[3].slice(0, -1);

        console.log("---> event = " + status);
        // Checks if job has been completed and creates a binary file representative of output file.
        if(status === "StandardJobCompletedEvent") {
            let fileName = jobName.split("_").slice(1).join("_") + ".out";
            filesystem.createFile(fileName, time * 1000);
            filesystem.saveFile(fileName, "Job successfully completed");
        } else if (status == "StandardJobFailedEvent") {
            let fileName = jobName.split("_").slice(1).join("_") + ".err";
            filesystem.createFile(fileName, time * 1000);
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
 * FUNCTIONS USED TO HANDLE MOVING TIME BUTTONS
 */

// TODO: Implement waitForNextEvent functionality. Will require server changes
// where the event will be returned as part of the json object where the handleEvent
// functio here will be called. Time will be updated accordingly
function waitNext() {

}

/**
 * Adds 1 minute to clock and updates server.
 */
async function add1() {
    simTime.setTime(simTime.getTime() + 60000);
    let res = await fetch(`http://${serverAddress}/add1`, { method: 'POST' });
    res = await res.json();
    handleEvents(res.events);
    updateClock();
}

/**
 * Adds 10 minute to clock and updates server.
 */
async function add10() {
    simTime.setTime(simTime.getTime() + 600000);
    let res = await fetch(`http://${serverAddress}/add10`, { method: 'POST' });
    res = await res.json();
    handleEvents(res.events);
    updateClock();
}

/**
 * Adds 1 hour to clock and updates server.
 */
async function add60() {
    simTime.setTime(simTime.getTime() + 3600000);
    let res = await fetch(`http://${serverAddress}/add60`, { method: 'POST' });
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

    let response;

    // Initialize server clock and retrieve parallel program info
    fetch(`http://${serverAddress}/start`, { method: 'POST' })
        .then(res => res.json())
        .then(res => {
            // Prints the cancellation success
            // term.write("\r" + res["pp_name"] + "\r\n" + prompt());
            pp_name = res["pp_name"];
            initializeTerminal();
        });


    // Get and set DOM elements
    clock = document.getElementById('clock');
    textArea = document.getElementById('textArea');
    batchEditor = document.getElementById('batchEditor');
    add1Button = document.getElementById('add1');
    add10Button = document.getElementById('add10');
    add60Button = document.getElementById('add60');
    saveAndExitButton = document.getElementById('exit');
    slurmNodesInput = document.getElementById('slurmNodes');
    slurmHoursInput = document.getElementById('slurmHours');
    slurmMinutesInput = document.getElementById('slurmMinutes');
    slurmSecondsInput = document.getElementById('slurmSeconds');


    // Setup event handlers
    add1Button.addEventListener("click", add1, false);
    add10Button.addEventListener("click", add10, false);
    add60Button.addEventListener("click", add60, false);
    saveAndExitButton.addEventListener("click", exitFile, false);
    slurmNodesInput.addEventListener("change", changeBatch, false);
    slurmHoursInput.addEventListener("change", changeBatch, false);
    slurmMinutesInput.addEventListener("change", changeBatch, false);
    slurmSecondsInput.addEventListener("change", changeBatch, false);
}

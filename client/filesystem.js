/**
 * Fakes the filesystem for terminal with implementation of filesystem using a json object.
 * 
 * Each file is a json object containing the creation date as a millisecond numeric value,
 * type as a string, and finally the data it contains within as a string.
 * 
 * Each directory is a json object containing the creation date as a millisecond numeric value,
 * type listed as a directory as a string, and another json object holding json objects representing
 * files and directories.
 */
export class Filesystem {
    constructor() {
        this.filesystem = {};
        this.currentDir = this.filesystem;
        this.path = [];
        this.getPath = getPath;
        this.ls = ls;
        this.cd = cd;
        this.mkdir = mkdir;
        this.rm = rm;
        this.open = openFile;
        this.create = createFile;
        this.createBinary = createBinaryFile;
        this.save = saveFile;
        this.getDate = date;
    }
}

/**
 * Retrieves the current direcotry path (like pwd) of the filesystem.
 * @returns String containing working directory path.
 */
function getPath() {
    let output = "~";
    // Iterates through the path (implemented as an array of strings) to create a correctly formatted string.
    for(const p of this.path) {
        output += "/" + p;
    }
    return output;
}

/**
 * Lists items in the working directory like ls.
 * @param {Directory or file name} loc 
 * @returns List of files/directories if directory. File name if file name.
 */
function ls(loc = null) {
    let output = "";
    // Checks if exists. If null, current working directory.
    if(loc == null) {
        // Loops through all items in directory
        for(const key in this.currentDir) {
            // If directory add slash and if file, just print as is. All values tab-separated.
            if(this.currentDir[key].type != "dir") {
                output += key + " \t";
            } else {
                output += key + "/ \t";
            }
        }
        return output;
    }
    // If no file found at all
    if(this.currentDir[loc] == null) {
        return "No such file or directory";
    }
    if(this.currentDir[loc].type != "dir") {
        return loc;
    }

    // Loops through all items in directory
    let n_dir = this.currentDir[loc].data;
    for(const key in n_dir) {
        // If directory add slash and if file, just print as is. All values tab-separated.
        if(n_dir[key].type != "dir") {
            output += key + " \t";
        } else {
            output += key + "/ \t";
        }
    }
    return output;
}

/**
 * Changes directory like cd.
 * @param {Directory name} loc 
 * @returns true if directory can be changed, false if failed.
 */
function cd(loc) {
    // Handle going up one directory
    if(loc == "..") {
        // Checks if already in home directory, can't go up further than this.
        if(this.path.length == 0) {
            return false;
        }

        // Handle directory change
        let lastDir = this.path.pop();
        let currDir = this.filesystem;
        // Loops through path as it goes through the directories to the right one.
        // Needed because there is no way to store the directory above.
        for(const p of this.path) {
            currDir = currDir[p].data;
        }
        // Saves any changes.
        currDir[lastDir].data = this.currentDir;
        this.currentDir = currDir;
        return true;
    }
    // If going to same directory
    if(loc == ".") {
        return true;
    }
    // If what you want is a file.
    if(this.currentDir[loc] == null || this.currentDir[loc].type != "dir") {
        return false;
    }
    
    // If selecting a directory sets the current directory to the nested one.
    this.path.push(loc);
    this.currentDir = this.currentDir[loc].data;
    return true;
}

/**
 * Creates a directory like mkdir
 * @param {Name of directory} name 
 * @param {Current time to hold creation time} time 
 * @returns 
 */
function mkdir(name, time) {
    // Checks if name already exists.
    if(this.currentDir[name] == null) {
        // Creates the object needed to represent a directory.
        this.currentDir[name] = {
            type: "dir",
            created: time,
            data: {}
        };
        return "";
    }
    return `Cannot create directory '${name}': File exists`;
}

/**
 * Removes files in simulated filesystem.
 * @param {Name of item to remove} name 
 * @param {Flag to remove directories as well} recursive 
 * @returns Error string. Empty string if successful.
 */
function rm(name, recursive = false) {
    // Checks if exists.
    if(this.currentDir[name] == null) {
        return "No such file or directory";
    }
    // Checks if recursive then a simple delete is sufficient.
    if(recursive) {
        delete this.currentDir[name];
        return "";
    }
    // Checks if it is a file and not a directory because recursive flag is not set.
    if(this.currentDir[name].type == "text" || this.currentDir[name].type == "bin") {
        delete this.currentDir[name];
        return "";
    }
    return `${name} is a directory`;
}

/**
 * Opens a file in the simulated filesystem.
 * @param {File name} name 
 * @returns Data in the file so all the text inside the file. -1 if binary otherwise null if directory or doesn't exist.
 */
function openFile(name) {
    // If an editable file, return the text.
    if(this.currentDir[name].type == "text") {
        return this.currentDir[name].data;
    }
    // Fail if binary or directory or doesn't exist.
    if(this.currentDir[name].type == "bin") {
        return -1;
    }
    return null;
}

/**
 * Creates an editable file.
 * @param {File name} name 
 * @param {Creation time in milliseconds} time 
 * @returns Error string. Empty string if successful.
 */
function createFile(name, time) {
    // Checks if file already exists. If not then creates the needed object with info. File text is set as empty.
    if(this.currentDir[name] == null) {
        this.currentDir[name] = {
            type: "text",
            created: time,
            data: ""
        };
        return "";
    }
    return `Cannot create file '${name}': File exists`;;
}

/**
 * Creates a binary file (not editable).
 * @param {File name} name 
 * @param {Creation time in milliseconds} time 
 */
function createBinaryFile(name, time) {
    // Creates a binary file with no check since there should be no direct user interaction with this functionality.
    this.currentDir[name] = {
        type: "bin",
        created: time,
        data: ""
    };
}

/**
 * Changes the text data inside the file so that it saves it.
 * @param {File name} fileName 
 * @param {Text to be written} data 
 * @returns True if success false if no file.
 */
function saveFile(fileName, data) {
    if(this.currentDir[fileName].type == "text") {
        this.currentDir[fileName].data = data;
        return true;
    }
    return false;
}

/**
 * Implements the date of creation functionality. Should be similar to date -r
 * @param {Name of file} fileName 
 * @returns Time created in milliseconds
 */
function date(fileName) {
    if(this.currentDir[fileName] == null) {
        return "";
    }
    return this.currentDir[fileName].created;
}

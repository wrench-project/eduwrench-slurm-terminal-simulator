/**
 * Fakes the filesystem for terminal.
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
        this.save = saveFile;
    }
}

// TODO: Convert structure of filesystem to include type and data rather as an intermediary rather than
//       the file/folder itself.

function getPath() {
    let output = "~";
    for(const p of this.path) {
        output += "/" + p;
    }
    return output;
}

function ls(loc = null) {
    let output = "";
    if(loc == null) {
        for(const key in this.currentDir) {
            if(this.currentDir[key][type] != "dir") {
                output += key + " \t";
            } else {
                output += key + "/ \t";
            }
        }
        return output;
    }
    if(this.currentDir[loc] == null) {
        return "No such file or directory";
    }
    if(this.currentDir[loc][type] != "dir") {
        return loc;
    }
    for(const key in this.currentDir[loc][data]) {
        output += key + " ";
    }
    return output;
}

function cd(loc) {
    // Handle going up one directory
    if(loc == "..") {
        if(this.path.length == 0) {
            return false;
        }
        let lastDir = this.path.pop();
        let currDir = this.filesystem;
        for(const p of this.path) {
            currDir = currDir[p][data];
        }
        currDir[lastDir][data] = this.currentDir;
        this.currentDir = currDir;
        return true;
    }
    // If going to same directory
    if(loc == ".") {
        return true;
    }
    // If what you want is a file.
    if(this.currentDir[loc] == null || this.currentDir[loc] != "dir") {
        return false;
    }
    
    // If selecting a directory
    this.path.push(loc);
    this.currentDir = this.currentDir[loc][data];
    return true;
}

function mkdir(name) {
    if(this.currentDir[name] == null) {
        this.currentDir[name] = {
            type: "dir",
            data: {}
        };
        return "";
    }
    return `Cannot create directory '${name}': File exists`;
}

function rm(name, recursive = false) {
    if(this.currentDir[name] == null) {
        return "No such file or directory";
    }
    if(recursive) {
        delete this.currentDir[name];
        return "";
    }
    if(this.currentDir[name][type] == "text" || this.currentDir[name][type] == "bin") {
        delete this.currentDir[name];
        return "";
    }
    return `${name} is a directory`;
}

function openFile(name) {
    if(this.currentDir[name][type] == "text") {
        return this.currentDir[name][data];
    }
    return null;
}

function createFile(name) {
    if(this.currentDir[name] == null) {
        this.currentDir[name] = {
            type: "text",
            data: ""
        };
        return "";
    }
    return `Cannot create file '${name}': File exists`;;
}

function saveFile(fileName, data) {
    if(this.currentDir[fileName][type] == "text") {
        this.currentDir[fileName][data] = data;
        return true;
    }
    return false;
}
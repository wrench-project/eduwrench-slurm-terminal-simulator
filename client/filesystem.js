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
        this.currentDir = "/";
        this.filesystem["/"] = {
            type: "dir",
            created: 0,
            deletable: false,
            data: ""
        };
        this.ls = ls;
        this.cd = cd;
        this.pwd = pwd;
        this.mkdir = mkdir;
        this.rm = rm;
        this.cp = cp;
        this.openFile = openFile;
        this.createFile = createFile;
        this.save = saveFile;
        this.getDate = date;
        this.getPath = getPath;
        this.normalizePath = normalizePath;
        this.getAbsolutePath = getAbsolutePath;
        this.isInDirectory = isInDirectory;
        this.isSameDirectory = isSameDirectory;
        this.getFileName = getFileName;
        this.getDirPath = getDirPath;
    }
}


/**
 * Retrieves the current directory path (like pwd) of the filesystem.
 * @returns String containing working directory path.
 */
function getPath() {
    return this.currentDir;
}

function pwd() {
    return this.getPath();
}

function isInDirectory(name, dir) {
    let namepath = this.getAbsolutePath(name);
    let dirpath = this.getAbsolutePath(dir);

    if (!namepath.startsWith(dirpath)) {
        return false;
    }
    if (!dirpath.endsWith("/")) {
        dirpath = dirpath + "/";
    }
    namepath = namepath.replace(dirpath, "");
    if ((namepath === "/") || (namepath.indexOf("/") > -1)) {
        return false;
    }
    return true;
}

function isSameDirectory(dir1, dir2) {
    dir1 = this.getAbsolutePath(dir1);
    dir2 = this.getAbsolutePath(dir2);

    return (dir1 === dir2);
}

/**
 * Lists items in the working directory like ls.
 * @param {Directory or file name} loc
 * @returns List of files/directories if directory. File name if file name.
 */
function ls(loc = null) {

    let output = "";
    if (loc == null) {
        loc = this.currentDir
    }
    loc = this.getAbsolutePath(loc);


    if(!(loc in this.filesystem)) {
        return "No such file or directory";
    }

    // It's a file: just print the filename
    if(this.filesystem[loc].type !== "dir") {
        return loc;
    }

    // It's a directory: loops through all items in the file system
    // (whatever, it's not like we'll have thousands of items)
    for(const key in this.filesystem) {
        if (this.isInDirectory(key, loc) && !this.isSameDirectory(key, loc)) {
            if (this.filesystem[key].type !== "dir") {
                output += this.getFileName(key) + " \t";
            } else {
                output += this.getFileName(key) + "/ \t";
            }
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

    if (loc == null) {
        loc = "/";
    }
    loc = this.getAbsolutePath(loc)

    if (!(loc in this.filesystem)) {
        return false;
    }

    if (this.filesystem[loc].type !== "")

        this.currentDir = loc;
    return true;
}

/**
 * Creates a directory like mkdir
 * @param {Name of directory} name
 * @param {Current time to hold creation time} time
 * @returns
 */
function mkdir(name, time) {

    name = this.getAbsolutePath(name);

    if (name in this.filesystem) {
        return "cp: directory already exists";
    }

    // Check that all parent directories exist
    let parent_path = this.getDirPath(name);
    if (!(parent_path in this.filesystem)) {
        return "cp: operation not permitted";
    }

    // Create the directory
    this.filesystem[name] = {
        type: "dir",
        created: time,
        deletable: true,
        data: {}
    };
    return "";
}

/**
 * Removes files or directory in simulated filesystem
 * @param {Name of item to remove} name
 * @param {Flag to remove directories as well} recursive
 * @returns Error string. Empty string if successful.
 */
function rm(name, recursive = false) {

    name = this.getAbsolutePath(name);

    // Checks if exists.
    if(!(name in this.filesystem)) {
        return "No such file or directory";
    }

    // Deletable?
    if (this.filesystem[name].deletable === false) {
        return "Operation not permitted";
    }

    // File deletion
    if (this.filesystem[name].type === "text" || this.filesystem[name].type === "bin") {
        delete this.filesystem[name]
        return "";
    }

    // Non-recursive directory delete is not allowed
    if ((this.filesystem[name].type === "dir") && !recursive) {
        return `${name} is a directory`;
    }

    // Delete of a directory in which we are right now is not allowed
    if (this.isInDirectory(this.currentDir, name) || this.isSameDirectory(this.currentDir, name)) {
        return `Cannot rm current working directory`;
    }

    // Recursive file delete
    if(recursive) {
        for(const key in this.filesystem) {
            if ((this.isSameDirectory(key, name)) || (this.isInDirectory(key, name))) {
                delete this.filesystem[key]
            }
        }
        delete this.filesystem[name];
        return "";
    }
}

/**
 * Copy files or directory, just like cp
 * @param {Source path} srcpath
 * @param {Destination path} dstpath
 * @param {Creation time in milliseconds} time
 * @returns Error string. Empty string if successful.
 */
function cp(srcpath, dstpath, time) {

    srcpath = this.getAbsolutePath(srcpath);
    dstpath = this.getAbsolutePath(dstpath);

    // Checks that the src exists.
    if(!(srcpath in this.filesystem)) {
        return "No such file or directory";
    }

    // Check that the dst is different
    if (srcpath === dstpath) {
        return "cp: source and destination are identical (not copied)";
    }

    if (this.filesystem[srcpath].type === "dir") {
        return "cp: copying directories not supported yet";
    }

    if (this.filesystem[dstpath] != null) {
        // The destination already exist

        // src: file, dst: file
        if (this.filesystem[srcpath].type === "file" && this.filesystem[dstpath].type === "file") {
            if (this.filesystem[dstpath].deletable) {
                delete this.filesystem[dstpath];
                this.filesystem[dstpath] = {
                    type: this.filesystem[srcpath].type,
                    created: time,
                    deletable: true,
                    data: this.filesystem[srcpath].data
                };
                return "";
            } else {
                return "cp: operation not permitted";
            }
        }

        // src: file, dst: dir
        if (this.filesystem[srcpath].type === "file" && this.filesystem[dstpath].type === "dir") {
            let new_path = this.getAbsolutePath(dstpath + this.getFileName(this.filesystem[srcpath]))
            if (this.filesystem[new_path] != null && !this.filesystem[new_path].deletable) {
                return "cp: operation not permitted";
            }
            this.filesystem[new_path] = {
                type: this.filesystem[srcpath].type,
                created: time,
                deletable: true,
                data: this.filesystem[srcpath].data
            }
            return "";
        }

    } else {
        // The destination does not exist, so make sure it's only the last  path element that
        // does not exist
        let dstdir = this.getDirPath(dstpath);
        if (!(dstdir in this.filesystem)) {
            return "cp: operation not permitted";
        }
        // create the file
        this.filesystem[dstpath] = {
            type: this.filesystem[srcpath].type,
            created: time,
            deletable: true,
            data: this.filesystem[srcpath].data
        }
        return ""

    }
}

/**
 * Opens a file in the simulated filesystem.
 * @param {File name} name
 * @returns Data in the file so all the text inside the file. -1 if binary otherwise null if directory or doesn't exist.
 */
function openFile(name) {

    name = this.getAbsolutePath(name);
    if (!(name in this.filesystem)) {
        return null;
    }

    // If an editable file, return the text.
    if(this.filesystem[name].type === "text") {
        return this.filesystem[name].data;
    }
    return -1;
}

/**
 * Creates an editable file.
 * @param {File name} name
 * @param {Creation time in milliseconds} time
 * @param {true or false} binary
 * @param {true or false} deletable
 * @returns Error string. Empty string if successful.
 */
function createFile(name, time, binary, deletable) {
    name = this.getAbsolutePath(name);

    if(!(name in this.filesystem)) {
        this.filesystem[name] = {
            type: (binary ? "binary" : "text"),
            created: time,
            deletable: deletable,
            data: ""
        };
        return "";
    }
    return `Cannot create file '${name}': File exists`;
}

/**
 * Changes the text data inside the file so that it saves it.
 * @param {File name} name
 * @param {Text to be written} data
 * @returns True if success false if no file or wrong file type
 */
function saveFile(name, data) {
    name = this.getAbsolutePath(name);
    if(this.filesystem[name].type === "text") {
        this.filesystem[name].data = data;
        return true;
    }
    return false;
}

/**
 * Implements the date of creation functionality. Should be similar to date -r
 * @param {Name of file} name
 * @returns Time created in milliseconds
 */
function date(name) {
    name = this.getAbsolutePath(name);
    if(!(name in this.filesystem)) {
        return "";
    }
    return this.filesystem[name].created;
}

/**
 * String manipulation to make paths minimal
 * @param {Unclean path} unclean_path
 * @returns Clean Path
 */
function normalizePath(unclean_path) {
    let clean_path = unclean_path;

    if (clean_path.charAt(0) !== '/') {
        clean_path = this.getPath() + "/" + clean_path;
    }

    clean_path = clean_path.replace(/\\\\/g, '/');
    const parts = clean_path.split('/');
    const slashed = parts[0] === '';
    for (let i = 1; i < parts.length; i++) {
        if (parts[i] === '.' || parts[i] === '') {
            parts.splice(i--, 1);
        }
    }
    for (let i = 1; i < parts.length; i++) {
        if (parts[i] !== '..') continue;
        if (i > 0 && parts[i - 1] !== '..' && parts[i - 1] !== '.') {
            parts.splice(--i, 2);
            i--;
        }
    }
    clean_path = parts.join('/');
    if (slashed && clean_path[0] !== '/')
        clean_path = '/' + clean_path;
    else if (clean_path.length === 0)
        clean_path = '.';
    return clean_path;
}

/**
 * Get absolute path
 * @param {some path} name
 * @returns Absolute (clean) Path
 */
function getAbsolutePath(name) {
    if (name.indexOf("/") !== 0) {
        name = this.currentDir + "/" + name;
    }
    return this.normalizePath(name);
}

function getFileName(path) {
    path = this.getAbsolutePath(path);
    let tokens = path.split("/");
    return tokens[tokens.length - 1];
}

function getDirPath(path) {
    path = this.getAbsolutePath(path);
    let tokens = path.split("/");
    let filename =  tokens[tokens.length - 1];
    path = path.replace(filename, "");
    return this.getAbsolutePath(path);
}
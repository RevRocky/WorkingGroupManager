const fs = require('fs');

/**
 * A small config manager which meters out access to 
 * the config object to different parts of the programme
 * which might need it. 
 *
 * 
 * @author <3 Rocky <rocky.petkov@yandex.com> 
 * 
 * WWWWWWWWWWNKOdl:;,,,,,,;cldOKNWWWWWWWWWW
 * WWWWWWWN0d:....',;::::;,'. ..:d0NWWWWWWW
 * WWWWWXk:. .;ok0XNNWWWWNNX0ko;. .:kXWWWWW
 * WWWNO:.  .:oooooooooooooooooo:.  .:ONWWW
 * WWXd. 'lc.    ............    .ll. .dXWW
 * WXl. ;0NNO:. .lO00000000Ol. .cONNO; .oXW
 * Nd. :0WWWWXx, .:ONWWWWNO:. ;kNWWWW0; .xN
 * 0, 'OWWWWWWWKo. .lKNN0l. 'dXWWWWWWNk. ;0
 * d. cXWWWWWWWWN0c. '::' .l0NWWWWWWWWX: .x
 * o  oNWWWWWWWWWWNx.    'kNWWWWWWWWWWNl .d
 * o. lNWWWWWWWWWNO:. .. .c0NWWWWWWWWWXc .d
 * k. ;KWWWWWWWNKl. .oOOo. .oKNWWWWWWW0, 'O
 * Xc .dNWWWWWXd' .c0NWWN0c. ,xXWWWWWXo. lX
 * WO, .xNWWNk;..;kNWWWWWWNk; .:ONWWNd. ;0W
 * WNO, .oK0c.  .:cccccccccc;.  .l0Kl. ;ONW
 * WWW0c. .......................... .cKWWW
 * WWWWXk;. .:d0KXXXXXXXXXXXXKOd:. .:kNWWWW
 * WWWWWWXkc'...;ldxkOOOOkxdl;...'lOXWWWWWW
 * WWWWWWWWNKko:'............':okXNWWWWWWWW
 * WWWWWWWWWWWWNKOxoc::::coxOXNWWWWWWWWWWWW
 * 
 * Rebel For Life
 * 
 * All Code Licensed under the GNU GPL v 3.0
 */

let configObject;
let commandLineConfig;           // Config options defined on the command line
let archivedPathToConfig = '';   // The last path to config used. Prevents redundant reads.

/**
 * Fetches the config object. If it has not been fetched from the 
 * disk before, will attempt to read from the disk.
 * 
 * @param {string | undefined} pathToConfig Path to the config file. 
 *      If undefined will simply try to fetch the pre-read config object 
 */
function loadConfig(pathToConfig) {
    if (pathToConfig && pathToConfig !== archivedPathToConfig) {
        // Path to config file is defined and is different from the config file we've loaded...
        // TODO: In future, think of a way that allows user to change config
        // from within programme.
        configObject = JSON.parse(fs.readFileSync(pathToConfig));
        archivedPathToConfig = pathToConfig;    // Archive path to config object
        return Object.freeze(configObject); // Return frozen config object
    }
    else if (configObject) {
        return Object.freeze(configObject); // Freeze the config object
    }
    else {
        // The config object is not defined and we have no path... throw an error
        throw new Error(`Received undefined filepath for the config file.`);
    }
}

/**
 * Saves flags supplied to the programme upon startup.
 * 
 * @param {object} argv The arguments supplied upon program startup
 */
function applyCLFlags(argv) {
    commandLineConfig = {};

    if (argv.silent) {
        commandLineConfig.silent = true;
    }
    else {
        commandLineConfig.silent = false;
    }
}

function checkSilentMode() {
    return commandLineConfig.silent;
}

module.exports = {
    loadConfig: loadConfig,
    applyCLFlags: applyCLFlags,
    checkSilentMode: checkSilentMode
}
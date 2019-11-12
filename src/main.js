const addPersons = require('./workflows/addPersons');
const yargs = require('yargs')
const configManager = require('./config/configManager');
const email = require("./helpers/email");

// Defining the command line arguments
var argv = yargs
    .usage("Usage: $0 <command> [options]")
    .command('add', 'Bulk Add New Rebels to Working Groups', function(yargs) {
        argv = yargs
            .usage('Usage $0 add -c [path/to/config/file.xlsx] -x [path/to/excel/file.xlsx]')
            .alias('c', 'config')
            .alias('x', 'excel')
            .alias('s', 'silent')
            .demandOption(['c', 'x'])
    })
    .command('remove', 'Bulk Unsubscribe Rebels from Working Group Mailing Lists', function(yargs) {
        argv = yargs
                .usage('Usage: $0 remove -c [path/to/config/file.xlsx] -x [path/to/excel/file.xlsx]')
                .alias('c', 'config')
                .alias('x', 'excel')
                .demandOption(['c', 'x'])
    })
    .help('help')
    .epilog('\n\nFor Help Contact: <rocky.petkov@yandex.com>\nLove and Rage')
    .argv;

/**
 * Little helper function to check and print out the appropriate help file for a 
 * given command 
 * 
 * @param {object} yargs Pointer to the yargs library
 * @param {object} argv Pointer to the argv object
 * @param {number} numRequired The minimum length for argv for a given set of commands
 */
function checkCommands(yargs, argv, numRequired) {
    if (argv._.length < numRequired) {
        yargs.showHelp();
    }
    else {
        console.log("Unknown Command");
    }
}

/**
 * The entry point for the application!
 */
async function main() {  
    // Load config file
    console.log(`\nLoading Configuration file at ${argv.config}\n`);

    configManager.loadConfig(argv.config);
    configManager.applyCLFlags(argv);

    if (!configManager.checkSilentMode()) {
        await email.initialiseEmail();
    }
    
    switch(argv['_'][0]) {
        case 'add':
            await addPersons.addPersons(argv.excel);
            break;
        default:   
            yargs.showHelp();
    }
}

main();
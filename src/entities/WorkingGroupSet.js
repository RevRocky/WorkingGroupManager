const configManager = require("../config/configManager");
const C = require('../helpers/const');
const Person = require('./Person').default;
const PluginManager = require("../plugins/pluginManager").default;
const Report = require('../entities/Report').default;
const WorkingGroup = require('../entities/WorkingGroup').default;


/**
 * A class which encapsulates all functionality to 
 * create and manipulate and resolve operations for a 
 * set of working groups. Abstracts away and provides 
 * a more consistent interface for working with a collection
 * of working groups.  
 *
 * TODO: Decouple this object further from ActionNetwork
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
class WorkingGroupSet {
    /**
     * The default constructor for a working group object!
     */
    constructor() {
        this.opsInitialised = {};
        this.groups = new Map();

        this.loadWorkingGroups();
    }

    loadWorkingGroups() {
        const config = configManager.loadConfig();

        // Add the master group if present.
        if (config.masterGroupName && config.masterGroupCredentials) {
    
            this.groups.set(C.MASTER_GROUP_ABBREV, new WorkingGroup(config.masterGroupName, config.masterGroupCredentials));

            if (config.masterGroupColeads) {
                this.groups.get(C.MASTER_GROUP_ABBREV).coleads = config.masterGroupColeads;
            }
        }

        // Cycle through the working groups if present.
        // FIXME: Clean up the code here... 
        if (config.workingGroups) {
            for (const group of Object.keys(config.workingGroups)) {
                // Check that the group is well defined
                if (config.workingGroups[group].name && config.workingGroups[group].credentials) {
                    this.groups.set(group, WorkingGroup.readFromJSON(JSON.parse(JSON.stringify(config.workingGroups[group])))); // A deep clone. Unfreezes the object...
                }
                else {
                    // Working group is not well defined. Notify user and move along
                    console.err(`\nWorking Group ${group} is not well defined. Will proceed without it.\nTo fix this issue, consult the config file.`);
                }
            }
        }
    }

    /**
     * Initialises the working group object so a given set of 
     * operations can be performed
     * 
     * @param {string} operation Name of the operation
     */
    initialiseOperation(operation) {
        for (const group of this.groups.values()) {
            group.initialiseOperation(operation);
        }
    }

    /**
     * Schedules an "add" operation in all the appropriate working groups for a person
     * @param {Person} person The person to be added to the organisation
     */
    scheduleAddOperation(person) {
        this.initialiseOperation(C.OPS.ADD);

        // If the person is not valid, return... We don't have sufficient information to add them.
        if (!person.isValid()) {
            return;
        }

        // Implicit else: The person is valid.

        // If master group defined, add the person...
        if (this.groups.get(C.MASTER_GROUP_ABBREV)) {
            this.groups.get(C.MASTER_GROUP_ABBREV)[C.OPS.ADD].push(person);
        }

        // Now do the person's individual working groups
        if (person.workingGroups) {
            for (const group of person.workingGroups) {
                try {
                    this.groups.get(group)[C.OPS.ADD].push(person);
                }
                catch (e) {
                    console.error(`Unrecognised Working Group for ${person.name}: ${group}`);
                }
            }
        }
    }

    /**
     * Goes through the operations associated with each of the working group and 
     * resolves them. Most often by communicating with the Action Network backend
     */
    async resolveOperations() {

        for (const group of this.groups.values()) {
            await group.resolveOperations();
        }

    }
}

module.exports = {
    default: WorkingGroupSet
}
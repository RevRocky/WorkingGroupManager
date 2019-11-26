const configManager = require("../config/configManager");
const C = require('../helpers/const');
const Person = require('./Person').default;
const PluginManager = require("../plugins/pluginManager").default;
const Report = require('../entities/Report').default;
const Subgroup = require('./Subgroup').default;
const email = require('../helpers/email');
const fs = require("fs");
const utils = require('../helpers/utils');

/**
 * A class which encapsulates all functionality to 
 * create and manipulate and resolve operations for a 
 * set of subgroups.
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
class SubgroupSet {
    constructor() {
        this.subgroups = new Map();
        this.opsInitialised = {};
        this.loadSubgroups();
    }

    /**
     * Loads the different subgroups from the config file.
     */
    loadSubgroups() {
        const config = configManager.loadConfig();

        if (config.subgroups) {
            for (const abbrev of Object.keys(config.subgroups)) {
                const currentSubgroup = config.subgroups[abbrev];

                if (Subgroup.wellDefined(currentSubgroup)) {
                    this.subgroups.set(abbrev, new Subgroup(currentSubgroup.name, 
                        currentSubgroup.credentials, currentSubgroup.description));
                }
                else {
                    console.error(`Subgroup ${abbrev} is not well defined. Will proceed without it.\nTo remedy this please correct the config file`);
                }
            }
        }
    }

    /**
     * Initialises the subgroup object so a given set of 
     * operations can be performed
     * 
     * @param {string} operation Name of the operation
     */
    initialiseOperation(operation) {
        for (const group of this.subgroups.values()) {
            group.initialiseOperation(operation);
        }
    }

    /**
     * Goes through and resolves all of the operations for a given 
     * sub group.
     */
    async resolveOperations() {
        
        for (const group of this.subgroups.values()) {
            await group.resolveOperations();
        }

        if (!configManager.checkSilentMode()) {
            await this.notifyShepherd();
        }
    }

    /**
     * Notifies the shepherd/shepherdess of new members
     * connecting them with said new members and providing a point
     * of contact in the organisation.
     */
    async notifyShepherd() {
        const config = configManager.loadConfig();

        let successfulAdds = [];
        let groupDescriptions = ""
        
        // Loop through and get all emails + subgroup descriptions
        for (const group of this.subgroups.values()) {
            successfulAdds = [...successfulAdds, ...group.getEmailOfSuccessfulAdds()]
            groupDescriptions += `\n${group.description}\n`;
        }

        // Put it in a set so we remove duplicates.
        const successfulAddsNoDupes = new Set(successfulAdds);

        let destinationEmails = "";
        for (const email of successfulAddsNoDupes.values()) {
            destinationEmails += `${email} `;
        }
        destinationEmails = destinationEmails.trim();

        let welcomeEmail;
        if (config.subgroupWelcomeEmail) {
            welcomeEmail = fs.readFileSync(confg.subgroupWelcomeEmail).toString();
        }
        else {
            welcomeEmail = fs.readFileSync(`${__dirname}/../assets/emails/defaultSubgroupWelcome.html`).toString();
        }

        const generics = [
            {target: "{SHEPHERD_NAME}", replacement: config.subGroupShepherd.name},
            {target: "{MASTER_GROUP}", replacement: config.masterGroupName},
            {target: "{SUB_GROUP_DESCRIPTIONS}", replacement: groupDescriptions}
        ];

        for (const generic of generics) {
            welcomeEmail = utils.replaceAllInString(welcomeEmail, generic.target, generic.replacement);
        }

        const cc = {
            cc: config.subGroupShepherd.email,
            bcc: destinationEmails
        }

        await email.sendEmailCC("", `So You've Joined a Subgroup!`, welcomeEmail, cc, true);
    }

    /**
     * Schedules an operation for a person to be added to a subgroup.
     * @param {Person} person A person
     */
    scheduleAddOperation(person) {
        this.initialiseOperation(C.OPS.ADD);

        // If the person is not valid, return... We don't have sufficient information to add them.
        if (!person.isValid()) {
            return;
        }

        // Implicit else: The person is valid.

        // Now do the person's individual subgroups
        if (person.subgroups) {
            for (const group of person.subgroups) {
                try {
                    this.subgroups.get(group)[C.OPS.ADD].push(person);
                }
                catch (e) {
                    console.error(`Unrecognised Subgroup for ${person.name}: ${group}`);
                }
            }
        }
    }
}

module.exports = {
    default: SubgroupSet
}
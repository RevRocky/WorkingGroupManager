const fs = require('fs');
const configManager = require('../config/configManager');
const email = require('../helpers/email');
const utils = require("../helpers/utils");
const PluginManager = require("../plugins/pluginManager").default;
const Report = require("./Report").default;
const OPS = require("../helpers/const").OPS;

/**
 * A class encapsulating all of the functionality 
 * corresponding to a working group. This can be anything
 * from the top level logical group (ie XR Toronto), to actual
 * working groups and depending on the structure of an individual
 * group, could even be used to represent subgroups. 
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
class WorkingGroup {

    /**
     * The constructor only takes the group name and credentials. Almost 
     * everything else is optional.
     * @param {string} name Name of the working group
     * @param {object} credentials Credentials attached to the working group. 
     *      Varies based upon what back end provider is being used for management 
     *      of the working group lists.
     */
    constructor(name, credentials) {
        this.opsInitialised = {};
        this.name = name;
        this.credentials = credentials;
    }

    /**
     * Initialises a given operation for the working group.
     * @param {string} operation OP Code for a given operation
     */
    initialiseOperation(operation) {
        if (this.opsInitialised[operation]) {
            return
        }
        else {
            this.opsInitialised[operation] = true;
            this[operation] = [];
        }
    }

    /**
     * Converts the list of co-leads into a string
     */
    get coleadString() {
        if (!this.coleads) {
            return "";      // No coleads, no string
        }
        
        if (this.coleads.length === 1) {
            return this.coleads[0].name;
        }
        
        let coleadString = this.coleads.map(colead => colead.name).join(',');

        // Find the last instance of the comma
        const lastCommaPos = coleadString.lastIndexOf(',');

        return `${coleadString.substring(0, lastCommaPos)} and ${coleadString.substring(lastCommaPos + 1)}`;
    }

    /**
     * @return the emails of the co-leads as a comma separated string
     */
    get coleadEmails() {
        if (!this.coleads) {
            return ''
        }
        // Implicit Else: We have co-leads
        return this.coleads.map(colead => colead.email).join(',');
    }

    /**
     * Sets the welcome email for a working group. It will be 
     * up to the calling environment to determine whether or not
     * this should be a co-lead or no colead variation.
     */
    set welcomeEmail(pathToWelcomeEmail) {
        this.welcomeEmailTemplate = fs.readFileSync(pathToWelcomeEmail);
    }

    /**
     * Returns the text of the welcome email template for the working group.
     */
    get welcomeEmail() {
        if (!this.welcomeEmailTemplate) {
            // Load the default welcome email
            if (this.coleads) {
                this.welcomeEmailTemplate = fs.readFileSync(__dirname + '/../assets/emails/defaultMemberWelcome.html').toString();
            }
            else {
                // No co-leads defined
                this.welcomeEmailTemplate = fs.readFileSync(__dirname + '/../assets/emails/defaultMemberWelcomeNoColead.html').toString();
            }
        }

        // Return the welcome email text
        return this.welcomeEmailTemplate;
    }

    /**
     * Resolves any and all outstanding operations for the working group
     * and ensures that the results are written to a report.
     */
    async resolveOperations() {
        this.report = new Report(this.name);

        for (const operation of Object.keys(this.opsInitialised)) {
            switch(operation) {
                case OPS.ADD:
                    await this.resolveAdd();
            }
        }

        if (!configManager.checkSilentMode()) {
            await this.notifyColeads();
        }
    }

    /**
     * Resolves the add operation for this specific group
     */
    async resolveAdd() {
        const backend = new PluginManager();
        await backend.resolveAdd(this);            // Resolves the add for the correct group

        // Only send welcome email if we aren't on silent mode...
        if (!configManager.checkSilentMode()){ 
            this.sendWelcomeEmail();
        }

        console.log(`\nAttempted to Add ${this[OPS.ADD].length} people to ${this.name} WG\n`);
        this.report.printReportToConsole(OPS.ADD);
    }

    async notifyColeads() {
        if (!this.coleads) {
            console.log(`Failed to notify coleads of WG ${this.name}`);
            return;
        }

        const reportText = this.report.reportText;

        if (!reportText) {
            return;
        }

        // Dispatch Report to Each Co-Lead
        let personalisedBody
        for (const colead of this.coleads) {
            personalisedBody = `Hello ${colead.name},\n\nI want to notify you of the following changes I've made to the ${this.group} Working Group:\n${reportText}`;
            personalisedBody  += "\nIf you feel any of these modifications were done in error, do reach out. My handlers will work with you to rectify the problem!\n"
            personalisedBody += "\n\nYours in Robotic Excellence\nRobot";

            await email.sendEmailBasic(colead.email, `AUTOMATED MESSAGE: Updates to ${this.group}`, personalisedBody);
        }
    }

    /**
     * Welcomes all new members to the group dispatching an email to them
     * welcoming them to their working group and putting them in touch with 
     * their co-leads. 
     */
    async sendWelcomeEmail() {
        // Load the correct email from the config
        const config = configManager.loadConfig();

        const targetEmails = this.report.operations[OPS.ADD].success.map(person => person.email).join(',');

        const generics = [
            {target: "{WORKING_GROUP}", replacement: this.name},
            {target: "{MASTER_GROUP}", replacement: config.masterGroupName},
            {target: "{CO_LEADS}", replacement: this.coleadString},
            {target: "{MASTER_GROUP_EMAIL}", replacement: config.masterGroupEmail},
            {target: "{CO_LEAD_PLURAL}", replacement: this.coleads && this.coleads.length > 1 ? "co-leads" : "co-lead"},
            {target: "{CO_LEAD_VERB}", replacement: this.coleads && this.coleads.length > 1 ? "are" : "is"} 
        ];

        let personalisedEmail = this.welcomeEmail;
        for (const generic of generics) {
            personalisedEmail = utils.replaceAllInString(personalisedEmail, generic.target, generic.replacement);
        }

        if (this.coleads) {
            // Send email with coleads cc'ed
            const cc = {
                cc: this.coleadEmails
            }

            await email.sendEmailCC(targetEmails, `Welcome to the ${this.name} group`, personalisedEmail, cc, true)
        }
        else {
            // Send without co-leads cc'ed
            await email.sendEmailBasic(targetEmails, `Welcome to the ${this.name} group`, personalisedEmail, true);
        }
    }

    /**
     * Wraps a simple object representation of a working group into something
     * more complex
     * @param {object} wgAsObject A simple object with a name, credentials, coleads and welcomeEmail fields
     * @returns {WorkingGroup} A working group containing the same information as the simple object
     */
    static readFromJSON(wgAsObject) {
        let wg = new WorkingGroup(wgAsObject.name, wgAsObject.credentials);
        wg.coleads = wgAsObject.coleads;
        
        // Figure out the appropriate email
        if (wg.coleads && wgAsObject.welcomeEmail) {
            wg.welcomeEmail = wgAsObject.welcomeEmail;
        }
        else if (wgAsObject.welcomeEmailNoColeads) {
            wg.welcomeEmail = wgAsObject.welcomeEmailNoColeads;
        }

        return wg;
    }
}

module.exports = {
    default: WorkingGroup,
};
const Person = require("../entities/Person").default;
const OPS = require("../helpers/const").OPS;
const config = require("../config/configManager");
const colors = require('colors');
const emailHelper = require('../helpers/email');
/**
 * A class standardising the interface for managing the 
 * success failure reports for a set of operations undertaken
 * for a working group.
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

class Report {
    constructor(group) {
        this.operations = {};
        this.group = group; // The abbreviation of the group this report is for
    }

    /**
     * Adds a section for a given operation to the report. 
     * @param {string} operation Adds an operation section to the report
     */
    addOperation(operation) {
        // Only add operation for the add functionality
        if (!this.operations[operation]) {
            this.operations[operation] = {
                success: [],
                failure: []
            }
        }
    }

    /**
     * Returns the interface through which the section of the 
     * programme busy with resolving operations can write to 
     * reports in a regimented way. Uses the magic of bind 
     * to provide a nice and simple interface.
     * 
     * @param {string} operation 
     * 
     * @return {object} An object with reference to bound versions of
     * the addSuccess and addFailure methods with the first argument 
     * bound to the operation
     */
    getReportWriter(operation) {
        return {
            addSuccess: (person) => this.addSuccess(operation, person),
            addFailure: (person) => this.addFailure(operation, person)
        };
    }

    /**
     * Adds a person to the success column
     * @param {string} operation The operation performed.
     * @param {Person} person Person for whom a given operation was successful
     */
    addSuccess(operation, person) {
        this.operations[operation]["success"].push(person);
    }

    /**
     * Adds a person to the failure column
     * @param {string} operation The operation performed.
     * @param {Person} person Person for whom a given operation was a failurue
     */
    addFailure(operation, person) {
        this.operations[operation]["failure"].push(person);
    }

    /**
     * Pretty prints the report to the console...
     * @param {operation} operation Operation whose report we wish to print
     */
    printReportToConsole(operation) {
        const operationReport = this.operations[operation];

        // Report Successes
        console.log(`\nNo. Successes ${operationReport.success.length}`.green);
        operationReport.success.forEach(person => {
            console.log(`\t${person.name} -- ${person.email}`);
        });
        
        // Report Failures
        console.log(`No. Failures ${operationReport.failure.length}`.red);
        operationReport.failure.forEach(person => {
            console.log(`\t${person.name} -- ${person.email}`);
        });
    }

    /**
     * Dispatches emails to the co-leads of each working group notifying them of changes made to their working groups
     * on Action Network
     * 
     * @param {array} coleads The coleads of the working group, if it exists
     */
    async notifyColeads(coleads) {
        if (!coleads) {
            console.log(`Could not notify Co-Leads of Working Group ${this.group}`);
            return;
        }

        let meaningfulReport = false;       // Flag that tracks if anything of importance is said in the report

        // Implict Else, we know the co-leads, let's build the report.
        let reportSections = [];   

        for (const operation of Object.keys(this.operations)) {
            let operationSection = "";
            switch (operation) {
                case OPS.ADD:

                    if  (this.operations[operation].success.length) {
                        meaningfulReport = true;
                        operationSection = "\nI've added the following rebels to your working group. Do take the time to welcome them and answer any questions they might have!\n\n";
                    
                        // Update report with the people we've been adding!
                        for (const person of this.operations[operation].success) {
                            operationSection += `\t${person.name} -- ${person.email}\n`;
                        }
                    }

                    if (this.operations[operation].failure.length) {
                        meaningfulReport = true;
                        operationSection += "\nI've failed to add the following rebels to the working group. You may want to follow up on this so no one falls through the cracks\n\n";

                        for (const person of this.operations[operation].failure) {
                            operationSection +=`\t${person.name} -- ${person.email}\n`
                        }
                    }
                    
                    reportSections.push(operationSection);
                    break;
            }

            
        }

        // Check if we actually have content to send...
        if (!meaningfulReport) {
            return;         // Don't send a blank report!
        }

        // Dispatch Report to Each Co-Lead
        let personalisedBody
        for (const colead of coleads) {
            personalisedBody = `Hello ${colead.name},\n\nI want to notify you of the following changes I've made to the ${this.group} Working Group:\n${reportSections.join('\n')}`;
            personalisedBody  += "\nIf you feel any of these modifications were done in error, do reach out. My handlers will work with you to rectify the problem!\n"
            personalisedBody += "\n\nYours in Robotic Excellence\nRobot";

            await emailHelper.sendEmailBasic(colead.email, `AUTOMATED MESSAGE: Updates to ${this.group}`, personalisedBody);
        }
        
    }


}

module.exports = {
    default: Report
}
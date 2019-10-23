const Person = require("../entities/Person").default;
const colors = require('colors');
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
     constuctor() {
        this.operations = {}
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
        console.log(this);
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
        console.log(`\nNo. Successes ${operationReport.success.length()}\n`.green);
        operationReport.success.forEach(person => {
            console.log(`\t${person.name} -- ${person.email}\n`);
        });
        
        // Report Failures
        console.log(`No. Failures ${operationReport.failure.length()}\n`.red);
        operationReport.failure.forEach(person => {
            console.log(`\t${person.name} -- ${person.email}\n`);
        });
    }
}

module.exports = {
    default: Report
}
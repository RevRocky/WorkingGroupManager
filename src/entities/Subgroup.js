const configManager = require('../config/configManager');
const email = require('../helpers/email');
const utils = require("../helpers/utils");
const PluginManager = require("../plugins/pluginManager").default;
const Report = require("./Report").default;
const OPS = require("../helpers/const").OPS;

/**
 * A class encapsulating all of the functionality 
 * corresponding to a subgroup. This encapsulates any group
 * for which you still wish to have a mailing list but, for which
 * you do not wish to have quite the same level of onboarding 
 * as a full fledged working group
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
class Subgroup {

    constructor(name, credentials, description) {
        this.name = name;
        this.credentials = credentials;
        this.description = description;
        this.opsInitialised = {}
    }

    initialiseOperation(operation) {
        if (this.opsInitialised[operation]) {
            return
        }
        else {
            this.opsInitialised[operation] = true;
            this[operation] = [];
        }
    }

    async resolveOperations() {
        this.report = new Report(this.name);

        for (const operation of Object.keys(this.opsInitialised)) {
            switch(operation) {
                case OPS.ADD:
                    await this.resolveAdd();
            }
        }
    }

    async resolveAdd() {
        const backend = new PluginManager();
        await backend.resolveAdd(this);

        console.log(`\nAttempted to Add ${this[OPS.ADD].length} people to ${this.name} SG\n`);
        this.report.printReportToConsole(OPS.ADD);
    }

    /**
     * Gets the emails of those we successfully added to a subgroup
     * @return {Array} An array of email addresses of those we've managed 
     * to successfully add to the subgroup.
     */
    getEmailOfSuccessfulAdds() {
        return this.report.getEmailOfSuccessfulAdds();
    }

    static readFromJSON(sgAsObject) {
        let sg = new Subgroup(sgAsObject.name, 
            sgAsObject.credentials, sgAsObject.description);
        
        return sg;
    }

    /**
     * 
     * @param {object} subgroup A subgroup object. Could be a formal SubGroup 
     * object or a "vanilla JS" object like that which we would read from JSON
     */
    static wellDefined(subgroup) {
        if (!subgroup.name) {
            return false;
        }
        else if (!subgroup.credentials) {
            return false;
        }
        else if (!subgroup.description) {
            return false;
        }

        // Implicit else return true
        return true;
    }
}

module.exports = {
    default: Subgroup
}
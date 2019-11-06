const xlsx = require('xlsx');
const Person = require('../entities/Person').default;
const utils = require('../helpers/utils');
const MASTER_GROUP_ABBREV = require('../helpers/const').MASTER_GROUP_ABBREV;
const WorkingGroupSet = require('../entities/WorkingGroupSet').default;

/**
 * Contains all code that manages the workflow to add 
 * new rebels to the working groups and manage the 
 * onboarding process.
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

/**
 * Parses the incoming excel file to usable JSON
 * @param {string} pathToExcel Path to the excel file. Assumes 
 * an excel file using the standard 'add person' schema
 * 
 * @return {object} An object containing the contents of the excel file
 */
function parseExcelFile(pathToExcel) {
    // Read workbook and worksheet
    const signupWorkbook = xlsx.readFile(pathToExcel);
    const currentWorksheet = signupWorkbook.Sheets[signupWorkbook.SheetNames[0]];

    // TODO: For other XRs find a simpler schema?s
    return xlsx.utils.sheet_to_json(currentWorksheet,
        {header: ['firstName', 'surname', 'pronoun', 'fbName', 'mmName', 'email', 'phone', 
            'postalCode', 'actions', 'workingGroups', 'notes', 'subGroups', 'origin'], skipHeader: true});

}

/**
 * 
 * @param {string} pathToExcel Path to the excel file with the rebels to be added to Action Network
 */
async function addPersons(pathToExcel) {
    // Read Excel File
    let newRebels = parseExcelFile(pathToExcel);

    newRebels = newRebels.map(rebel => {
        return new Person(rebel.firstName, rebel.surname, rebel.pronoun, rebel.fbName,
            rebel.mmName, rebel.email, rebel.phone, rebel.postalCode, rebel.actions,
            rebel.workingGroups, rebel.notes, rebel.subGroups, rebel.origin)
    });

    // TODO: For a scripting mode... might need to pull out of here
    let workingGroups = new WorkingGroupSet();
    for (const rebel of newRebels) {
        workingGroups.scheduleAddOperation(rebel);
    }

    // Resolve the add action.
    await workingGroups.resolveOperations();
}

module.exports = {
    addPersons: addPersons
}
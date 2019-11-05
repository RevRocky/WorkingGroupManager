const Person = require("../entities/Person").default;
const Report = require("../entities/Report").default;
const utils = require("../helpers/utils");
const OPS = require("../helpers/const").OPS;

/**
 * Plugin for managing connections with Action Network.  Home of 
 * all of the platform specific code and formatting^. Initially
 * this will be the only backend supported.
 * 
 * ^ Exception: The Person object will have the method to convert from
 * the format used internally by this programme to any appropriate format.
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

 class ActionNetworkPlugin{
    constructor() {
        // Do we need to do anything here?
    }

    /**
     * The actual meat of the programme. It's entire reason for existing is this one function. We will asynchronously
     * attempt to add people to Action Network from the working groups. 
     * @param {List <WorkingGroup>} workingGroups List of working group objects
     */
    async resolveAdd(workingGroups) {
        const workingGroupKeys = Object.keys(workingGroups);

        // Resolve operations on each group... Asynchronously
        await Promise.all(workingGroupKeys.map(async currentGroup => {
            let group = workingGroups[currentGroup];

            const signupHelperEndpoint = await this.getPersonSignupHelper(group);
            const peopleToAdd = group[OPS.ADD];

            group.report.addOperation(OPS.ADD);
            const reportWriter = group.report.getReportWriter(OPS.ADD);
            const headers = {
                "OSDI-API-TOKEN": group.credentials.privateKey
            }
            
            // God JS is great sometimes...
            await Promise.all(peopleToAdd.map(async person => {
                let aNetPerson = person.actionNetworkSchema;
                
                if (person.isColead(currentGroup)) {
                    aNetPerson["add_tags"].push("Co-Lead");
                }

                const signupResponse = await utils.httpToStandardResponse("post", signupHelperEndpoint, 
                    aNetPerson, headers);

                switch (signupResponse.status) {
                    case 200: 
                        reportWriter.addSuccess(person);
                        await group.welcomePerson(person);           // Welcome the member to the group
                        break;  // Assume Failure
                    default:   
                        reportWriter.addFailure(person);
                }
            }));
        }));

        // Now that everything's synchronised... We can loop through and print results to console.
        for (const groupAbbrev of Object.keys(workingGroups)) {
            const currentGroup = workingGroups[groupAbbrev];
            console.log(`\nAttempted to Add ${currentGroup[OPS.ADD].length} people to ${currentGroup.name} WG\n`);
            currentGroup.report.printReportToConsole(OPS.ADD);
        }
    }

    /**
     * Returns the person signup helper endpoint for a given 
     * @param {WorkingGroup} group Group we're getting the signup helper for
     * 
     * @return {string} The Person Signup Helper Endpoint.
     */
    async getPersonSignupHelper(group) {
        const headers = {
            "OSDI-API-TOKEN": group.credentials.privateKey
        };

        const response = await utils.httpToStandardResponse("get", "https://actionnetwork.org/api/v2/", null, headers);
        return response.data['_links']['osdi:person_signup_helper']['href'];    // A well designed schema this is not.
    }
 }

 module.exports = {
     default: ActionNetworkPlugin
 }
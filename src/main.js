const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');
const uuidv4 = require('uuid').v4;
const argv = require('yargs')
    .usage(`Usage: $0 -c [path/to/config/file] -x [path/to/excel/file]`)
    .alias('c', 'config')
    .alias('x', 'excel')
    .demandOption(['c', 'x'])
    .epilog('Love and Rage')
    .argv;

/**
 * Below is a little script that all XRs can use to quickly and efficiently add pen and paper signups 
 * to their Action Network mailing lists. For now this program does just that and nothing more, though 
 * future versions might build a more sophisticated workflow.
 * 
 * v 1.0    23 AUGUST 2019 Basic API interaction to bulk add "People" to an Action Network group
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
 */


 /**
  * Little helper that reads the config file
  * 
  * @param {string} pathToConfig Path to the config file
  * @returns {object} Object containing the config data
  */
function readConfigFile(pathToConfig) {
    return JSON.parse(fs.readFileSync(pathToConfig));
}

/**
 * Parses the incoming excel file to JSON
 * @param {string} pathToExcel path to the excel file
 */
function parseExcelFile(pathToExcel) {
    const signupWorkbook = xlsx.readFile(pathToExcel);
    const currentWorksheet = signupWorkbook.Sheets[signupWorkbook.SheetNames[0]];

    // TODO: Add logic here incase we want to try and parse different worksheet formats.

    return xlsx.utils.sheet_to_json(currentWorksheet, {header:["name", "email", "phone", "misc"]});
}

async function addPerson(newSignups, config) {
    const actionNetworkAPIKey = config.privateKey;

    // Convert new signups into "people" objects
    newSignups = newSignups.map(person => {

        let splitName = person.name.split(' ');

        if (splitName[2]) {
            splitName[1] = splitName.slice(1).join(' ');    // Compound names
        }

        // Replace with defaults if name is unknown.
        if (splitName[0] === undefined) {
            splitName[0] = "Fellow";

            // If fully unknown it's Fellow Rebel
            if (splitName[1] === undefined) {
                splitName[1] = "Rebel";
            }
        }
        else if (splitName[1] === undefined) {
            // If we only know the first name it's Rebel {name}
            splitName = ["Rebel", splitName[0]];
        }


        // See ActionNetwork API docs for this specification
        return {
            "person": {
                "identifiers": [uuidv4()],
                "given_name": splitName[0],
                "family_name": splitName[1],
                "email_addresses": [{"address": person.email}],
                "add_tags": person.misc,
                "custom_fields": {"phoneNumber": person.phone}
            }
        };
    });

    // Get link to Person Signup Helper
    const headers = {"OSDI-API-Token": actionNetworkAPIKey};
    const endpoints = await httpToStandardResponse("get", "https://actionnetwork.org/api/v2/", null, headers)

    const newPersonEndpoint = endpoints.data['_links']["osdi:person_signup_helper"]["href"];

    // Send new people to helper & log
    let successes = 0;
    await Promise.all(newSignups.map(async signup => {

        const result = await httpToStandardResponse('post', newPersonEndpoint, signup, headers);

        switch (result.status) {
            case 200:
                console.log(`Adding ${signup.person['given_name']} ${signup.person['family_name']} -- SUCCESS`);
                ++successes;
                break;
            default: 
                console.log(`Adding ${signup.person['given_name']} ${signup.person['family_name']} -- FAILURE`);
        }
    }));

    console.log(`Successfully added ${successes} out of ${newSignups.length}`);
}

/**
 * A wrapper for various Axios HTTP request functions that will package
 * both successful and erroneous requests into one standard form to make 
 * for easy handling within the calling environment.
 * 
 * @param {string} method The type of HTTP request to be made
 * @param {string} url The url we are directing the request to.
 * @param {object} body The body of the POST request
 * @param {object} headers Any and all headers to be sent along with the request
 * 
 * @return {object} The response from the server. Formatted to be consistent
 * with the general structure of the response of a successful request if 
 * the request results in a 4XX/5XX.
 */
async function httpToStandardResponse(method, url, body, headers) {
    let response;

    // Attach the headers
    let config = {};
    if (headers) {
        config.headers = headers;
    }


    try {
        switch(method.toLowerCase()){
            case "post":
                response = await axios.post(url, body, config);
                break;
            case "get":
                response = await axios.get(url, config);
                break;
            case "delete": 
                response = await axios.delete(url, config);
                break;
            case "log":
                console.log(`I would have sent this request:\n\n{\n\turl: ${url}\n\tbody: ${body}\n\tconfig: ${config}}\n\n`);
                break;
            default:
                throw Error(`Method ${method} has not been implemented. FIX THIS!`);
        }
       
    }
    catch (err) {
        response = {
            status: err.response.status,
            body: err.response.data.status
        }
    }
    finally {
        return response;
    }
}

async function main() {

    console.log("Welcome to the Extinction Rebellion Auto Signup Programme\nv1.0\nAuthor: Rocky Petkov (XR Toronto)\nRebel for Life\n\n")

    const pathToConfig = argv.config;
    const pathToExcel = argv.excel;
    const config = readConfigFile(pathToConfig);
    let newSignups = await parseExcelFile(pathToExcel);
    await addPerson(newSignups, config)
}

main();
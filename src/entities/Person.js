const configManager = require('../config/configManager');
const utils = require('../helpers/utils');
const uuidv4 = require('uuid/v4');

/**
 * A class which encapsulates all functionality to 
 * create and manipulate a person object. This is 
 * done mostly to abstract away the messy Action Network
 * specification and provide a simple shared resource for 
 * any part of this programme.  
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
class Person {

    /**
     * This constructor is a bit... unnecessary in a lot of cases as we'll
     * be doing an un-necessary copy of the information. Does help with some 
     * unpackaging of the information into more easy to work with formats!
     * 
     * TODO: Alter to just take a "rebel" object and better handle custome fields. 
     * 
     * @param {string} firstName First name of the person
     * @param {string} surname Surname of the person
     * @param {string} pronoun Person's pronoun
     * @param {string} fbName Person's name on facebook
     * @param {string} mmName Person's mattermost handle
     * @param {string} email Email address of the person
     * @param {string} phone Phonenumber of the person
     * @param {string} postalCode Person's postal code
     * @param {string} participateInActions X if the person wishes to participate in actions. Other markings imply false.
     * @param {string} workingGroups Comma-dilineated string of the working group associated with the person
     * @param {string} notes Comma dilineated string of notes pertaining to those working group memberships
     * @param {string} subgroups Comma dilineated list of Subgroups the person belongs to.
     * @param {string} origin A tag letting you know when the person was entered into the system 
     * @param {string} identifier The unique identifier assigned by Action Network
     */
    constructor(firstName, surname, pronoun, fbName, mmName, email, phone,
        postalCode, participateInActions, workingGroups, notes, subgroups, origin, identifier) {
        
        this.archivedActionNetworkSchema = undefined;


        // Logic to get nice looking names is a bit tricky...
        this.cleanNames(firstName, surname);
        this.fbName = fbName;
        this.mmName = mmName;
        this.pronoun = pronoun;
        this.email = email;
        this.phone = phone;
        this.postalCode = postalCode;
        
        this.participateInActions = participateInActions === "X";

        this.workingGroups = workingGroups? workingGroups.split(',') : [];
        this.workingGroups = this.workingGroups.map(wg => wg.trim());

        this.subgroups = subgroups ? subgroups.split(',') : [];
        this.subgroups = this.subgroups.map(sg => sg.trim());

        this.notes = notes ? notes.split(',') : [];
        this.notes = this.notes.map(note => note.trim());

        this.origin = origin;

        this.identifier = identifier ? identifier : "unknown";
    }

    /**
     * Cleans up the names, substituting defaults for 
     * unknown information so that rebels always have nice sounding names.
     * @param {string | undefined} firstName 
     * @param {stirng | undefined} surname 
     */
    cleanNames(firstName, surname) {
        const config = configManager.loadConfig();
        if (firstName && surname) {
            // Simple case... Just set the names and return
            this.firstName = firstName;
            this.surname = surname;
        }
        
        else if (firstName) {
            // We want the person's name to be XXX {Default Surname}
            this.firstName = firstName;
            this.surname = config.defaultSurname;
        }
        else if (surname) {
            // Best case here is to do Surname {XXX}... 
            this.firstName = config.defaultSurname;
            this.surname = surname;
        }
        else {
            // Also simple... Replace with defaults from config.
            this.firstName = config.defaultFirstName;
            this.surname = config.defaultSurname;
        }
    }

    get name() {
        return `${this.firstName} ${this.surname}`
    }

    /**
     * Checks if a person has the minimum possible information to be
     * added to Action Network. This is first name, surname & email.
     * 
     * @returns {boolean} True if person has first name, surname and email
     *      false otherwise.
     */
    isValid() {
        return this.firstName !== undefined && this.surname !== undefined
            && utils.validateEmail(this.email);
    }

    /**
     * Checks if the person in question is a co-lead for a working group. Returns True if the 
     * person is a co-lead. False otherwise. 
     * @param {String} workingGroup The abbreviation for the working group we're checking
     * 
     * @returns {boolean} True if the person is the co-lead of a particular group. False otherwise. 
     */
    isColead(workingGroup) {
        return this.notes.includes(`Co-Lead (${workingGroup})`);
    }

    /**
     * Returns the person's information formatted as ActionNetwork Schema
     * 
     * If one has not been generated, it will generate one from the ground up.
     * Otherwise the archived one will be returned
     * 
     * @returns {object} A version of this Person, formatted for action network.
     */
    get actionNetworkSchema() {
        if (this.archivedActionNetworkSchema) {
            return this.archivedActionNetworkSchema
        }
        else {
            const customData = this.createCustomData()

            // Archive the schema for future reference
            this.archivedActionNetworkSchema =  {
                "identifiers": [this.identifier !== "unknown" ? this.identifier : uuidv4()],
                "givenName": this.firstName,
                "familyName": this.surname,
                "email_addresses": [{"address": this.email}],
                "postal_addresses": [{"postal_code": this.postalCode}],
                "custom_fields": customData,

            }

            return this.archivedActionNetworkSchema;
        }
    }

    /**
     * Creates a custom data object based upon what we know about a person
     * 
     * @return {object} An object defining any and all of the non standard data we collect 
     * about people to add to add to mattermost.
     */
    createCustomData() {
        let customData = {};

        if (this.phone) {
            customData.phoneNumber = this.phone
        }

        if (this.fbName) {
            customData.facebookName = this.fbName;
        }

        if (this.mmName) {
            customData.mattermostHandle = this.mmName;
        }

        if (this.notes) {
            customData.notes = this.notes.join(",")
        }

        if (this.pronoun) {
            customData.pronoun = this.pronoun;
        }

        if (this.origin) {
            customData.origin = this.origin
        }

        const today = new Date();
        customData.JoinDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

        customData.participateInActions = this.participateInActions;

        return customData;
    }

    /**
     * Refreshes any cached properties, like the actionNetwork or other 
     * storage schemas.
     */
    refresh() {
        this.archivedActionNetworkSchema = undefined;
    }
 }

 module.exports =  {
     default: Person
 };
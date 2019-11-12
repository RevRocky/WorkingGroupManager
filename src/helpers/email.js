const nodemailer = require("nodemailer");
const configManager = require("../config/configManager");
const colors = require("colors");
const readline = require('readline');

let transporter;


/**
 * Initialises the email transporter
 */
async function initialiseEmail() {
    if (!transporter) {
        await getTransporter();   // We don't care about the transporter
    }
}

/**
 * Authenticates to the email account supplied in the config file. 
 */
async function getTransporter() {
    // Get transporter if not created...
    if (!transporter) {
        const config = configManager.loadConfig();
        let connectSuccess = false;
        // Try to authenticate three times... If not.. Give Up...
        for (let i = 0; i < 3 && !connectSuccess; i++){ 
            // Get Password
            const password = await getPassword()

            transporter = nodemailer.createTransport({
                service: config.botEmail.service,
                auth: {
                    user: config.botEmail.address,
                    pass: password
                }
            });


            try { 
                await transporter.verify();
                connectSuccess = true;
                console.log("Connection Success".green);
            }
            catch (err) {
                console.log(err)
                console.error("Authentication Unsuccessful\n".red);
            }
        }

        if (!connectSuccess) {
            throw Error(`Unable to Connect to Email Service ${config.botEmail.service}`);
        }
    }

    return transporter;
}

/**
 * Prompt user for the password to the bot email
 */
async function getPassword() {
    const config = configManager.loadConfig();

    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(`\nEnter Password for ${config.botEmail.address}\n> `, (answer) => {
            rl.close();
            resolve(answer)
        });
    });
}

/**
 * Sends an email to the specified recipient with the supplied body
 * @param {string} recipient The email address of the email recipient
 * @param {string} subject Email subject
 * @param {string} body The body of the email
 * @param {boolean} isHTML True if the email body is supposed to be html
 */
async function sendEmailBasic(recipient, subject, body, isHTML = false) {
    let transporter;
    const config = configManager.loadConfig();

    try {
        transporter = await getTransporter()
    }
    catch (err) {
        throw err;
    }

    let mail = {
        from: `<${config.botEmail.address}>`, 
        to: recipient,
        subject: subject, 
    };

    // Is the email plain text or does it contain more sophisticated
    // HTML
    if (isHTML) {
        mail.html = body;
    }
    else {
        mail.text = body;
    }

    try {
        await transporter.sendMail(mail);
    }
    catch (err) {
        console.log("Could Not Send Mail\n");
        console.log(mail);
        console.error(err);
    }
    
}

/**
 * Sends an email to a recipeient, including an additional group in the
 * thread as receiving a carbon copy.
 * @param {string} recipient Recipient's email
 * @param {string} subject Email subject
 * @param {string} body Body of the email. May be plain text or HTML
 * @param {object} cc An object containing a cc and/or a bcc component informing the 
 *      who ought to receive a carbon copy. 
 *      Object is of form {cc: "email1, emailTwo", bcc: "emailThree, email4"}
 * @param {boolean} isHTML 
 */
async function sendEmailCC(recipient, subject, body, ccList, isHTML = false) {
    let transporter;
    const config = configManager.loadConfig();

    try {
        transporter = await getTransporter()
    }
    catch (err) {
        throw err;
    }

    let mail = {
        from: `<${config.botEmail.address}>`, 
        to: recipient,
        subject: subject, 
    };

    // Add CC & BCC sections
    if (ccList.cc) {
        mail.cc = ccList.cc;
    }
    
    if (ccList.bcc) {
        mail.bcc = ccList.bcc;
    }

    // Is the email plain text or does it contain more sophisticated
    // HTML
    if (isHTML) {
        mail.html = body;
    }
    else {
        mail.text = body;
    }

    try {
        await transporter.sendMail(mail);
    }
    catch (err) {
        console.log("Could Not Send Mail\n");
        console.log(mail);
        console.error(err);
    }
}

module.exports = {
    "sendEmailBasic": sendEmailBasic,
    "sendEmailCC": sendEmailCC,
    "initialiseEmail": initialiseEmail
}
/**
 * Contains all of the helper functions used throughout the code-base. 
 */

const axios = require("axios");
const configManager = require('../config/configManager');
const MASTER_GROUP_ABBREV = require('./const').MASTER_GROUP_ABBREV;



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
            case "put":
                response = await axios.delete(url, body, config);
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

/**
 * Validates an email address
 * @param {string} email
 * @returns {boolean} True if email is valid, false otherwise 
 */
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Replaces all instances of a target substring with 'replacement' in a provided string
 * @param {string} string The string we are performing the replacements on
 * @param {string} target Will be replaced with 'replacement' in the string
 * @param {string} replacement The substring we wish to replace target in the string
 * 
 * @return {string} The new string with all instances of target replaced with "replacement"
 */
function replaceAllInString(string, target, replacement) {
    return string.replace(new RegExp(target, 'g'), replacement);
}

module.exports = {
    httpToStandardResponse: httpToStandardResponse,
    validateEmail: validateEmail,
    replaceAllInString: replaceAllInString
};


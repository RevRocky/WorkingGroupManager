const ActionNetworkPlugin = require("./actionNetworkPlugin").default;
const configHelper = require("../config/configManager");
const DATA_STORES = require("../helpers/const").DATA_STORES;
/**
 * A plugin manager. Reads the user's preferred backend from the configuration 
 * file and then initialises the correct plugin. Additionally provides a common 
 * interface so that all "Add", "Delete", "Update" and other requests look the same 
 * to the rest of the programme regardless of which data store the application is using.
 * 
 * If no back end data store is defined within the config file, it is assumed that we will 
 * be using ActionNetwork to manage these requests. 
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
class PluginManager {

    

    constructor() {
        this.datastore = DATA_STORES.ACTION_NETWORK;     // Default to Action Network
        const config = configHelper.loadConfig();
        
        if (config.datastore) {
            this.datastore = config.datastore;
        }

        this.plugin;            // Scope
        switch(this.datastore) {
            case DATA_STORES.ACTION_NETWORK: {
                this.plugin = new ActionNetworkPlugin();
            }
        }
    }

    /*
     * Below are a bunch of simple functions that simply forward along the operation resolution requests 
     * to the appropriate plugins which has the platform specific code for handling this sort of thing.
     */

    async resolveAdd(group) {
        await this.plugin.resolveAdd(group);
    }
}

module.exports = {
    default: PluginManager
}
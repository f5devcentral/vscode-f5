// 'use strict';

// import { Terminal, window, workspace, ProgressLocation, StatusBarAlignment, commands } from 'vscode';
// import { makeAuth, makeReqAXnew, multiPartUploadSDK, download } from './coreF5HTTPS';
// import { ext, loadConfig } from '../extensionVariables';
// import * as utils from './utils';
// import logger from './logger';

// export interface Device {
//     device: string,
//     provider?: string,
//     onConnect?: string[],
//     onDisconnect?: string[]
// }

// /**
//  *
//  * Basic Example:
//  * 
//  * ```
//  * const mgmtClient = new ManagementClient({
//  *      host: '192.0.2.1',
//  *      port: 443,
//  *      user: 'admin',
//  *      password: 'admin'
//  * });
//  * const variable = await mgmtClient.makeRequest('/mgmt/tm/sys/version');
//  * ```
//  */
// export class MgmtClient {
//     device: string;
//     host: string;
//     port: number | 443;
//     provider: string;
//     protected _user: string;
//     protected _password: string;
//     protected _token: any;
//     protected _tmrBar: any;
//     protected _tokenTimeout: number = 0;
//     private _onConnect: string[] = [];
//     private _onDisconnect: string[] = [];
//     private terminal: Terminal | undefined;

//     /**
//      * @param options function options
//      */
//     constructor(
//         device: string,
//         options: {
//         host: string;
//         port: number;
//         user: string;
//         provider: string;
//         password: string;
//     }) {
//         this.device = device;
//         this.host = options['host'];
//         this.port = options['port'] || 443;
//         this.provider = options['provider'];
//         this._user = options['user'];
//         this._password = options['password'];
//         this.getConfig();
//     }

//     /**
//      * Get vscode workspace configuration for this device
//      */
//     private getConfig() {

//         this._onConnect = [];
//         this._onDisconnect = [];

//         const bigipHosts: Device[] | undefined = workspace.getConfiguration().get('f5.hosts');
//         const deviceConfig: any = bigipHosts?.find( item => item.device === this.device);

//         // if (deviceConfig?.hasOwnProperty('onConnect')) {
//         //     this._onConnect = deviceConfig.onConnect;
//         // } 
        
//         // if (deviceConfig?.hasOwnProperty('onDisconnect')) {
//         //     this._onDisconnect = deviceConfig.onDisconnect;
//         // }

//         // short hand of above logic
//         deviceConfig?.hasOwnProperty('onConnect') ? this._onConnect = deviceConfig.onConnect : [];
//         deviceConfig?.hasOwnProperty('onDisconnect') ? this._onDisconnect = deviceConfig.onDisconnect : [];

//         // console.log('done getConfig');
//     }


//     /**
//      * Login (using credentials provided during instantiation)
//      * sets/gets/refreshes auth token
//      * @returns void
//      */
//     private async getToken(): Promise<void> {

//         logger.debug('getting auth token from: ', `${this.host}:${this.port}`);

//         const resp: any = await makeAuth(`${this.host}:${this.port}`, {
//             username: this._user,
//             password: this._password,
//             loginProviderName: this.provider
//         });

//         this._token = resp.data.token;
//         this._tokenTimeout = this._token.timeout;

//         // logger.debug('newTokn', this._token);

//         this.tokenTimer();  // start token timer
//     }

//     /**
//      * connect to f5 and discover ATC services
//      * Pulls device/connection details from this. within the class
//      */
//     async connect() {
//         // await this.disconnect();
//         const progress = await window.withProgress({
//             location: ProgressLocation.Notification,
//             title: `Connecting to ${this.host}`,
//             cancellable: true
//         }, async (progress, token) => {
//             token.onCancellationRequested(() => {
//                 // this logs but doesn't actually cancel...
//                 logger.debug("User canceled device connect");
//                 return new Error(`User canceled device connect`);
//             });
            
            
//             // await this.getToken();
            
//             let returnInfo: string[] = [];
 

//             // cache password in keytar
//             ext.keyTar.setPassword('f5Hosts', this.device, this._password);

//             utils.setHostStatusBar(this.device);    // show device bar
//             ext.connectBar.hide();      // hide connect bar
            
//             //********** Host info **********/
//             const hostInfo: any = await this.makeRequest('/mgmt/shared/identified-devices/config/device-info');
//             if (hostInfo.status === 200) {
//                 const text = `${hostInfo.data.hostname}`;
//                 const tip = `TMOS: ${hostInfo.data.version}`;
//                 utils.setHostnameBar(text, tip);
//                 returnInfo.push(text);
//             }
            
//             progress.report({ message: `CONNECTED, checking installed ATC services...`});
            
            
//             //********** enable irules view **********/
//             const iRules: any = await this.makeRequest('/mgmt/tm/ltm/rule/');

//             if(iRules.status === 200) {
//                 // if irules detected, device is iRulesAble, so set that flag, 
//                 //  then reload the config to make the view show
//                 ext.iRulesAble = true;
//                 loadConfig();
//             }

//             //********** FAST info **********/
//             const fastInfo: any = await this.makeRequest('/mgmt/shared/fast/info');
//             if (fastInfo.status === 200) {
//                 const text = `FAST(${fastInfo.data.version})`;
//                 utils.setFastBar(text);
//                 returnInfo.push(text);
//             }

//             //********** AS3 info **********/
//             const as3Info: any = await this.makeRequest('/mgmt/shared/appsvcs/info');

//             if (as3Info.status === 200) {
//                 const text = `AS3(${as3Info.data.version})`;
//                 const tip = `CLICK FOR ALL TENANTS \r\nschemaCurrent: ${as3Info.data.schemaCurrent} `;
//                 utils.setAS3Bar(text, tip);
//                 returnInfo.push(text);
//             }
            
//             //********** DO info **********/
//             const doInfo: any = await this.makeRequest('/mgmt/shared/declarative-onboarding/info');

//             if (doInfo.status === 200) {
//                 // for some reason DO responds with a list for version info...
//                 const text = `DO(${doInfo.data[0].version})`;
//                 const tip = `schemaCurrent: ${doInfo.data[0].schemaCurrent} `;
//                 utils.setDOBar(text, tip);
//                 returnInfo.push(text);
//             }

//             //********** TS info **********/
//             const tsInfo: any = await this.makeRequest('/mgmt/shared/telemetry/info');
//             if (tsInfo.status === 200) {
//                 const text = `TS(${tsInfo.data.version})`;
//                 const tip = `nodeVersion: ${tsInfo.data.nodeVersion}\r\nschemaCurrent: ${tsInfo.data.schemaCurrent} `;
//                 utils.setTSBar(text, tip);
//                 returnInfo.push(text);
//             }
//             return returnInfo;
//         });
//         this.termConnect();
//         return progress;
//     }

//     /**
//      * multi part upload to f5
//      * gets uploaded via:  /mgmt/shared/file-transfer/uploads/<file>
//      * found in remote dir:  /var/config/rest/downloads/
//      * @param file full path/file location of source file
//      */
//     async upload(file: string = '') {

//         /**
//          * todo: add ability to provide buffer data to bypass the need for
//          * a temp file
//          *  - 10.9.2020 - may not be the best route for large files...
//          */

//         // if auth token has expired, it should have been cleared, get new one
//         if(!this._token){
//             await this.getToken();
//         }

//         return await multiPartUploadSDK(file, this.host, this.port, this._token.token);
//     }


//     /**
//      * download file from connectd f5
//      * remote file location:  /shared/images
//      * remote api called: /mgmt/cm/autodeploy/software-image-downloads/
//      * @param file name to get
//      * @param dest path/file name (./path/test.tar.gz)
//      */
//     async download (file: string, dest: string) {

//         // if auth token has expired, it should have been cleared, get new one
//         if(!this._token){
//             await this.getToken();
//         }

//         return await download (file, dest, this.host, this.port, this._token.token);
//     }



//     /**
//      * Make HTTP request
//      * - utilizes device details/user/pass/token
//      * set within the class
//      * 
//      * @param uri     request URI
//      * @param options function options
//      * 
//      * @returns request response
//      */
//     async makeRequest(uri: string, options?: {
//         method?: string;
//         headers?: object;
//         body?: object;
//         contentType?: string;
//         advancedReturn?: boolean;
//     }): Promise<object>  {
//         options = options || {};

//         // if auth token has expired, it should have been cleared, get new one
//         if(!this._token){
//             await this.getToken();
//         }

//         return await makeReqAXnew(
//             this.host,
//             uri,
//             {
//                 method: options.method || 'GET',
//                 port: this.port,
//                 headers: Object.assign(options.headers || {}, {
//                     'X-F5-Auth-Token': this._token.token,
//                     'Content-Type': 'application/json'
//                 }),
//                 body: options.body || undefined,
//                 advancedReturn: options.advancedReturn || false
//             }
//         );
//     }


//     /**
//      * bigip auth token lifetime countdown
//      * will clear auth token details when finished
//      * prompting the next http call to get a new token
//      */
//     private async tokenTimer() {

//         this._tmrBar = window.createStatusBarItem(StatusBarAlignment.Left, 50);
//         this._tmrBar.tooltip = 'F5 AuthToken Timer';
//         this._tmrBar.color = 'silver';

//         const makeVisible = workspace.getConfiguration().get('f5.showAuthTokenTimer');
//         if(makeVisible) {
//             this._tmrBar.show();
//         }

//         // consider adding an icon, maybe even spinning
//         //https://code.visualstudio.com/api/references/icons-in-labels

//         let intervalId = setInterval(() => {
//             this._tmrBar.text = `${this._tokenTimeout}`;
//             this._tokenTimeout--;
//             if (this._tokenTimeout <= 0) {
//                 clearInterval(intervalId);
//                 this._tmrBar.hide();
//                 logger.debug('authToken expired');
//                 this._token = undefined; // clearing token details should get a new token
//                 this._tmrBar.dispose();
//             } else if (this._tokenTimeout <= 30){
//                 // turn text color reddish/pink to indicate expiring token
//                 this._tmrBar.color = '#ED5A75';
//             }
//         }, 1000);
        
//     }


//     /**
//      * clears auth token, connected status bars, and onDisconnect commands
//      */
//     async disconnect() {

//         this._tokenTimeout = 0;  // zero/expire authToken

//         // clear connected details status bars
//         utils.setHostStatusBar();
// 		utils.setHostnameBar();
// 		utils.setFastBar();
// 		utils.setAS3Bar();
// 		utils.setDOBar();
//         utils.setTSBar();
        
//         /**
//          * // hide irules/iapps view
//          * this should probably dispose of the view or at least clear it's contents?
//          *  - currently, this just hides the view with all data in it
//          *  next connect should refresh the data as needed, but there seems to
//          *  be a better way to do this.
//          */
//         commands.executeCommand('setContext', 'f5.tcl', false);
//         // ext.iRulesAble = false;

//         // show connect status bar
//         ext.connectBar.show();
        
//         this.termDisConnect();
//     }


//     /**
//      * clears password for currently connected device
//      *  to be called by http since it won't know current
//      *  device details
//      */
//     async clearPassword() {
//         await commands.executeCommand('f5.clearPassword', { label: this.device });
//     }

//     /**
//      * issues terminal commands defined for "onConnect"
//      */
//     private termConnect() {

//         // if we have configuration in the onConnect
//         if (this._onConnect.length > 0) {

//             // if we don't already have a terminal, create one
//             if (!this.terminal) {
//                 this.terminal = window.createTerminal('f5-cmd');
//                 this.terminal.show(true);
//             }

//             // loop through onConnect commands and issue them
//             this._onConnect?.forEach((el: string) => {
    
//                 // swap out variable as needed
//                 el = el.replace(/\${this.device}/, `${this.device}`);
//                 setTimeout( () => {
//                     this.terminal?.sendText(el);
//                 }, 500);
//             });
//         };

//     }

//     /**
//      * issue terminal commands defined for "onDisonnect"
//      */
//     private termDisConnect() {

//         // if we have onDisconnect commands
//         if (this._onDisconnect) {

//             // if we don't already have a terminal, create one (very corner cases)
//             if (!this.terminal) {
//                 this.terminal = window.createTerminal('f5-cmd');
//                 this.terminal.show(true);
//             }

//             // if _onDisconnect has a value, loop through each as terminal commands
//             this._onDisconnect?.forEach((el: string) => {
//                 setTimeout( () => {
//                     this.terminal?.sendText(el);
//                 }, 500);
//             });
//         }

//         // if we have a terminal, and we are disconnecting, delete terminal when done
//         if (this.terminal) {
//             setTimeout( () => {
//                 this.terminal?.dispose();
//             }, 1000);
//         }
//     }

// }


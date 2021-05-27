'use strict';

import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
// import { downloadToFile } from './coreF5HTTPS';
// import { callHTTPS } from '../utils/externalAPIs';
import axios from 'axios';
// import * as utils from './utils';
import * as path from 'path';
import * as fs from 'fs';
import logger from './logger';
// import { MgmtClient } from './f5DeviceClient';
// import { emitWarning } from 'process';


// axios.defaults.headers.common['Content-Type'] = 'application/json';
// axios.defaults.headers.common['User-Agent'] = 'F5 VSCode FAST Extension';

const FAST_GIT_RELEASES = 'https://api.github.com/repos/F5Networks/f5-appsvcs-templates/releases';
const AS3_GIT_RELEASES = 'https://api.github.com/repos/F5Networks/f5-appsvcs-extension/releases';
const DO_GIT_RELEASES = 'https://api.github.com/repos/F5Networks/f5-declarative-onboarding/releases';
const TS_GIT_RELEASES = 'https://api.github.com/repos/F5Networks/f5-telemetry-streaming/releases';

const PKG_MGMT_URI = '/mgmt/shared/iapp/package-management-tasks';

/**
 * get list of installed rpms on bigip
 * @params ?
 */
export async function installedRPMs () {

    /**
     * like other ilx operations, to get installed rpms, 
     *  start a job to gather the details, then query for the finished job
     *  to get the details... should the following logic include error 
     *  handling for all those steps (like posting a DO dec)or just assume 
     *  things should go well since the operation should be so lightweight
     *  to happen quickly... we'll see
     * 
     * So, in the following, we are assuming everything will go successfully and quick...
     * 
     * todo: update to poll task till done and maybe add progress bar that information
     *      is being gathered and waiting for user to select...
     */
    
    // start installed pkgs query
    const query: any = await ext.f5Client?.https(PKG_MGMT_URI, {
            method: 'POST',
            data: { 
                operation: 'QUERY' 
            }
        }
    );

    // pause a moment for job to complete 
    //  - this should be rewritten to follow 202 till complete
    await new Promise(resolve => { setTimeout(resolve, 1000); });
 
    // query task to get installed rpms
    const tasks: any = await ext.f5Client?.https(`${PKG_MGMT_URI}/${query.data.id}`);

    // not sure if this error logic is even needed...
    if(tasks.status === 200) {
        // if not rpms installed we get an empty array
        if(tasks.data.queryResponse.length < 1) {
            throw new Error('no installed rpms');
        }

        // return just package names from list
        const installed = tasks.data.queryResponse.map( (item: { packageName: string; }) => item.packageName);
        logger.debug('installed rpms', JSON.stringify(installed));
        
        return installed;
    } else {
        // todo:  setup fail condition?
        logger.warn('getting installedRPMs failed', tasks.status, tasks.statusText);
    }
}


/**
 * un-install rpm on bigip
 * @params rpm name
 */
export async function unInstallRpm (packageName: string) {

    const progressBar = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `ATC RPM un-Installing:  ${packageName}`,
        cancellable: true
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            console.warn("User canceled atc rpm removal");
            return new Error(`User canceled atc rpm removal`);
        });
        
        // start unInstall job
        const start: any = await ext.f5Client?.https(PKG_MGMT_URI, {
            method: 'POST',
            data: {
                operation: 'UNINSTALL',
                packageName
            }
        });

        progress.report({ message: `${start.statusText}`});
        // progress.report({ message: `... ${start.data.status} ...`});

        let taskId;
        if (start.status === 202) {
            taskId = start.data.id;
        }   
        
        await new Promise(resolve => { setTimeout(resolve, 1000); });
        let i = 0;  // loop counter
        // use taskId to control loop
        while(taskId && i < 10) {

            const resp: any = await ext.f5Client?.https(`${PKG_MGMT_URI}/${taskId}`);

            progress.report({ message: `${resp.data.status}`});
            logger.debug('rpm uninstall task in progress', taskId, resp.status, resp.data.status);
            

            // todo: break out the successful and failed results, only refresh statusBars on successful
            if(resp.data.status === 'FINISHED' || resp.data.status === 'FAILED') {
                vscode.window.showInformationMessage(`ilx rpm un-install - ${resp.data.status}`);
                progress.report({ message: `task complete, waiting for node to restart before refreshing status bars...`});
                await new Promise(resolve => { setTimeout(resolve, 20000); }); // 20 seconds
                
                // return resp;
                return resp.data.status;
            }

            i++;
            await new Promise(resolve => { setTimeout(resolve, 3000); }); // todo: update for global timer
        }
    });
    return progressBar;
}

/**
 * assists users with selected atc/version to install
 */
export async function rpmPicker () {

    /**
     * --- npm picker function (no input)
	 * 1. quickPick to select ATC service [fast, as3, do, ts]
	 * 2. quickPick version [latest, v3.20.0, v3.19.2]
	 * 3. download rpm and sha
	 * 4. return file location
     */

    const progressBar = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'ATC RPM',
        cancellable: true
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            logger.debug("User canceled atc rpm picker");
            return new Error(`User canceled atc rpm picker`);
        });
        
        progress.report({ message: `Please select ATC`});
        
        const atc = await vscode.window.showQuickPick(
            ['FAST', 'AS3', 'DO', 'TS'], 
            {placeHolder: "Select ATC Service"}
            );
        
        if(!atc) {
            return vscode.window.showInformationMessage('user escaped ATC choice');
        }
            
        progress.report({ message: `Please select version`});
        
        var rpmVersions;
        switch(atc) {
            case 'FAST': {
                rpmVersions = await listGitReleases(FAST_GIT_RELEASES);
                break;
            }
            case 'AS3': {
                rpmVersions = await listGitReleases(AS3_GIT_RELEASES);
                 break;
            }
            case 'DO': {
                rpmVersions = await listGitReleases(DO_GIT_RELEASES);
                break;
            }
            case 'TS': {
                rpmVersions = await listGitReleases(TS_GIT_RELEASES);
                break;
            }
        }

        const selectedAsset: any = await vscode.window.showQuickPick(rpmVersions, {placeHolder: 'Select Version'});

        progress.report({ message: `Fetching ${atc} ${selectedAsset.label} from ${selectedAsset.asset}`});

        // vscode.window.showInformationMessage(`Fetching ${atc} ${selectedAsset.label} from ${selectedAsset.asset}`);
        logger.debug(`selectedAsset: ${atc} ${selectedAsset.label} from ${selectedAsset.asset}`);
        
        const rpmLoc = await getRPMgit(selectedAsset.asset);
        // logger.debug('rpmLoc', rpmLoc);

        await new Promise(resolve => { setTimeout(resolve, 2000); });
        
        // Promise.resolve(rpmLoc);
        return rpmLoc;
    });
    // Promise.resolve(progressBar);
    return progressBar;
}




/**
 * uploads atc ilx to f5
 * @param rpm local rpm location
 */
export async function rpmInstaller (rpm: string) {

    logger.debug('rpmInstaller uploading', rpm);
    

    // * --- npm installer function -> input: string = <file_location>
    // * 1. upload rpm
    // * 2. install rpm
    // * 3. reconnect to refresh everything

    const progressBar = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'ATC RPM Upload',
        cancellable: true
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            logger.debug("User canceled atc rpm upload");
            return new Error(`User canceled atc rpm upload`);
        });
        
        progress.report({ message: `uploading`});

        // get rpm name from full file path
        const rpmName = path.basename(rpm);

        // let rpms finish downloading...
        await new Promise(resolve => { setTimeout(resolve, 2000); });

        // upload rpm to f5
        const instA = await ext.f5Client?.upload(rpm, 'FILE');
        
        logger.debug('uploaded', instA);
        progress.report({ message: `installing`});
        await new Promise(resolve => { setTimeout(resolve, 2000); });
        
        // start rpm install
        const installStart: any = await ext.f5Client?.https(PKG_MGMT_URI, {
            method: 'POST',
            data: {
                operation: 'INSTALL',
                packageFilePath: `/var/config/rest/downloads/${rpmName}`
            }
        });

        logger.debug('ilx import status: ', installStart.status, installStart.data.id);
        progress.report({ message: `${installStart.data.status}`});

        // wait for package to install
        await new Promise(resolve => { setTimeout(resolve, 1000); });

        let taskId;
        if (installStart.status === 202) {
            taskId = installStart.data.id;
        }   

        let i = 0;  // loop counter
        // use taskId to control loop
        while(taskId && i < 10) {
            const resp: any = await ext.f5Client?.https(`${PKG_MGMT_URI}/${taskId}`);

            logger.debug('task in progress', taskId, resp.status, resp.data.status);
            
            if(resp.data.status === 'FINISHED') {
                vscode.window.showInformationMessage(`${rpmName} Install Complete!`);
                progress.report({ message: `Waiting for node services to restart before refreshing status bars...`});
                // todo: watch node service restart before refreshing status bars
                await new Promise(resolve => { setTimeout(resolve, 15000); }); // pause a moment

                return resp;
            } else if (resp.data.status === 'FAILED') {
                const msg = `rpm install FAILED: ${resp.data.errorMessage}`;
                vscode.window.showWarningMessage(msg);
                return Promise.reject(msg);
            }

            i++;
            // todo: update to global async interval
            await new Promise(resolve => { setTimeout(resolve, 3000); });
        }

        return 'complete';
    });
    return progressBar;
}

/**
 * downloads selected atc/ilx assets
 * @param assetUrl github asset url
 *  example:  https://api.github.com/repos/F5Networks/f5-appsvcs-templates/releases/27113449
 * @returns full path/file of rpm
 */
export async function getRPMgit(assetUrl: string, dir?: string) {
    // get release asset information
    const resp = await axios(assetUrl);
    // logger.debug('Getting github asset details', resp);
    
    
    const extDir = ext.context.extensionPath; 
    // todo:  move cache directory to a real linux/windows temp directory...
    // if we got a directory assign it, if not, use cache
    const rpmDir = dir ? dir : path.join(extDir, 'atc_ilx_rpm_cache');

    if (!fs.existsSync(rpmDir)) {
        logger.debug('CREATING ATC ILX RPM CACHE DIRECTORY');
        fs.mkdirSync(rpmDir);
    } else { 
        logger.debug(`existing ${rpmDir} detected`);
    };


    // loop through assets get needed information
    const assetSet = resp.data.assets.map( (item: { name: string; browser_download_url: string; }) => {
        return {name: item.name, browser_download_url: item.browser_download_url};
    });
    logger.debug('assetSet', JSON.stringify(assetSet));
    

    // download assets
    await assetSet.forEach ( async (item: { name: string; browser_download_url: string; }) => {
        const destPath = path.join(rpmDir, item.name);

        // if item already exists
        if(fs.existsSync(destPath)) {
            logger.debug(`${destPath} already cached!`);
            // return destPath;
        } else {
            logger.debug(`${item.name} not found in local cache, downloading...`);
            // await rpmDownload(item.browser_download_url, destPath);
            await ext.extHttp.download(item.browser_download_url, destPath);
        }
    });

    logger.debug('assets done downloading');

    // get array item that has the installable rpm
    const rpmAsset = [];
    // did we download an rpm or vsix?
    rpmAsset.push(...assetSet.filter( (el: { name: string; }) => el.name.endsWith('.rpm')));
    rpmAsset.push(...assetSet.filter( (el: { name: string; }) => el.name.endsWith('.vsix')));
    const assetFpath = path.join(rpmDir, rpmAsset[0].name);

    // return just rpm name

    return assetFpath;
}

/**
 * lists assests/releases of selected atc git
 * @param url atc github releases url
 * @returns asset name and download url as object
 */
export async function listGitReleases(url: string){
    const resp = await axios.get(url);
    var mapEd;
    if(resp.status === 200) {
        mapEd = resp.data.map( (item: { name: string; url: string; }) => {
            return {label: item.name, asset: item.url};
        });
    }
    // logger.debug('mapEd', mapEd);
    return mapEd;
}

/**
 * download rpm from github
 * @param url to download file
 * @param destPath destination path/file
 */
export async function rpmDownload (url: string, destPath: string) {
    // https://futurestud.io/tutorials/download-files-images-with-axios-in-node-js
    const writeFile = fs.createWriteStream(destPath);
    const resp: any = await axios.get(url, {
        responseType: 'stream',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'F5 VSCode FAST Extension'
        }
    })
    .catch( error => {
        logger.debug('npmGetter error', error);
    });
    resp.data.pipe(writeFile);

    return new Promise((resolve, reject) => {
        writeFile.on('finish', resolve);
        writeFile.on('error', reject);
      });
}






    //  //  // ----------- try 1 - returns multiple promises
    // let finRpm;
    // // loop through assets in set and download
    // const assetSet = await resp.data.assets.map( async (item: { name: string; browser_download_url: string; }) => {
    //     // potentially just return download url or just download them in this loop...

    //     // TODO: filter json examples from download
    //     // if(item.name === '*.json') { ... }

    //     const destPath = path.join(rpmDir, item.name);
    //     // if item already exists
    //     if(fs.existsSync(destPath)) {
    //         logger.debug(`${destPath} already cached!`);
    //         return destPath;
    //     } else {
    //         logger.debug(`${item.name} not found in local cache, downloading...`);
    //         await npmGetter(item.browser_download_url, destPath);
    //     }
    //     if(destPath === '*.rpm') {
    //         finRpm = destPath;
    //     }
    //     return [item.name, item.browser_download_url];
    // });

    
    //  //  //  ------ try 2 doesn't return anything...
    // const respA = await resp.data.assets.forEach( async (item: { name: string; browser_download_url: string; }) => {
    //     const destPath = path.join(rpmDir, item.name);
    //     // if item already exists
    //     if(fs.existsSync(destPath)) {
    //         logger.debug(`${destPath} already cached!`);
    //     } else {
    //         logger.debug(`${item.name} not found in local cache, downloading...`);
    //         const writeFile = fs.createWriteStream(destPath);
    //         const resp = await axios.get(item.browser_download_url, {responseType: 'stream'});
    //         resp.data.pipe(writeFile);
    //     }
    //     if(destPath === '*.rpm') {
    //         finRpm = destPath;
    //         return destPath;
    //     }
    // });



            // .filter( (item: any[]) => {
    //     logger.debug('filter item', item);
    //     if(item[1].includes(".rpm") {
    //         return item[1];
    //     }
    // })
    
    // const asset = resp.data.assets.filter( (item: { name: string; }) => item.name === '*.rpm');
    // const assetSet = resp.data.assets
    // .filter( (item: any) => {

    //     logger.debug('item.name', item.name);
    //     if(item.name.includes(".rpm") {
    //         return item.name;
    //     }

    //     // const destPath = path.join(rpmDir, item.name);

    //     // // if item already exists
    //     // if(fs.existsSync(destPath)) {
    //     //     logger.debug(`${destPath} already cached!`);
    //     //     // return destPath;
    //     // } else {
    //     //     logger.debug(`${item.name} not found in local cache, downloading...`);
    //     //     npmGetter(item.browser_download_url, destPath);
    //     // }
        
    // })
    // // .reduce( (item: any) => {
    // //     if(item.name.endsWith(".rpm")) {
    // //         // finRpm = destPath;
    // //         logger.debug(`******assetItem ${item.browser_download_url}`);
    // //         // Promise.resolve(item.browser_download_url);
    // //         return item.browser_download_url;
    // //     }
    // // })
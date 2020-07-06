'use strict';
import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import { getAuthToken, callHTTP, multiPartUploadSDK } from './coreF5HTTPS';
import { callHTTPS } from '../utils/externalAPIs';
import axios from 'axios';
import * as utils from './utils';
import * as path from 'path';
import * as fs from 'fs';


axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['User-Agent'] = 'F5 VSCode FAST Extension';

const fastReleases = 'https://api.github.com/repos/F5Networks/f5-appsvcs-templates/releases';
const as3Releases = 'https://api.github.com/repos/F5Networks/f5-appsvcs-extension/releases';
const doReleases = 'https://api.github.com/repos/F5Networks/f5-declarative-onboarding/releases';
const tsReleases = 'https://api.github.com/repos/F5Networks/f5-declarative-onboarding/releases';


export async function npmPicker () {

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
            console.log("User canceled atc rpm mgmt");
            return new Error(`User canceled atc rpm mgmt`);
        });
        
        progress.report({ message: `Please select ATC`});
        
        const atc = await vscode.window.showQuickPick(
            ['FAST', 'AS3', 'DO', 'TS'], 
            {placeHolder: "Select ATC Service"}
            );
            
        progress.report({ message: `Please select version`});
        
        var rpmVersions;
        switch(atc) {
            case 'FAST': {
                rpmVersions = await listReleases(fastReleases);
                break;
            }
            case 'AS3': {
                rpmVersions = await listReleases(as3Releases);
                 break;
            }
            case 'DO': {
                rpmVersions = await listReleases(doReleases);
                break;
            }
            case 'TS': {
                rpmVersions = await listReleases(tsReleases);
                break;
            }
        }

        const selectedAsset = await vscode.window.showQuickPick(rpmVersions, {placeHolder: 'Select Version'});

        progress.report({ message: `Fetching ${atc} ${selectedAsset.label} from ${selectedAsset.asset}`});

        // vscode.window.showInformationMessage(`Fetching ${atc} ${selectedAsset.label} from ${selectedAsset.asset}`);
        console.log(`selectedAsset: ${atc} ${selectedAsset.label} from ${selectedAsset.asset}`);
        
        const rpmLoc = await getRPM(selectedAsset.asset);
        // console.log('rpmLoc', rpmLoc);
        

        return rpmLoc;
    });
    return progressBar;
}

async function getRPM(assetUrl: string) {
    // get release asset information
    const resp = await axios(assetUrl);
    console.log('Getting asset details', resp);
    
    
    const extDir = ext.context.extensionPath; 
    // todo:  move cache directory to a real linux/windows temp directory...
    const rpmDir = path.join(extDir, 'atc_ilx_rpm_cache');

    if (!fs.existsSync(rpmDir)) {
        console.log('CREATING ATC ILX RPM CACHE DIRECTORY');
        fs.mkdirSync(rpmDir);
    };


    // loop through assets get needed information
    const assetSet = resp.data.assets.map( (item: { name: string; browser_download_url: string; }) => {
        return {name: item.name, browser_download_url: item.browser_download_url};
    });
    console.log('assetSet', assetSet);
    

    // download assets
    assetSet.forEach ( item => {
        const destPath = path.join(rpmDir, item.name);

        // if item already exists
        if(fs.existsSync(destPath)) {
            console.log(`${destPath} already cached!`);
            // return destPath;
        } else {
            console.log(`${item.name} not found in local cache, downloading...`);
            npmGetter(item.browser_download_url, destPath);
        }
    });

    //return rpm file location
    const assetLocation = assetSet.reduce( item => {
        // console.log('assetSet item', item);
        
        if(item.name.endsWith(".rpm")) {
            const destPath = path.join(rpmDir, item.name);
            return destPath;
        }
    });

    return assetLocation;
}

/**
 * 
 * @param url atc github releases url
 * @returns asset name and download url as object
 */
async function listReleases(url: string){
    const resp = await axios.get(url);
    var mapEd;
    if(resp.status === 200) {
        mapEd = resp.data.map( (item: { name: string; url: string; }) => {
            return {label: item.name, asset: item.url};
        });
    }
    // console.log('mapEd', mapEd);
    return mapEd;
}

/**
 * download rpm from github
 * @param url to download file
 * @param destPath destination path/file
 */
export async function npmGetter (url: string, destPath: string) {
    // https://futurestud.io/tutorials/download-files-images-with-axios-in-node-js
    const writeFile = fs.createWriteStream(destPath);
    const resp = await axios.get(url, {responseType: 'stream'})
    .catch( error => {
        console.log('npmGetter error', error);
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
    //         console.log(`${destPath} already cached!`);
    //         return destPath;
    //     } else {
    //         console.log(`${item.name} not found in local cache, downloading...`);
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
    //         console.log(`${destPath} already cached!`);
    //     } else {
    //         console.log(`${item.name} not found in local cache, downloading...`);
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
    //     console.log('filter item', item);
    //     if(item[1].includes(".rpm") {
    //         return item[1];
    //     }
    // })
    
    // const asset = resp.data.assets.filter( (item: { name: string; }) => item.name === '*.rpm');
    // const assetSet = resp.data.assets
    // .filter( (item: any) => {

    //     console.log('item.name', item.name);
    //     if(item.name.includes(".rpm") {
    //         return item.name;
    //     }

    //     // const destPath = path.join(rpmDir, item.name);

    //     // // if item already exists
    //     // if(fs.existsSync(destPath)) {
    //     //     console.log(`${destPath} already cached!`);
    //     //     // return destPath;
    //     // } else {
    //     //     console.log(`${item.name} not found in local cache, downloading...`);
    //     //     npmGetter(item.browser_download_url, destPath);
    //     // }
        
    // })
    // // .reduce( (item: any) => {
    // //     if(item.name.endsWith(".rpm")) {
    // //         // finRpm = destPath;
    // //         console.log(`******assetItem ${item.browser_download_url}`);
    // //         // Promise.resolve(item.browser_download_url);
    // //         return item.browser_download_url;
    // //     }
    // // })
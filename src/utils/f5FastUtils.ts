'use strict';
import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import * as utils from './utils';
import * as path from 'path';
import * as fs from 'fs';
import logger from './logger';

/*
most of these functions are extracted from f5-fast-core cli
https://github.com/f5devcentral/f5-fast-core/blob/develop/cli.js
*/

// const path = require('path');
// import { displayWebView } from './fastHtmlPreveiwWebview';

const fast = require('@f5devcentral/f5-fast-core');



/**
 * single fast template validate, zip, upload and import function
 * will detect what device is currently selected
 * @param doc template/text from editor (or selection)
 */
export async function zipPostTemplate (doc: string) {

    /*
    look at using a system temp directory also fs.mkdtemp(dirprefix)
    https://nodejs.org/api/fs.html#fs_fs_mkdtemp_prefix_options_callback
    https://code.visualstudio.com/api/references/vscode-api#ExtensionContext
    */

    const progressBar = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Upload Fast Template',
        cancellable: true
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            logger.debug("User canceled the template upload");
            return new Error(`User canceled the template`);
        });
        
        progress.report({ message: `Please provide a Template Set Name`});
        
        //get folder name from user
        //  potentially make this an input/select box to allow create a new folder or select existing
        const fastTemplateFolderName = await vscode.window.showInputBox({
            prompt: 'Destination FAST Templates Folder Name ---',
            value: 'test'
        });
        
        progress.report({ message: `Please provide a Template Name`});
        // get template name from user
        const fastTemplateName = await vscode.window.showInputBox({
            placeHolder: 'appTemplate1',
            value: 'testTemplate',
            prompt: 'Input Destination FAST Template Name ---'
        });


        if (!fastTemplateName) {
            // if no destination template name provided, it will fail, so exit
            return vscode.window.showWarningMessage('No destination FAST template name provided!');
        }
        
        
        // const coreDir = ext.context.globalStoragePath;
        // --- set extension context directory, ie-windows10: c:\Users\TestUser\vscode-f5-fast\
        const coreDir = ext.context.extensionPath; 
        // const tmpDir = fastTemplateFolderName;
        const fullTempDir = path.join(coreDir, 'fastTemplateFolderUploadTemp');
        const zipOut = path.join(coreDir, `${fastTemplateFolderName}.zip`);
        // const zipOut = path.join(coreDir, 'dummy.txt');
        
        logger.debug('fast Template Folder Name: ', fastTemplateFolderName);
        logger.debug('fast Template Name: ', fastTemplateName);
        logger.debug('base directory: ', coreDir);
        logger.debug('full Temp directory: ', fullTempDir);
        logger.debug('zip output dir/fileName: ', zipOut);

        
        //  if the temp directory is not there, create it
        //      this shouldn't happen but if things get stuck half way...
        if (!fs.existsSync(fullTempDir)) {
            fs.mkdirSync(fullTempDir);
        }

        progress.report({ message: `Verifing and Packaging Template`});
        await new Promise(resolve => { setTimeout(resolve, (1000)); });


        // // log whats in the new folder in above dir
        // logger.debug(fs.readdirSync(fullTempDir));

        fs.writeFileSync(path.join(fullTempDir, `${fastTemplateName}.mst`), doc);
        
        // debugger;
        // const tempZip = packageTemplateSet(fullTempDir);
        const zipedTemplates = await packageTemplateSet2(fullTempDir, zipOut);
        // logger.debug(package1);
        // logger.debug('zipOut', zipOut);

        //f5-sdk-js version
        progress.report({ message: `Uploading Template`});
        await new Promise(resolve => { setTimeout(resolve, (1000)); });
        // const uploadStatus = await multiPartUploadSDK(zipOut, host, authToken);
        const uploadStatus = await ext.mgmtClient?.upload(zipOut);
        // logger.debug('sdk upload response', uploadStatus);
        

        progress.report({ message: `Installing Template`});
        await new Promise(resolve => { setTimeout(resolve, (1000)); });

        const importStatus = await ext.mgmtClient?.makeRequest('/mgmt/shared/fast/templatesets', {
            method: 'POST',
            body: {
                name: fastTemplateFolderName
            }
        });
        // logger.debug('template import status: ', importStatus);
        
        progress.report({ message: `Deleting temporary files`});
        logger.debug(`Pending Delete of Temporary folder/files`);
        // if the temp directory is there, list contents, delete all files, then delete the directory
        if (fs.existsSync(fullTempDir)) {
            const dirContents = fs.readdirSync(fullTempDir);
            // debugger;
            dirContents.map( item => {
                const pathFile = path.join(fullTempDir, item);
                logger.debug(`Deleting file: ${pathFile}`);
                fs.unlinkSync(pathFile);
            });
            
            logger.debug(`Deleting folder: ${fullTempDir}`);
            fs.rmdirSync(fullTempDir, { recursive: true });
        }
        // remove zip file
        logger.debug(`Deleting zip: ${zipOut}`);
        fs.unlinkSync(zipOut);
        await new Promise(resolve => { setTimeout(resolve, (1000)); });

    });
}


/**
 * fast template folder validate, zip, upload and import function
 * will detect what device is currently selected
 * @param folder 1st level folder name within basePath to package as template set
 * or full folder path from explorer right click
 */
export async function zipPostTempSet (folder: string) {

    const progressBar = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Fast Template Set',
        cancellable: true
    }, async (progress, token) => {
        token.onCancellationRequested(() => {
            logger.debug("User canceled the template set upload");
            return new Error(`User canceled the template set`);
        });

        // const basePath = folder.match(/(.*)[\/\\]/)[0]||'';
        // const basePath = folder.substring(0, folder.lastIndexOf('/'));
        // const justFolderName = folder.substring((folder.lastIndexOf('/')+1));
        const basePath = folder.substring(0, folder.lastIndexOf('\\'));
        const justFolderName = folder.substring((folder.lastIndexOf('\\')+1));
        
        const zipOut = path.join(basePath, `${justFolderName}.zip`);
        // const zipOut = path.join(coreDir, 'dummy.txt');
        
        logger.debug('fast Template Folder Name: ', justFolderName);
        // logger.debug('fast Template Name: ', fastTemplateName);
        logger.debug('base directory: ', basePath);
        // logger.debug('full Temp directory: ', fullTempDir);
        logger.debug('zip output dir/fileName: ', zipOut);


        progress.report({ message: `Verifing and Packaging Template`});
        await new Promise(resolve => { setTimeout(resolve, (1000)); });

        const zipedTemplates = await packageTemplateSet2(folder, zipOut);
        logger.debug('zipedTempaltes', zipedTemplates);
        // debugger;

        /**
         * if we have gotten this far, it's time to get ready for POST
         */

        // //f5-sdk-js version
        progress.report({ message: `Uploading Template set`});
        await new Promise(resolve => { setTimeout(resolve, (1000)); });
        // const uploadStatus = await multiPartUploadSDK(zipOut, host, authToken);
        const uploadStatus = await ext.mgmtClient?.upload(zipOut);
        // logger.debug('sdk upload response', uploadStatus);
        


        // debugger;
        progress.report({ message: `Installing Template set`});
        await new Promise(resolve => { setTimeout(resolve, (1000)); });

        const importStatus: any = await ext.mgmtClient?.makeRequest('/mgmt/shared/fast/templatesets', {
            method: 'POST',
            body: {
                name: justFolderName
            }
        });
        // logger.debug('template import status: ', importStatus);
        
        progress.report({ message: `${importStatus.statusText} - Removing Temporary Files...`});
        logger.debug(`Deleting zip: ${zipOut}`);
        fs.unlinkSync(zipOut);
        await new Promise(resolve => { setTimeout(resolve, (3000)); });

    });
}

// https://github.com/zinkem/fast-docker/blob/master/templates/index.yaml

/**
 * Second try - WORKING!!!!
 * package templateSet function from f5-fast-core cli
 * @param tsPath path to folder containing ONLY fast templates
 * @param dst output path/file.zip
 */
async function packageTemplateSet2(tsPath: string, dst: string) {
    logger.debug('packagingTemplateSet, path: ', tsPath, 'destination: ', dst);
    
    const tempVal = await validateTemplateSet(tsPath)
    .then(async () => {
        const tsName = path.basename(tsPath);
        const tsDir = path.dirname(tsPath);
        const provider = new fast.FsTemplateProvider(tsDir, [tsName]);
        // logger.debug('provider object below \\/\\/', provider);

        // dst = dst || `./${tsName}.zip`;
        // logger.debug('dest file name', dst);
        
        const fastPackage = await provider.buildPackage(tsName, dst)
            .then(() => {
                // logger.debug(`tspath ${tsPath}`);
                logger.debug(`Template set "${tsName}" packaged as ${dst}`);
                return dst;
            })
            .catch((error: any) => {
                logger.debug(error);
            });
        // return fastPackage;
    })
    .catch( e => {
        logger.error(e);
    });
    return tempVal;
}


/**
 * f5-fast-core load template function
 * https://github.com/f5devcentral/f5-fast-core/blob/develop/cli.js
 * @param templatePath 
 */
async function loadTemplate(templatePath: string) {
    const tmplName = path.basename(templatePath, path.extname(templatePath));
    const tsName = path.basename(path.dirname(templatePath));
    const tsDir = path.dirname(path.dirname(templatePath));
    const provider = new fast.FsTemplateProvider(tsDir, [tsName]);
    return provider.fetch(`${tsName}/${tmplName}`)
        .catch((e: { stack: any; }) => {
            const validationErrors = fast.Template.getValidationErrors();
            if (validationErrors !== 'null') {
                console.error(validationErrors);
            }
            console.error(`failed to load template\n${e.stack}`);
            process.exit(1);
        });
};

const validateTemplate = (templatePath: string) => loadTemplate(templatePath)
    .then(() => {
        logger.debug(`template source at ${templatePath} is valid`);
    });


/**
 * f5-fast-core validate template set function
 * https://github.com/f5devcentral/f5-fast-core/blob/develop/cli.js
 * @param tsPath 
 */
async function validateTemplateSet (tsPath: string) {
    const tsName = path.basename(tsPath);
    const tsDir = path.dirname(tsPath);
    // const provider = new fast.FsTemplateProvider(tsDir, [tsName]);
    const provider = new fast.FsTemplateProvider(tsPath);
    logger.debug('validating template set!!!');
    
    return provider.list()
        .then((templateList: any) => Promise.all(templateList.map((tmpl: any) => provider.fetch(tmpl))))
        .catch((e: { stack: any; }) => {
            vscode.window.showWarningMessage(`Template set "${tsName}" failed validation:\n${e.stack}`);
            console.error(`Template set "${tsName}" failed validation:\n${e.stack}`);
            return Promise.reject(`Template set "${tsName}" failed validation`);
        });
};

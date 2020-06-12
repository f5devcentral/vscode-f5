'use strict';
import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import * as path from 'path';
import * as fs from 'fs';

/*
most of these functions are extracted from f5-fast-core cli
https://github.com/f5devcentral/f5-fast-core/blob/develop/cli.js
*/

// const path = require('path');
// import { displayWebView } from './fastHtmlPreveiwWebview';

const fast = require('@f5devcentral/f5-fast-core');

export async function zipPost (doc: string) {

    /*
    look at using a system temp directory also fs.mkdtemp(dirprefix)
    https://nodejs.org/api/fs.html#fs_fs_mkdtemp_prefix_options_callback
    https://code.visualstudio.com/api/references/vscode-api#ExtensionContext
    */

    // const coreDir = ext.context.globalStoragePath;
    const coreDir = ext.context.extensionPath;
    const tmpDir = '/fastTemplateUpload/';
    const fullTempDir = path.join(coreDir, tmpDir);
    const zipOut = path.join(fullTempDir, 'fastTempUpload.zip');

    console.log(fullTempDir);
    // log whats in the current coreDir-ext storagePath
    console.log(fs.readdirSync(coreDir));
    
    // debugger;
    //  if the temp directory is not there, create it
    if (!fs.existsSync(fullTempDir)) {
        fs.mkdirSync(fullTempDir);
    }
    // log whats in the new folder in above dir
    console.log(fs.readdirSync(fullTempDir));

    fs.writeFileSync(path.join(fullTempDir, 'testFile.mst'), doc);
    // fs.writeFileSync(path.join(coreDir, 'testFile.txt'), 'testttties!!!');
    
    // debugger;
    // const tempZip = packageTemplateSet(fullTempDir);
    const package1 = await packageTemplateSet2(fullTempDir, zipOut);
    console.log(package1);
    
    // debugger;
    // console.log(`Pending Delete`);
    // // if the temp directory is there, list contents, delete all files, then delete the directory
    // if (fs.existsSync(fullTempDir)) {
    //     const dirContents = fs.readdirSync(fullTempDir);
    //     // debugger;
    //     dirContents.map( item => {
    //         const pathFile = path.join(fullTempDir, item);
    //         console.log(`Deleting file: ${pathFile}`);
    //         fs.unlinkSync(pathFile);
    //     });
        
    //     console.log(`Deleting folder: ${fullTempDir}`);
    //     fs.rmdirSync(fullTempDir, { recursive: true });
    // }
}


// https://github.com/zinkem/fast-docker/blob/master/templates/index.yaml


async function packageTemplateSet2(tsPath: string, dst?: string) {
    console.log('packagingTemplateSet, path: ', tsPath, 'destination: ', dst);
    
    await validateTemplateSet(tsPath)
    .then(async () => {
        const tsName = path.basename(tsPath);
        const tsDir = path.dirname(tsPath);
        const provider = new fast.FsTemplateProvider(tsDir, [tsName]);
        console.log('provider object below \\/\\/', provider);

        dst = dst || `./${tsName}.zip`;
        console.log('dest file name', dst);
        
        await provider.buildPackage(tsName, dst)
            .then(() => {
                console.log(`tspath ${tsPath}`);
                console.log(`Template set "${tsName}" packaged as ${dst}`);
                return dst;
            })
            .catch((error: any) => {
                console.log(error);
            });
    });

}



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
        console.log(`template source at ${templatePath} is valid`);
    });



async function validateTemplateSet (tsPath: string) {
    const tsName = path.basename(tsPath);
    const tsDir = path.dirname(tsPath);
    const provider = new fast.FsTemplateProvider(tsDir, [tsName]);
    console.log('validating template set!!!');
    
    return provider.list()
        .then((templateList: any) => Promise.all(templateList.map((tmpl: any) => provider.fetch(tmpl))))
        .catch((e: { stack: any; }) => {
            console.error(`Template set "${tsName}" failed validation:\n${e.stack}`);
            // process.exit(1);
        });
};

function packageTemplateSet(tsPath: string, dst?: string) {
    console.log('packagingTemplateSet, path: ', tsPath, dst);
    
    // validateTemplateSet(tsPath)
    // .then(() => {
    //     const tsName = path.basename(tsPath);
    //     const tsDir = path.dirname(tsPath);
    //     const provider = new fast.FsTemplateProvider(tsDir, [tsName]);
    //     console.log('provider', provider);

    //     dst = dst || `./${tsName}.zip`;
    //     console.log('dest file name', dst);
        

    //     return provider.buildPackage(tsName, dst)
    //         .then(() => {
    //             console.log(`Template set "${tsName}" packaged as ${dst}`);
    //         });
    // });
};

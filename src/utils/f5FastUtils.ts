import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import * as path from 'path';
import * as fs from 'fs';
// import { displayWebView } from './fastHtmlPreveiwWebview';

const fast = require('@f5devcentral/f5-fast-core');


export async function zipPost (doc: string) {

    // const coreDir = ext.context.globalStoragePath;
    const coreDir = ext.context.extensionPath;
    const tmpDir = '/fastTemplateUpload';
    const fullTempDir = path.join(coreDir, tmpDir);

    console.log(fullTempDir);
    // log whats in the current coreDir-ext storagePath
    console.log(fs.readdirSync(coreDir));
    
    debugger;
    if (!fs.existsSync(fullTempDir)) {
        fs.mkdirSync(fullTempDir);
    }
    // log whats in the new folder in above dir
    console.log(fs.readdirSync(fullTempDir));

    
    debugger;
    fs.writeFileSync(path.join(fullTempDir, 'testFile.mst'), doc);
    // fs.writeFileSync(path.join(coreDir, 'testFile.txt'), 'testttties!!!');

    debugger;
    console.log(`Pending Delete`);

    if (fs.existsSync(fullTempDir)) {
        const dirContents = fs.readdirSync(fullTempDir);
        debugger;
        dirContents.map( item => {
            const pathFile = path.join(fullTempDir, item);
            console.log(`Deleting file: ${pathFile}`);
            fs.unlinkSync(pathFile);
        });
        
        console.log(`Deleting folder: ${fullTempDir}`);
        fs.rmdirSync(fullTempDir, { recursive: true });
    }
}


// https://github.com/zinkem/fast-docker/blob/master/templates/index.yaml


// export async function renderHtmlPreview(input: string) {
//     // fast.guiUtils.generateHtmlPreview(input)
//     // .then( (viewA: any) => {
//     //     console.log(viewA);
//     // });

//     const templateEngine = await fast.Template.loadYaml(input);

//     const schema = templateEngine.getParametersSchema();
//     // const view = {};
//     const htmlData = fast.guiUtils.generateHtmlPreview(schema, {});
//     displayWebView(htmlData);
    
// }


export async function templateFromYaml(input: string) {

    // const rendered = await fast.Template.loadYaml(input);

    // console.log(`fast renderHtmlPreview ymlData string below`);
    // console.log(rendered.getParametersSchema);
    // console.log(rendered.render);

    

    fast.Template.loadYaml(input)
    .then((template: { getParametersSchema: () => any; render: (arg0: { message: string; }) => any; }) => {
        console.log(template.getParametersSchema());
        console.log(template.render({ message: "my message!!!" }));
    });

    // fast.template.Hello;
}
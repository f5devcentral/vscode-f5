import * as vscode from 'vscode';
import { ext } from '../extensionVariables';
import * as path from 'path';
import * as fs from 'fs';
import { displayWebView } from './fastHtmlPreveiwWebview';

const fast = require('@f5devcentral/f5-fast-core');


// https://github.com/zinkem/fast-docker/blob/master/templates/index.yaml


export async function renderHtmlPreview(input: string) {
    // fast.guiUtils.generateHtmlPreview(input)
    // .then( (viewA: any) => {
    //     console.log(viewA);
    // });

    const schema = {
        properties: {
            foo: { type: 'string' }
        }
    };
    const view = {};
    const htmlData = fast.guiUtils.generateHtmlPreview(schema, view);
    // console.log(htmlData);

    // fs.writeFileSync(path.join(ext.context.extensionPath, "test.html"), htmlData, 'utf-8');
    // fs.writeFileSync(path.join(ext.context.extensionPath, "test.html"), htmlData, 'utf-8'), (err: any, data: any) => {
    //     if (err) {
    //         throw err;
    //     };
    //     console.log(data);
    // };

    displayWebView(htmlData);
    
}


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
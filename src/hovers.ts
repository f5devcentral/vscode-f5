
/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com.
 */

'use strict';

import { ExtensionContext, Hover, languages, window } from "vscode";
import { EventEmitter } from 'events';
import { parseX509 } from "./x509";
import jsyaml from "js-yaml";


export class Hovers {

    constructor(context: ExtensionContext, events: EventEmitter) {
        // https://github.com/microsoft/vscode/issues/54883

        //https://github.com/legatoproject/VsCodePlugin/blob/f106b0a56a29d3d8fc871b2b12914e39dd7e7c59/src/commons/hover.ts#L37
        context.subscriptions.push(languages.registerHoverProvider({ scheme: '*', language: '*' }, {
            provideHover(document, position, token) {

                const selection = window.activeTextEditor?.selection;
                if(selection) {

                    const word = document.getText(selection);
    
                    const reg = /-{3,}BEGIN CERTIFICATE-{3,}[\s\S]+?-{3,}END CERTIFICATE-{3,}/;
                    const cert = new RegExp(reg, "g");
    
                    if (cert.test(word)) {
                        const parsed2Json = parseX509(word);
                        const parsed2Yml = jsyaml.safeDump(JSON.parse(parsed2Json), { indent: 4 });
                        return new Hover({ language: 'yaml', value: parsed2Yml });
                    }
                }
            }

        }));


        // get current line text
        // https://gist.github.com/moshfeu/6f61dfb8e1f5e20320ba359501e2c96c
        // const {text} = activeEditor.document.lineAt(activeEditor.selection.active.line);


        context.subscriptions.push(languages.registerHoverProvider({ scheme: '*', language: 'json' }, {
            provideHover(document, position, token) {

                // get the entire line from the editor doc
                const docLineText = document.lineAt(position.line).text;

                // is this a json line?  "key": "...capture..."
                const jsonLine = docLineText.match(/\"[\w\-\/_.]+\": ?\"(.+)\".?/)?.[1];


                if (jsonLine) {

                    if (/-{3,}BEGIN CERTIFICATE-{3,}[\s\S]+?-{3,}END CERTIFICATE-{3,}/.test(jsonLine)) {
                        
                        // if this is a certificate, parse it
                        const parsed2Json = parseX509(jsonLine);
                        const parsed2Yml = jsyaml.safeDump(JSON.parse(parsed2Json), { indent: 4 });
                        return new Hover({ language: 'yaml', value: parsed2Yml });

                    } else {

                        // treat everything else as regular text, so clean up the excaping and display
                        let bodyText = jsonLine.replace(/\\\"/g, '\"');
                        bodyText = bodyText.replace(/\\n/g, '\n');
                        return new Hover({ language: 'yaml', value: bodyText });
                    }
                }
            }
        }));


        // //  ********* working ************
        // context.subscriptions.push(languages.registerHoverProvider({ scheme: '*', language: 'json' }, {
        //     provideHover(document, position, token) {

        //         const certRange = document.getWordRangeAtPosition(position, /"-{3,}BEGIN CERTIFICATE-{3,}[\s\S]+?/);
        //         const tRange = document.getWordRangeAtPosition(position, /\"[\w\-\/_.]+\": ?\".+\".?/);

        //         const docLineText = document.lineAt(position.line).text;
                
        //         if (certRange) {

        //             const cert = docLineText.match(/-{3,}BEGIN CERTIFICATE-{3,}[\s\S]+?-{3,}END CERTIFICATE-{3,}/)?.[0];

        //             const certText = cert ? cert : '';

        //             const parsed2Json = parseX509(certText);
        //             const parsed2Yml = jsyaml.safeDump(JSON.parse(parsed2Json), { indent: 4 });
                    
        //             return new Hover({ language: 'yaml', value: parsed2Yml });
                    
        //         } else if (tRange) {
        //             // const docLineText = document.lineAt(position.line).text;
        //             const body = docLineText.match(/\"[\w\-\/_.]+\": ?\"(.+)\".?/)?.[1];

        //             let bodyText = body ? body : '';

                    
        //             // const bt2 = bodyText.replace(/\\\\/g, '\\');
        //             try {
        //                 // const jsonBody = docLineText.trim();
        //                 // const jsonBody2 = jsonBody.replace(/\,$/, '');
        //                 // const jsonBody3 = JSON.parse(`{${docLineText}}`);
        //                 bodyText = bodyText.replace(/\\\"/g, '\"');
        //                 bodyText = bodyText.replace(/\\n/g, '\n');
        //                 // const json4 = json3.replace(/ /g, '');
        //                 // const bt2 = JSON.parse(JSON.stringify(json4));

        //                 // const b3 = JSON.parse(bt2);
        //                 // const b4 = b3;
        //                 return new Hover({ language: 'yaml', value: bodyText });
        //             } catch (e) {
        //                 debugger;
        //             }

        //         }
        //     }
        // }));

        // // https://github.com/microsoft/vscode-docs-archive/blob/778fa93e48cc378fc3b9755207c57a0e03ed225c/api/references/document-selector.md
        // languages.registerHoverProvider(
        //     { scheme: 'untitled', language: 'json' },
        //     {
        //       provideHover(doc, pos, token) {

        //         const hoveredWord = doc.getText(doc.getWordRangeAtPosition(pos));
        //         const cert = new RegExp(/(?m)^-{3,}BEGIN CERTIFICATE-{3,}$(?s).*?^-{3,}END CERTIFICATE-{3,}$/, "g");
        //         if (cert.test(hoveredWord)) {
        //             const asdf = '';
        //         }
        //         return new Hover('For new, unsaved TypeScript documents only');
        //       }
        //     }
        //   );

        // context.subscriptions.push(languages.registerHoverProvider({scheme: '*', language: '*'}, { 
        //     provideHover(document, position, token) {
        //         const hoveredWord = document.getText(document.getWordRangeAtPosition(position));
        //         const cert = new RegExp(/(?m)^-{3,}BEGIN CERTIFICATE-{3,}$(?s).*?^-{3,}END CERTIFICATE-{3,}$/, "g");
        //         if (cert.test(hoveredWord)) {
        //             // const x = parseInt(hoveredWord, 16);
        //             return new Hover('awesomeness');
        //         }

        //     }
        // }));
    }

}








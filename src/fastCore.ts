/*
 * Copyright 2020. F5 Networks, Inc. See End User License Agreement ("EULA") for
 * license terms. Notwithstanding anything to the contrary in the EULA, Licensee
 * may copy and modify this software product for its internal business purposes.
 * Further, Licensee may upload, publish and distribute the modified version of
 * the software product on devcentral.f5.com or github.com/f5devcentral.
 */

'use strict';

import { 
  commands,
  EndOfLine,
  ExtensionContext,
  languages,
  Position,
  Range,
  Selection,
  window
} from 'vscode';
import { isObject } from 'f5-conx-core';

import { logger } from './logger';
import { ext } from './extensionVariables';

/**
 * Provides command to download github releases of this extension so users can easily access beta versions for testing
 */
export class FastCore {

    // fastYamlBase = [
    //     'title: $1',
    //     'description: $2',
    //     'template: |',
    // ];
    // fastYamlExtended = [
    //     'parameters:',
    //     'definitions:'
    // ];

    constructor(context: ExtensionContext) {

        context.subscriptions.push(commands.registerCommand('f5-fast.as3ToFastYml', async (text) => {

            ext.telemetry.capture({ command: 'f5-fast.as3ToFastYml' });

            
            logger.info('f5-fast.as3ToFastYml, converting as3 declaration to fast yaml template');
            const editor = window.activeTextEditor;

            if (editor) {
                const document = editor.document;

                // capture selected text or all text in editor
                if (editor.selection.isEmpty) {
                    text = editor.document.getText();	// entire editor/doc window
                } else {
                    text = editor.document.getText(editor.selection);	// highlighted text
                }

                await as3TemplateStrings(text)
                    .then(text => {

                        editor.edit(edit => {
                            edit.setEndOfLine(EndOfLine.LF);

                            text = text.replace(/\r\n/g, '\n');

                            // split on lines, add two spaces at beginning of each line, then put everything back together
                            text = text.split('\n').map((line: string) => `  ${line}`).join('\n');

                            const startPosition = new Position(0, 0);
                            const endPosition = document.lineAt(document.lineCount - 1).range.end;
                            edit.replace(new Range(startPosition, endPosition), text);
                        });

                        // change the editor language to yaml
                        languages.setTextDocumentLanguage(document, 'yaml');
                        // move the cursor to the very beginning of the doc/editor
                        editor.selection = new Selection(new Position(0, 0), new Position(0, 0));
                        // insert snippet
                        commands.executeCommand("editor.action.insertSnippet", { langId: "yaml", name: 'FAST YAML Extended' },);

                    })
                    .catch(err => {
                        logger.error('f5-fast.as3ToFastYml failed', err);
                    });


            }
        }));
    }
}

/**
 * look for as3 tenant object definition and replace with {{tenant_name}} for fast template
 * @param text as3 declaration as string
 */
export async function as3TemplateStrings(text: string): Promise<string> {

    // let's try to parse the as3 declarationn and put in a template string for the tenant
    const dec = JSON.parse(text);

    if (dec?.declaration) {

        logger.info('f5-fast.as3ToFastYml: AS3 parent class');

        // we got an AS3/declaration
        Object.entries(dec.declaration).forEach(([key, value]) => {

            // look at the objects (application pieces)
            if (isObject(value) && (value as unknown as { class: string })?.class) {

                // recast object param as needed
                const appVal: { class: string } = (value as unknown) as { class: string };

                // capture the class of each application piece
                if (appVal?.class === 'Tenant') {
                    // we found the tenant class
                    delete dec.declaration[key];
                    dec.declaration['{{tenant_name}}'] = value;

                    // made our needed change, let's exit
                    return;
                }
            }
        });
    } else {

        logger.info('f5-fast.as3ToFastYml: ADC parent class');

        // this is a list of ADC tenants
        Object.entries(dec).forEach(([key, value]) => {

            // look at the objects (application pieces)
            if (isObject(value) && (value as unknown as { class: string })?.class) {

                // recast object param as needed
                const appVal: { class: string } = (value as unknown) as { class: string };

                // capture the class of each application piece
                if (appVal?.class === 'Tenant') {
                    // we found the tenant class
                    delete dec[key];
                    dec['{{tenant_name}}'] = value;

                    // made our needed change, let's exit
                    return;
                }
            }
        });
    }

    // return the declaration back in string form but with 2 spaces to better match yamls format
    return JSON.stringify(dec, undefined, 2);
}


const exampleFastTemplate = `
title: Simple UDP Application
description: Simple UDP load balancer using the same port on client and server side.
parameters:
  tenant_name: AgilityFastTemplate
  application_name: defaultsUDP_5555
  virtual_address: 192.50.2.1
  virtual_port: 5555
  server_addresses:
    - 192.50.2.2
    - 192.50.2.3
  service_port: 8888
definitions:
  tenant_name:
    title: Tenant Name
    type: string
    description: partition on bigip
template: |
  {
    "class": "ADC",
    "schemaVersion": "3.20.0",
    "{{tenant_name}}": {
      "class": "Tenant",
      "{{application_name}}": {
        "class": "Application",
        "template": "udp",
        "serviceMain": {
          "class": "Service_UDP",
          "virtualAddresses": [
            "{{virtual_address}}"
          ],
          "virtualPort": {{virtual_port::integer}},
          "pool": "{{application_name}}_Pool1"
        },
        "{{application_name}}_Pool1": {
          "class": "Pool",
          "monitors": [
            "icmp"
          ],
          "members": [
            {
              "serverAddresses": {{server_addresses::array}},
              "servicePort": {{service_port::integer}}
            }
          ]
        }
      }
    }
  }`;
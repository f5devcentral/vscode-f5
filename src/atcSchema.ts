

import { isValidJson } from "./utils/utils";
import { window } from "vscode";
// import * as fs from 'fs';
import { git } from './extensionVariables';
import logger from './utils/logger';


/**
 * detects ATC dec type and injects appropriate schema
 *  - will also remove schema reference
 */
export async function injectSchema (text: string) {
    
    let dec = isValidJson(text);
    // let returnDec = {};

    if (!dec) {
        const msg = 'Not valid JSON object';
        logger.debug(msg);
        window.showErrorMessage(msg);
        return;
    }
    
    // var dec = JSON.parse(text);
    if(dec.hasOwnProperty('$schema')) {

        logger.debug('Removing schema from declaration');
        // if declaration has schema reference -> remove it
        // this only looks at the parent level
        delete dec.$schema;
        // return dec;

    } else {

        // schema not detected -> adding appropriate schema
        if(dec.hasOwnProperty('class') && dec.class === 'AS3') {

            logger.debug('got a regular new as3 declaration with deployment parameters -> adding as3 schema');
            
            // the following add the schema to the beginning of the dec as compared
            //      to the typical dec.$schema param add would put it at the end
            dec = { "$schema": git.latestAS3schema, ...dec };
            
        } else if (dec.hasOwnProperty('class') && dec.class === 'ADC') {
            
            // typically come from getting existing decs from as3 service
            // so, we wrap the declartion with details of the necessary ADC class
            logger.debug('got a bare ADC declaration -> wrapping with AS3 object/params/schema');
            
            dec = {
                "$schema": git.latestAS3schema,
                "class": "AS3",
                declaration: dec
            };
            
        } else if (dec.hasOwnProperty('class') && dec.class === 'Device') {
            
            logger.debug('Detected DO declaration -> adding schema');
            dec = { "$schema": git.latestDOschema, ...dec };
            
        } else if (dec.hasOwnProperty('class') && dec.class === 'Telemetry') {
            
            logger.debug('Detected TS declaration -> adding schema');
            dec = { "$schema": git.latestTSschema, ...dec };

        } else {

            const msg = `Could not find base declaration class for as3/do/ts or ADC`;
            logger.debug(msg);
            window.showInformationMessage(msg);
            return;

        }

    }
    return dec;




    // Get the active text editor


    // const {activeTextEditor} = window;

    // if (activeTextEditor && activeTextEditor.document.languageId === 'json') {
    //     const { document } = activeTextEditor;

    //     activeTextEditor.edit( e => {
    //         const startPosition = new Position(0, 0);
    //         const endPosition = document.lineAt(document.lineCount - 1).range.end;
    //         e.replace(new Range(startPosition, endPosition), text);
    //     });

    //     workspace.applyEdit()
    //     // const firstLine = document.lineAt(0);
    //     // const lastLine = document.lineAt(document.lineCount - 1);
    //     // var textRange = new Range(0,
    //     // firstLine.range.start.character,
    //     // document.lineCount - 1,
    //     // lastLine.range.end.character);
    //     // editor.edit( edit => {
    //     //     edit.replace(textRange, dec);
    //     // });
    //     // if (firstLine.text !== '42') {
    //     //     const edit = new WorkspaceEdit();
    //     //     edit.insert(document.uri, firstLine.range.start, '42\n');
    //     //     return workspace.applyEdit(edit)
    //     // }
    // }
    // const { activeTextEditor } = window;
    // const { document } = activeTextEditor;

    // const fullText = document.getText();
    // const fullRange = new Range(
    // 	document.positionAt(0),
    // 	document.positionAt(fullText.length - 1)
    // )

    // let invalidRange = new Range(0, 0, textDocument.lineCount /*intentionally missing the '-1' */, 0);
    // let fullRange = textDocument.validateRange(invalidRange);
    // editor.edit(edit => edit.replace(fullRange, newText));
    


    // var firstLine = textEdit.document.lineAt(0);
    // var lastLine = textEditor.document.lineAt(textEditor.document.lineCount - 1);
    // var textRange = new Range(0,
    // firstLine.range.start.character,
    // textEditor.document.lineCount - 1,
    // lastLine.range.end.character);

    // textEditor.edit(function (editBuilder) {
    // 	editBuilder.replace(textRange, '$1');
    // });


    // editor.edit(builder => builder.replace(textRange, newText));
    // });
}
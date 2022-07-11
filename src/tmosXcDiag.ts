'use strict';

import path from "path";
import fs from "fs";

import {
    window,
    commands,
    ExtensionContext,
    Diagnostic,
    DiagnosticCollection,
    DiagnosticSeverity,
    languages,
    Position,
    Range,
    TextDocument,
    Uri
} from "vscode";

import tmosXcRules from './tmosXcRules.json';
import { logger } from "./logger";


export class XcDiag {

    diagXC: DiagnosticCollection;

    settingsFileLocation;
    rules;

    constructor(context: ExtensionContext) {
        // create diag collection
        this.diagXC = languages.createDiagnosticCollection('f5-tmos-xc');

        this.settingsFileLocation = path.join(context.extensionPath, 'out', 'tmosXcRules.json'); 
        this.rules = JSON.parse(fs.readFileSync(this.settingsFileLocation).toString());

        context.subscriptions.push(commands.registerCommand('f5.xc-diagRulesOpen', async () => {
            this.openRules();
        }));

        context.subscriptions.push(commands.registerCommand('f5.xc-diagRulesRefresh', async () => {
            this.loadRules();
        }));


        context.subscriptions.push(commands.registerCommand('f5.xc-diag', async () => {

            // if somehow this got called without an editor, pass
            const editor = window.activeTextEditor;
            if (!editor) {
                return;
            }
    
            if (editor) {
                // Since we have an editor
                this.updateDiagnostic(editor.document);
            }
    
        }));
    }

    loadRules() {
        logger.info("loading tmos->xc rules file");
        return this.rules = JSON.parse(fs.readFileSync(this.settingsFileLocation).toString());
    }
    
    openRules() {
        // const loc = path.join(context.Extens)
        // workspace.openTextDocument(this.settingsFileLocation);
        logger.info("opening tmos->xc rules file");
        return commands.executeCommand("vscode.open", Uri.parse(this.settingsFileLocation));
        // workbench.action.files.openFile
    }

    getDiagnostic(text: string): Diagnostic[] {

        // setup diagnostics array
        const diags: Diagnostic[] = [];

        const severities = [];
    
        const lines = text.split('\n');
    
        lines.forEach((value, index) => {
    
            // loop through rules on each line
            tmosXcRules.forEach(rule => {
    
                // if rule empty, pass
                if (rule.regex === '') { return; }
    
                // look for rule regex
                const match = value.match(rule.regex);
    
    
                if (match && match.index) {
    
                    // set rule severity
                    const severity
                        = rule.severity === "Error" ? DiagnosticSeverity.Error
                            : rule.severity === "Warning" ? DiagnosticSeverity.Warning
                                : rule.severity === "Information" ? DiagnosticSeverity.Information
                                    : DiagnosticSeverity.Hint;
    
                    // push diagnostic
                    diags.push({
                        code: rule.code,
                        message: rule.message,
                        range: new Range(
                            new Position(index, match.index),
                            new Position(index, match[0].length + match.index)
                        ),
                        severity
                    });

                    
                }
            });
        });
        return diags;
    }

    getDiagStats(diags: Diagnostic[]) {
        
        const stats: {
            Error?: number;
            Warning?: number;
            Information?: number;
            Hint?: number
        } = {};

        diags.forEach((d) => {

            if(d.severity === 0) {
                if( stats.Error ) {
                    stats.Error = stats.Error + 1;
                } else {
                    stats.Error =  1;
                }
            }

            if(d.severity === 1) {
                if( stats.Warning ) {
                    stats.Warning = stats.Warning + 1;
                } else {
                    stats.Warning =  1;
                }
            }

            if(d.severity === 2) {
                if( stats.Information ) {
                    stats.Information = stats.Information + 1;
                } else {
                    stats.Information =  1;
                }
            }
            
            if(d.severity === 3) {
                if( stats.Hint ) {
                    stats.Hint = stats.Hint + 1;
                } else {
                    stats.Hint =  1;
                }
            }


        });

        return stats;
    }

    updateDiagnostic(doc: TextDocument) {
        // clear current diags dispalyed
        this.diagXC.clear();

        // get the text from the doc/editor and feed through xc diagnostics
        const diags = this.getDiagnostic(doc.getText());

        // pubish the diags to document
        this.diagXC.set(doc.uri, diags);
    }
}


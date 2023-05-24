


import path from 'path';
import {
    CodeLens,
    CodeLensProvider as CLP,
    Range,
    TextDocument,
    EventEmitter as VsEventEmitter,
    Event as VsEvent,
    workspace
} from "vscode";






export class CodeLensProvider implements CLP {

    private _onDidChangeCodeLenses: VsEventEmitter<void> = new VsEventEmitter<void>();
    public readonly onDidChangeCodeLenses: VsEvent<void> = this._onDidChangeCodeLenses.event;

    constructor() {

        workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    async provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {

        const codeLens: CodeLens[] = [];

        const firstLine = new Range(0, 0, 0, 0);
        const secondLine = new Range(1, 0, 0, 0);

        const justFileName = path.parse(document.fileName).base;

        if (justFileName === 'tmosXcRules.json') {

            codeLens.push(
                new CodeLens(
                    firstLine,
                    {
                        command: 'workbench.action.files.save',
                        title: '--- SAVE ---',
                        tooltip: 'Click to save diagnostic rules',
                    }
                )
            );
        }

        return codeLens;
    }
}


import { EventEmitter } from 'events';
import {
    ExtensionContext,
    commands,
    window,
    CodeLens,
    CodeLensProvider,
    Command,
    Range,
    TextDocument,
    languages,
    EventEmitter as VsEventEmitter,
    Event as VsEvent,
    workspace,
    Disposable
} from "vscode";
import { logger } from './logger';
import { OaiDoc } from './oaiDocument';
import { NextApiTreeProvider, OaiPost } from "./treeViewsProviders/nextApiTreeProvider";






export class NextApi {
    // for managing the displaying of the document and diagnostics(schema-validation)
    public oaiDoc: OaiDoc;
    // creating the codeLens
    public oaiCodeLensProvider: CodeLensProvider;
    // codeLens disposable
    public codeLensProviderDisposable: Disposable;
    public nextApiTreeProvider: NextApiTreeProvider;


    constructor(
        context: ExtensionContext,
        events: EventEmitter
    ) {

        this.oaiDoc = new OaiDoc(context);

        this.oaiCodeLensProvider = new OaiCodeLensProvider(this.oaiDoc.docs);

        // codeLens provider
        this.codeLensProviderDisposable = languages.registerCodeLensProvider({
            language: 'json',
        },
            this.oaiCodeLensProvider
        );


        // NEXT API tree view registration
        this.nextApiTreeProvider = new NextApiTreeProvider(context);
        const nextApiTreeView = window.createTreeView('nxtApiView', {
            treeDataProvider: this.nextApiTreeProvider,
        });
        context.subscriptions.push(commands.registerCommand('f5.refreshNextApiTree', () => this.nextApiTreeProvider.refresh()));

        context.subscriptions.push(commands.registerCommand('f5.refreshNextApiTreeLocal', () => this.nextApiTreeProvider.refresh('local')));


        // not registered in pjson file...
        context.subscriptions.push(commands.registerCommand('f5.oaiPost', (x) => {
            // next-cm openapi post example for viewing, and posting
            this.oaiDoc.displayDoc(x);
        }));

        // not registered in pjson file...
        context.subscriptions.push(commands.registerCommand('f5.postOia', (x) => {
            // when the user clicks the codeLens to post the editor from f5.oaiPost, this will post to next and follow the job to completion
            window.showErrorMessage('f5.postOia - called, but not implemented yet');
        }));




    }


}



export class OaiCodeLensProvider implements CodeLensProvider {

    private _onDidChangeCodeLenses: VsEventEmitter<void> = new VsEventEmitter<void>();
    public readonly onDidChangeCodeLenses: VsEvent<void> = this._onDidChangeCodeLenses.event;

    constructor(
        public oaiDoc: { doc: TextDocument, oaiPost: OaiPost }[]
    ) {

        workspace.onDidChangeConfiguration((_) => {
            this._onDidChangeCodeLenses.fire();
        });
    }

    async provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {

        // return [];
        // search list of oai docs and find a match
        const cDoc = this.oaiDoc.filter(x => {
            return x.doc === document;
        })[0];

        const codeLens: CodeLens[] = [];

        if (cDoc) {

            const firstLine = new Range(0, 0, 0, 0);
            const secondLine = new Range(1, 0, 0, 0);

            const title = [
                cDoc.oaiPost.method,
                cDoc.oaiPost.path,
                cDoc.oaiPost?.schemaRef
            ].join(' - ');

            codeLens.push(
                new CodeLens(
                    firstLine,
                    {
                        command: 'f5.postOia',
                        title,
                        arguments: [cDoc]
                    }
                )
            );
        }

        return codeLens;
    }
}
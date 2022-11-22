
import ajv, { AnySchema } from 'ajv';

import { workspace, window, TextDocument, languages, ExtensionContext, Diagnostic, CodeLensProvider, CodeLens, Range, Command } from "vscode";
import { OaiPost } from "./treeViewsProviders/nextApiTreeProvider";


export class OaiDoc {
    docs: { doc: TextDocument, oaiPost: OaiPost }[] = [];
    lastDoc: TextDocument | undefined;

    diag = languages.createDiagnosticCollection('f5-next');

    constructor(context: ExtensionContext) {
        //nothing for now

        context.subscriptions.push(
            workspace.onDidChangeTextDocument(e => {

                const cDoc = this.docs.filter(x => x.doc === e.document )[0];
                this.updateDiagnostic(e.document, cDoc.oaiPost);
            })
        );

        context.subscriptions.push(
            workspace.onDidCloseTextDocument(doc => this.diag.delete(doc.uri))
        );
    }


    async displayDoc(oaiPost: OaiPost): Promise<any> {

        const doc = await workspace.openTextDocument({
            language: 'json',
            content: JSON.stringify(oaiPost.example, undefined, 4)
        })
            .then(doc => {
                window.showTextDocument(doc, { preview: false });
                // doc.oaiPost = item;
                this.updateDiagnostic(doc, oaiPost);

                return doc;
            });

        // now use the doc to push diagnostics/schema-validation and codeLense
        


        this.docs.push({ doc, oaiPost });
    }




    getDiagnostic(jsn: unknown, oaiPost: OaiPost): Diagnostic[] {

        const ncmAjv = new ajv();
        const validate = ncmAjv.compile(oaiPost?.schema as AnySchema);
        const valid = validate(jsn);

        if(!valid) {
            const x = validate.errors;
            debugger;
        }


        return [];
    }

    getActions(jsn: unknown): any {
        // provide code actions (codeLens)
        // was implemented else where
    }



    updateDiagnostic( doc: TextDocument, oaiPost: OaiPost ) {

        // clear current diags in this class
        this.diag.clear();
        // clear the current diags in the doc/editor
        this.diag.delete(doc.uri);

        // capture the doc we are working with
        this.lastDoc = doc;

        // get the text from the doc/editor and feed through xc diagnostics
        const diags = this.getDiagnostic(doc.getText(), oaiPost);

        // pubish the diags to document
        this.diag.set(doc.uri, diags);
    }
}







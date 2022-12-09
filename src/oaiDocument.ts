
import ajv, { AnySchema } from 'ajv';

import { workspace, window, TextDocument, languages, ExtensionContext, Diagnostic, CodeLensProvider, CodeLens, Range, Command, commands, Uri, Position } from "vscode";
import { OaiPost } from "./treeViewsProviders/nextApiTreeProvider";



workspace.onDidChangeTextDocument(e => {

    // const cDoc = this.docs.filter(x => x.doc === e.document )[0];
    // this.updateDiagnostic(e.document, cDoc.oaiPost);
    const x = "";
});

workspace.onDidOpenTextDocument( e => {
    const x = "";
});

workspace.onDidCloseTextDocument(doc => {
    // this.diag.delete(doc.uri);
    const x = "";
});


export class OaiDoc {
    docs: { doc: TextDocument, oaiPost: OaiPost }[] = [];
    lastDoc: TextDocument | undefined;

    diag = languages.createDiagnosticCollection('f5-next');

    constructor(context: ExtensionContext) {
        //nothing for now

        // context.subscriptions.push(

        // );

        // context.subscriptions.push(
        //     workspace.onDidCloseTextDocument(doc => this.diag.delete(doc.uri))
        // );
    }


    async displayDoc(oaiPost: OaiPost): Promise<any> {

        // https://raw.githubusercontent.com/f5devcentral/vscode-f5/v3.10.0/schemas/nextCm/DeviceDiscoveryRequest.json

        const baseUrl = 'https://raw.githubusercontent.com/f5devcentral/vscode-f5/main/schemas/nextCm/';
        const schemaRefName = oaiPost.schemaRef?.split('/').pop() as string;
        // const schemaRef = oaiPost.schemaRef;
        if (oaiPost.example && schemaRefName) {
            // the following may seem a bit excessive, but gets the schema at the top of the object
            //      If you just add it as an object param, it gets added to the end/bottom

            // create a new object with the schema reference
            const tempObj = {
                "$schema": `${baseUrl}${schemaRefName}.json`
            };

            // merge the example object with the temp object above that already has the schema reference
            Object.assign(tempObj, oaiPost.example);

            // re-assing the new object back into the example
            oaiPost.example = tempObj;
        }

        const title = [
            oaiPost.method,
            oaiPost.path,
        ].join('-');

        var vDoc: Uri = Uri.parse("untitled:" + `${title}.json`);
        const doc = await workspace.openTextDocument(vDoc)
            .then((a: TextDocument) => {
                window.showTextDocument(a, undefined, false).then(async e => {
                    await e.edit(edit => {
                        const startPosition = new Position(0, 0);
                        const endPosition = a.lineAt(a.lineCount - 1).range.end;
                        edit.replace(new Range(startPosition, endPosition), JSON.stringify(oaiPost.example, undefined, 4));
                        commands.executeCommand("cursorTop");
                    });
                });
                return a;
            });
        // const doc = await workspace.openTextDocument({
        //     language: 'json',
        //     content: JSON.stringify(oaiPost.example, undefined, 4)
        // })
        //     .then(doc => {
        //         window.showTextDocument(doc, { preview: false });
        //         // doc.oaiPost = item;
        //         this.updateDiagnostic(doc, oaiPost);

        //         return doc;
        //     });

        // now use the doc to push diagnostics/schema-validation and codeLense
        


        this.docs.push({ doc, oaiPost });
    }




    getDiagnostic(jsn: unknown, oaiPost: OaiPost): Diagnostic[] {

        // const ncmAjv = new ajv();
        // const validate = ncmAjv.compile(oaiPost?.schema as AnySchema);
        // const valid = validate(jsn);

        // if(!valid) {
        //     const x = validate.errors;
        //     debugger;
        // }


        return [];
    }

    getActions(jsn: unknown): any {
        // provide code actions (codeLens)
        // was implemented else where
    }



    updateDiagnostic( doc: TextDocument, oaiPost: OaiPost ) {

        // // clear current diags in this class
        // this.diag.clear();
        // // clear the current diags in the doc/editor
        // this.diag.delete(doc.uri);

        // // capture the doc we are working with
        // this.lastDoc = doc;

        // // get the text from the doc/editor and feed through xc diagnostics
        // const diags = this.getDiagnostic(doc.getText(), oaiPost);

        // // pubish the diags to document
        // this.diag.set(doc.uri, diags);
    }
}







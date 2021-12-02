import * as assert from 'assert';
import fs = require('fs');
import path = require('path');


// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import { window, commands, EndOfLine, workspace} from 'vscode';
import * as utils from '../../utils/utils';

const snippets = requireText(path.join(__dirname, '..', '..', '..', 'snippets.json'));


/**
 * import/require file to string variable
 * @param path file path/name
 * @returns file contents as string
 */
 export function requireText(path: string): string {
    return fs.readFileSync(require.resolve(path)).toString();
}


suite('Extension GUI tests', () => {
	window.showInformationMessage('Starting gui tests.');
	test('open JSON editor -> insert as3 snippet', async () => {

		//	//	clear all open editors
		await commands.executeCommand('workbench.action.closeAllEditors');
		//	// open a new text editor
		const jsonEditor = await workspace.openTextDocument({ language: 'json' });
		//	//	show new text editor (make active)
		const textDoc = await window.showTextDocument(jsonEditor, {preview: false});

		//	//	inject sample as3 snippet
		await commands.executeCommand('editor.action.insertSnippet', 
			{ name: "example_F5_AS3_declaration"}
		);

		// set the end of line for linux
		await textDoc.edit(e => e.setEndOfLine(EndOfLine.LF));

		// capture editor text
		const editorText = jsonEditor.getText();

		// get original snippet text to compare
		const snippet = JSON.parse(snippets).example_F5_AS3_declaration.body;
		const snippet2 = snippet.join('\n').replace('\\$schema', '$schema');

		// const source = JSON.parse(snippet);
		// const output = JSON.parse(editorText);

		//	check snippet against isolated copy
		assert.deepStrictEqual(snippet2, editorText);
		
	}).timeout(5000);


	test('open test json in editor #1 - tests utils.displayJsonInEditor', async () => {
		await commands.executeCommand('workbench.action.closeAllEditors');

		//	//	option #1 - use the editor object created by the displayJsonInEditor function
		//			to know which editor has the text we need to test
		const testObj: object = { "key1": "value1", "key2": "value2"};
		const editr = await utils.displayJsonInEditor(testObj);
		assert.deepStrictEqual(testObj, JSON.parse(editr.document.getText()));
	});

	test('open test json in editor #2 - tests utils.displayJsonInEditor', async () => {
		await commands.executeCommand('workbench.action.closeAllEditors');

		//	//	option #2 - capture the active editor since we don't know what it is
		//			to know which editor has the text we need to test
		const testObj2: object = { "key1": "value1", "key2": "value2"};

		// need to wait for this to complete
		await utils.displayJsonInEditor(testObj2);

		// capture currrent editor
		const editor = window.activeTextEditor;
		
		if(!editor) {
			return Error("uh..oh...");
		}

		// get text from editor
		const text = editor.document.getText();

		assert.deepStrictEqual(testObj2, JSON.parse(text));

	}).timeout(5000);
});
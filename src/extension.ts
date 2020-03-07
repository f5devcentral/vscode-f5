// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { request } from 'https';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "f5-fast" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		const req = request(
			{
				host: 'api.chucknorris.io',
				path: '/jokes/random',
				method: 'GET',
			},
			response => {
				const chunks = [];
				response.on('data', (chunk) => {
				  chunks.push(chunk);
				});
				response.on('end', () => {
				  const result = Buffer.concat(chunks).toString();
				  console.log(result);
				  console.log(result);
				  //vscode.window.showTextDocument(document:)
				});
				var setting: vscode.Uri = vscode.Uri.parse("untitled:" + "C:\summary.txt");
				vscode.workspace.openTextDocument(setting).then((a: vscode.TextDocument) => {
					vscode.window.showTextDocument(a, 1, false).then(e => {
						e.edit(edit => {
							edit.insert(new vscode.Position(0, 0), "Your advertisement here");
						});
					});
				}, (error: any) => {
					console.error(error);
					debugger;
				});
			}
		);
		req.end();
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World!');
	});


	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}



//  https://api.chucknorris.io/jokes/random
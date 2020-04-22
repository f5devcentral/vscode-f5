import * as vscode from 'vscode';
import { request } from 'https';


export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "vscode-f5-fast" is now active!');

	// functionality: configure tree view
	//	-- https://medium.com/@sanaajani/creating-your-first-vs-code-extension-8dbdef2d6ad9
	//	-- https://github.com/Microsoft/vscode-extension-samples/tree/master/tree-view-sample
	//	-- https://stackoverflow.com/search?q=%5Bvisual-studio-code%5D+TreeDataProvider
	//	-- https://stackoverflow.com/questions/56534723/simple-example-to-implement-vs-code-treedataprovider-with-json-data

	
	// command: execute bash/tmsh on device
	//	-- use device details from tree view, post api to bash endpoint, show response



	let disposable = vscode.commands.registerCommand('extension.chuckJoke', async () => {
		//  https://api.chucknorris.io/jokes/random
		const chuckApiCall = {
			host: 'api.chucknorris.io',
			path: '/jokes/random',
			method: 'GET',
		}
		const req = request(chuckApiCall, response => {
				const chunks: any[] = [];
				response.on('data', (chunk) => {
					chunks.push(chunk);
				});
				response.on('end', () => {
					const result = JSON.parse(Buffer.concat(chunks).toString());
					console.log('chuck joke: ', result.value);
					vscode.window.showInformationMessage(`Getting Joke from https://api.chucknorris.io/jokes/random`);


					if (result) {
						vscode.workspace.openTextDocument({ content: `Chuck Joke: \r\n\r\n${ result.value }`).then(
							doc => vscode.window.showTextDocument(doc, { preview: false })
						), (error: any) => {
							console.error(error)
							debugger
						}
					}
				});
			}
		);
		req.end();
	});
	context.subscriptions.push(disposable);
}


// this method is called when your extension is deactivated
export function deactivate() {}

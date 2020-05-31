import * as vscode from 'vscode';
import { ext } from './extensionVariables';
import * as path from 'path';

import hljs = require('highlight.js');
hljs.registerLanguage('json', require('highlight.js/lib/languages/json'));

// import codeHighlightLinenums = require('code-highlight-linenums');


/**
 * Manages cat coding webview panels
 * working this catCodeing webView example
 * https://code.visualstudio.com/api/extension-guides/webview
 */
export class WebViewPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */

	public static currentPanel: WebViewPanel | undefined;

	public static readonly viewType = 'catCoding';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionPath: string;
	private _disposables: vscode.Disposable[] = [];

	public static render(extensionPath: string, data: object) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (WebViewPanel.currentPanel) {
            WebViewPanel.currentPanel._panel.reveal(column);
            WebViewPanel.currentPanel.update(data);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			WebViewPanel.viewType,
			'ReponsePanel',
			column || vscode.ViewColumn.One,
			{}
		);

		WebViewPanel.currentPanel = new WebViewPanel(panel, extensionPath, data);
	}

	public static revive(panel: vscode.WebviewPanel, extensionPath: string, data: object) {
		WebViewPanel.currentPanel = new WebViewPanel(panel, extensionPath, data);
	}

	private constructor(panel: vscode.WebviewPanel, extensionPath: string, data: object) {
		this._panel = panel;
		this._extensionPath = extensionPath;

		// Set the webview's initial html content
        this.update(data);

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this.update(data);
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	public doRefactor() {
		// Send a message to the webview webview.
		// You can send any JSON serializable data.
		this._panel.webview.postMessage({ command: 'refactor' });
	}

	public dispose() {
		WebViewPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	public update(data: object) {
        const webview = this._panel.webview;
        this._panel.title = 'Response';
        this._panel.webview.html = getWebviewContent(JSON.stringify(data, null, 4));
		// this._panel.webview.html = this._getHtmlForWebview(webview, JSON.stringify(data, null, 4));
        // return;

		// // Vary the webview's content based on where it is located in the editor.
		// switch (this._panel.viewColumn) {
		// 	case vscode.ViewColumn.Two:
		// 		this._updateForCat(webview, 'Compiling Cat');
		// 		return;

		// 	case vscode.ViewColumn.Three:
		// 		this._updateForCat(webview, 'Testing Cat');
		// 		return;

		// 	case vscode.ViewColumn.One:
		// 	default:
		// 		this._updateForCat(webview, 'Coding Cat');
		// 		return;
		// }
	}

	// private _updateForCat(webview: vscode.Webview, catName: keyof typeof cats) {
	// 	this._panel.title = catName;
	// 	this._panel.webview.html = this._getHtmlForWebview(webview, cats[catName]);
	// }

	// private _getHtmlForWebview(webview: vscode.Webview, stuff: string) {
	// 	// Local path to main script run in the webview
	// 	const scriptPathOnDisk = vscode.Uri.file(
	// 		path.join(this._extensionPath, 'media', 'main.js')
    //     );
        
    //     const styleFilePath = vscode.Uri.file(path.join(
    //         ext.context.extensionPath,
    //         'styles',
    //         'webView.css'
    //         ))
    //         .with({ scheme: 'vscode-resource' });

	// 	// And the uri we use to load this script in the webview
	// 	const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

	// 	// // Use a nonce to whitelist which scripts can be run
	// 	// const nonce = getNonce();

    //     return `<!DOCTYPE html>
    //     <html lang="en">
    //     <head>
    //         <meta charset="UTF-8">
    //         <meta name="viewport" content="width=device-width, initial-scale=1.0">
    //         <link rel="stylesheet" href="${styleFilePath}">
    //     </head>
    //     <body>
    //     <div>
    //     <pre><code>
    //     ${codeHighlightLinenums(stuff, { hljs, lang: 'json', start: 1 })}
    //     </code></pre>
    //     </div>
    //     </body>
    //     </html>`;
	// }
}

// function getNonce() {
// 	let text = '';
// 	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
// 	for (let i = 0; i < 32; i++) {
// 		text += possible.charAt(Math.floor(Math.random() * possible.length));
// 	}
// 	return text;
// }














export async function displayWebView(info: object) {
    
    // Track currently webview panel
    let currentPanel: vscode.WebviewPanel | undefined;

    const columnToShowIn = vscode.window.activeTextEditor
    ? vscode.window.activeTextEditor.viewColumn
    : undefined;

    if (currentPanel) {
    // If we already have a panel, show it in the target column
    currentPanel.reveal(columnToShowIn);
    } else {
    // Otherwise, create a new panel
        currentPanel = vscode.window.createWebviewPanel(
            'atcResponse',
            'ATC Response',
            vscode.ViewColumn.Two,
            {}
        );
        currentPanel.webview.html = getWebviewContent(JSON.stringify(info, null, 4));

        currentPanel.onDidDispose(
            () => {
                currentPanel = undefined;
            },
            null,
            ext.context.subscriptions
        );
    }
}

function getWebviewContent(stuff : string) {
    const highlightedCode = hljs.highlightAuto(stuff).value;
    const styleFilePath = vscode.Uri.file(path.join(
        ext.context.extensionPath,
        'styles',
        'webView.css'
        ))
        .with({ scheme: 'vscode-resource' });

    return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="${styleFilePath}">
  </head>
  <body>
  <pre><code>${highlightedCode}</code></pre>
  </body>
  </html>`;
}

/*
*   Other way that include line numbers.  
*       couldn't find a types file for "code-highlight-linenums"
*/
// function getWebviewContent(stuff : string) {
//     // const highlightedCode = hljs.highlightAuto('json', stuff).value;
//     const styleFilePath = vscode.Uri.file(path.join(
//         ext.context.extensionPath,
//         'styles',
//         'webView.css'
//         ))
//         .with({ scheme: 'vscode-resource' });

//     return `<!DOCTYPE html>
//   <html lang="en">
//   <head>
//       <meta charset="UTF-8">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <link rel="stylesheet" href="${styleFilePath}">
//   </head>
//   <body>
//   <div>
//   <pre><code>${codeHighlightLinenums(stuff, { hljs, lang: 'json', start: 1 })}</code></pre>
//   </div>
//   </body>
//   </html>`;
// }
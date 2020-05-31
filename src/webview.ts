import * as vscode from 'vscode';


export async function displayWebView(info: object) {

    const panel = vscode.window.createWebviewPanel(
        'teetle',
        'Webview Title',
        vscode.ViewColumn.Beside,
        {}
    );

    // And set its HTML content
    panel.webview.html = getWebviewContent();

    panel.onDidDispose(
        () => {
          // When the panel is closed, cancel any future updates to the webview content
          clearInterval(interval);
        },
        null,
        context.subscriptions
      );
}

function getWebviewContent() {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cat Coding</title>
  </head>
  <body>
      <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
  </body>
  </html>`;
  }
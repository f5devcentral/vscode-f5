import * as vscode from 'vscode';



export function setHostStatusBar(bar: vscode.StatusBarItem, host: string = '', password: string = '', tip: string = '') {

    bar.command = 'f5-fast.disconnect';
    bar.text = host ? host || '' : '';
    bar.password = password ? password || '' : '';
    bar.tooltip = tip ? tip || '' : '';

    if (host && password) {
        bar.show();
    } else {
        bar.hide();
    }

};
import * as vscode from 'vscode';



export function setHostStatusBar(bar: vscode.StatusBarItem, host: string = '', password: string = '') {

    bar.command = 'f5-fast.disconnect';
    bar.text = host ? host || '' : '';
    bar.password = password ? password || '' : '';
    bar.tooltip = 'Disconnect\r\nother information\r\neven more information';

    if (host && password) {
        bar.show();
    } else {
        bar.hide();
    }

};
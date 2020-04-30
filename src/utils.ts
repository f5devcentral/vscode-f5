import * as vscode from 'vscode';



export function setHostStatusBar(host: string, password: string) {

    const hostStatusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    hostStatusBar.command = 'f5-fast.disconnect';
    // runDevices.color = '#42b883';
    hostStatusBar.text = host;
    // forcing the following property...
    hostStatusBar.password = password;
    hostStatusBar.tooltip = 'Disconnect';
    hostStatusBar.show();
    // console.log(`hostStatusBar within setHostStatusBar func: ${JSON.stringify(hostStatusBar)}`);
    // return hostStatusBar;
};
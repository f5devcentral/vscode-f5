import { extensions, window, commands } from "vscode";
import * as fs from 'fs';

import { logger } from './logger';

/**
 * detects old `DumpySquare.vscode-f5-fast` extension and deletes it's folder
 * 	 then asks user to reload workspace
 */
export async function unInstallOldExtension () {
    
	// section to detect and attempt to uninstall old extension
	
	const oldExtName = `DumpySquare.vscode-f5-fast`;
	const newExtName = `F5DevCentral.vscode-f5`;
	const unInstallExtCmd = `code --uninstall-extension ${oldExtName}`;

	// returns extension details if found
	const oldExt = extensions.all.filter( el => el.id === oldExtName )[0];
	const newExt = extensions.all.filter( el => el.id === newExtName )[0];
	const extss = extensions.all.map( el => el.id );

	// extensions.getExtension()
	// code --uninstall-extension

	if (oldExt && newExt) {

		console.log('both extensions detected:', oldExt.extensionPath, newExt.extensionPath);
		logger.error('both extensions detected:', oldExt.extensionPath, newExt.extensionPath);

		// await window.showWarningMessage('Please uninstall the old vscode-f5-fast extension!', {modal: true});

		const msg = 'Detected both old (vscode-f5-fast) and new F5 (vscode-f5) extensions.  They have conflicting commands.  Attempt to uninstall the old extension?';
		const answer = await window.showInformationMessage(msg, 'Continue');

		if (answer) {

			fs.rmdirSync(oldExt.extensionPath, { recursive: true });

		// 	window.withProgress({
		// 		location: ProgressLocation.Notification,
		// 		title: `Attempting to uninstall old extension "vscode-f5-fast"`,
		// 		cancellable: true
		// 	}, async () => {
			
		// 		// console.log(JSON.stringify(q, undefined, 4));
		// 		console.log('uninstall command', unInstallExtCmd);
		
		// 		// try to uninstall via node exec
		// 		const resp4 = cp.execSync(unInstallExtCmd).toString();
		// 		console.log('uninstall via node-exec', resp4);
		
		// 		// issuing exec command doesn't seem to have the access needed
		// 		//	trying integrated terminal next

		// 		// const terms = window.terminals;
		// 		const newTerm = window.createTerminal('f5-cmd');
		// 		console.log('newTerm:', newTerm);
		// 		newTerm.show();
		// 		newTerm.sendText(unInstallExtCmd);

		// 		// may need to just try to delete the old folder, then reload...
		
				const reld = await window.showInformationMessage('It should be uninstalled (deleted) now, reload?', 'ok');
				if (reld) {
					commands.executeCommand('workbench.action.reloadWindow');
				}

		// 	});
		}



		// console.log(resp4);
	}

}
'use-strict';

import * as path from 'path';
import * as cp from 'child_process';

import { commands, ExtensionContext, window } from 'vscode';
import logger from './utils/logger';
import { getRPMgit, listGitReleases } from './utils/rpmMgmt';

/**
 * Provides command to download github releases of this extension so users can easily access beta versions for testing
 */
export class ChangeVersion {
    /**
     * base repo releases
     */
    readonly repo = 'https://api.github.com/repos/f5devcentral/vscode-f5/releases';

	constructor(context: ExtensionContext) {

		context.subscriptions.push(commands.registerCommand('f5.changeVersion', async () => {

			//  1. list releases on github repo
			//  2. provide list/selector for version
			//  3. download version
			//  4. install version, reload window?

			// get current extension home folder
			// const hostDir = path.resolve(context.extensionPath, '..');
			const hostDir = context.extensionPath;

			logger.info('f5.changeVersion, fetching github releases');

			// list available git releases and have the user select one
			const chosenVersion: string | { label: string, asset: string } | undefined = await listGitReleases(this.repo)
			.then( async versions => {
				logger.debug('f5.changeVersion, available version', versions);
				return await window.showQuickPick(versions, { placeHolder: 'Select Version' });
			});

			logger.info('f5.changeVersion, downloading chosen version', chosenVersion);

			// if we have a selection from the previous list
			if( chosenVersion && typeof chosenVersion === 'object' && chosenVersion.asset ) {
				await getRPMgit(chosenVersion.asset, hostDir)
				.then( resp => {

					// this command really doesn't work.  
					// https://github.com/microsoft/vscode-remote-release/issues/385
					// https://github.com/microsoft/vscode-remote-release/issues/2749
					// furthermore, code-server command for web based code would require detecting the environemnt and changing the command accordingly
					logger.info('f5.changeVersion, this probably will not work, but at least the new extenion version will be downloaded and easily installable via the UI');

					const cmd2Install = `code --install-extension ${resp}`;
					logger.info('f5.changeVersion, installing: ', cmd2Install);

					try {
						// try to issue the install command via node sub-process
						const installResp = cp.execSync(cmd2Install).toString();
						logger.info('f5.changeVersion, install response', installResp);

						// TODO: this need some work. over remote-ssh file does not download and it doesn't fail appropriately
					} catch (e) {
						
						logger.info('f5.changeVersion, failed install', e);
					}
				})
				.catch( err => {
					logger.error('f5.changeVersion, failed download', err);
				});
			} else {
				logger.info('f5.changeVersion, valid selection details not detected, user probably exited quick pick dropdown');
			}
			
		}));
	}
}
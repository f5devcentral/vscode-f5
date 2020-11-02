
import { WebviewPanel, window, commands, ViewColumn, EventEmitter, Event, Uri } from 'vscode';

import { ext } from '../extensionVariables';
import logger from '../utils/logger';

const fast = require('@f5devcentral/f5-fast-core');

type HttpResponse = '';

export class FastWebView {

    protected _onDidCloseAllWebviewPanels = new EventEmitter<void>();
    protected readonly panels: WebviewPanel[] = [];
    private showResponseInDifferentTab = false;
    protected activePanel: WebviewPanel | undefined;
    protected fastTemplateYml: string | undefined;
    protected fastEngine: any | undefined;

    private readonly panelResponses: Map<WebviewPanel, HttpResponse>;

    public constructor() {
        this.panelResponses = new Map<WebviewPanel, HttpResponse>();
    }

    public get onDidCloseAllWebviewPanels(): Event<void> {

        return this._onDidCloseAllWebviewPanels.event;
    }

    protected get previewActiveContextKey(): string {
        return 'httpResponsePreviewFocus';
    }

    protected setPreviewActiveContext(value: boolean) {
        commands.executeCommand('setContext', this.previewActiveContextKey, value);
    }

    protected displayRenderedTemplate (tempParams: string) {
        /**
         * take params from panel submit button
         * process through fast with template
         * then display in new editor to the right...
         */

        // const final = this.fastEngine.template.render(tempParams);

        // ext.panel.render('text');
    }

    protected async renderHTML(fastYml: string) {

        /**
         * add checking for YAML format since we only want to support yaml
         * 
         */
        try {
            this.fastEngine = await fast.Template.loadYaml(fastYml);
        } catch (e) {
            logger.error(e);
            window.showErrorMessage(e.message);
        }
        const schema = this.fastEngine.getParametersSchema();
        const defaultParams = this.fastEngine.getCombinedParameters();
        const htmlData = fast.guiUtils.generateHtmlPreview(schema, defaultParams);
        return htmlData;
    }

    public async render(fastYml: string) {

        // put the incoming fast template somewhere
        this.fastTemplateYml = fastYml;
        // create 
        let html = await this.renderHTML(fastYml);

        let title = 'test-title';

        const newEditorColumn = ext.settings.previewColumn; 
        const preserveEditorFocus = ext.settings.preserveEditorFocus;
        const newEditorTabForAll = ext.settings.newEditorTabForAll;
        let viewColumn: ViewColumn | undefined;

        viewColumn = viewColumn ? viewColumn : newEditorColumn;

        let panel: WebviewPanel;
        if (this.showResponseInDifferentTab || this.panels.length === 0) {
            panel = window.createWebviewPanel(
                'fast webView',
                title,
                { viewColumn: viewColumn, preserveFocus: !preserveEditorFocus },
                {
                    enableFindWidget: true,
                    enableScripts: true,
                    retainContextWhenHidden: true
                });

            panel.onDidDispose(() => {
                if (panel === this.activePanel) {
                    this.setPreviewActiveContext(false);
                    this.activePanel = undefined;
                }

                const index = this.panels.findIndex(v => v === panel);
                if (index !== -1) {
                    this.panels.splice(index, 1);
                    this.panelResponses.delete(panel);
                }
                if (this.panels.length === 0) {
                    this._onDidCloseAllWebviewPanels.fire();
                }
            });

            panel.onDidChangeViewState(({ webviewPanel }) => {
                const active = this.panels.some(p => p.active);
                this.setPreviewActiveContext(active);
                this.activePanel = webviewPanel.active ? webviewPanel : undefined;
            });

            panel.webview.onDidReceiveMessage( async message => {
                // console.log( message );

                try {
                    const final = await this.fastEngine.render(message);
                    ext.panel.render(final);
                } catch (e) {
                    logger.error(e);
                    // window.showErrorMessage(e.message);
                }
    
            });
            
            this.panels.push(panel);
        } else {
            panel = this.panels[this.panels.length - 1];
            panel.title = title;
        }


        /**
         * Appends the necessary stuff for submit button and getting template params
         * move the following to it's own function
         */
        const htmlSubmitBtn = `
<script>
(function init() {
    const vscode = acquireVsCodeApi();
    document.vscode = vscode;
})();
</script>
<button onclick="vscode.postMessage(editor.getValue())">Render</button>
<p></p>
        `;

        html += htmlSubmitBtn;

        panel.webview.html = html;
        panel.reveal(viewColumn, !preserveEditorFocus);
        this.activePanel = panel;
    }

}
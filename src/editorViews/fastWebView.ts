
import { WebviewPanel, window, commands, ViewColumn, EventEmitter, Event } from 'vscode';


import { ext } from '../extensionVariables';

type HttpResponse = '';

export class FastWebView {

    protected _onDidCloseAllWebviewPanels = new EventEmitter<void>();
    protected readonly panels: WebviewPanel[] = [];
    private showResponseInDifferentTab = false;
    protected activePanel: WebviewPanel | undefined;

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

    public async render(html: string, title: string) {

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

            this.panels.push(panel);
        } else {
            panel = this.panels[this.panels.length - 1];
            panel.title = title;
        }

        panel.webview.html = html;
        panel.reveal(viewColumn, !preserveEditorFocus);
        this.activePanel = panel;
    }

}
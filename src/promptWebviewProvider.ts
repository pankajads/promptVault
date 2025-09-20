import * as vscode from 'vscode';
import { PromptManager } from './promptManager';

export class PromptWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'promptvault.webview';

    constructor(
        private readonly extensionUri: vscode.Uri,
        private promptManager: PromptManager
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void | Thenable<void> {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };

        webviewView.webview.html = this.getWebviewContent(webviewView.webview);

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'getPrompts':
                    const prompts = await this.promptManager.getAllPrompts();
                    webviewView.webview.postMessage({
                        type: 'promptsData',
                        data: prompts
                    });
                    break;
                case 'openPrompt':
                    vscode.commands.executeCommand('promptvault.openPrompt', message.promptId);
                    break;
                case 'deletePrompt':
                    vscode.commands.executeCommand('promptvault.deletePrompt', message.promptId);
                    break;
                case 'copyPrompt':
                    vscode.commands.executeCommand('promptvault.copyPrompt', message.promptId);
                    break;
            }
        });
    }

    public getWebviewContent(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PromptVault</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 16px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .title {
            font-size: 18px;
            font-weight: bold;
        }
        
        .search-box {
            width: 100%;
            padding: 8px;
            margin-bottom: 16px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
        }
        
        .search-box:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        .prompt-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .prompt-item {
            background-color: var(--vscode-list-hoverBackground);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
            padding: 12px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .prompt-item:hover {
            background-color: var(--vscode-list-activeSelectionBackground);
        }
        
        .prompt-title {
            font-weight: bold;
            margin-bottom: 4px;
            font-size: 14px;
        }
        
        .prompt-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-bottom: 8px;
        }
        
        .tag {
            background-color: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
        }
        
        .prompt-preview {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            line-height: 1.4;
            max-height: 3em;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .prompt-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 8px;
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }
        
        .prompt-actions {
            display: flex;
            gap: 8px;
        }
        
        .action-button {
            background: none;
            border: none;
            color: var(--vscode-textLink-foreground);
            cursor: pointer;
            padding: 2px 4px;
            border-radius: 2px;
        }
        
        .action-button:hover {
            background-color: var(--vscode-toolbar-hoverBackground);
        }
        
        .empty-state {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            padding: 32px 16px;
        }
        
        .loading {
            text-align: center;
            padding: 16px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">PromptVault</div>
    </div>
    
    <input type="text" 
           class="search-box" 
           id="searchBox" 
           placeholder="Search prompts..."
           autocomplete="off">
    
    <div class="prompt-list" id="promptList">
        <div class="loading">Loading prompts...</div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        let allPrompts = [];
        
        // Request initial data
        vscode.postMessage({ type: 'getPrompts' });
        
        // Listen for messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'promptsData':
                    allPrompts = message.data;
                    renderPrompts(allPrompts);
                    break;
            }
        });
        
        // Search functionality
        document.getElementById('searchBox').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredPrompts = allPrompts.filter(prompt => 
                prompt.title.toLowerCase().includes(searchTerm) ||
                prompt.content.toLowerCase().includes(searchTerm) ||
                prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
            renderPrompts(filteredPrompts);
        });
        
        function renderPrompts(prompts) {
            const promptList = document.getElementById('promptList');
            
            if (prompts.length === 0) {
                promptList.innerHTML = '<div class="empty-state">No prompts found</div>';
                return;
            }
            
            const promptsHtml = prompts.map(prompt => {
                const tagsHtml = prompt.tags.map(tag => '<span class="tag">' + escapeHtml(tag) + '</span>').join('');
                const preview = prompt.content.substring(0, 150) + (prompt.content.length > 150 ? '...' : '');
                const date = new Date(prompt.updatedAt).toLocaleDateString();
                
                return '<div class="prompt-item" onclick="openPrompt(' + "'" + prompt.id + "'" + ')">' +
                    '<div class="prompt-title">' + escapeHtml(prompt.title) + '</div>' +
                    '<div class="prompt-tags">' + tagsHtml + '</div>' +
                    '<div class="prompt-preview">' + escapeHtml(preview) + '</div>' +
                    '<div class="prompt-meta">' +
                        '<span>' + date + '</span>' +
                        '<div class="prompt-actions">' +
                            '<button class="action-button" onclick="event.stopPropagation(); copyPrompt(' + "'" + prompt.id + "'" + ')">Copy</button>' +
                            '<button class="action-button" onclick="event.stopPropagation(); deletePrompt(' + "'" + prompt.id + "'" + ')">Delete</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
            
            promptList.innerHTML = promptsHtml;
        }
        
        function openPrompt(promptId) {
            vscode.postMessage({
                type: 'openPrompt',
                promptId: promptId
            });
        }
        
        function copyPrompt(promptId) {
            vscode.postMessage({
                type: 'copyPrompt',
                promptId: promptId
            });
        }
        
        function deletePrompt(promptId) {
            if (confirm('Are you sure you want to delete this prompt?')) {
                vscode.postMessage({
                    type: 'deletePrompt',
                    promptId: promptId
                });
            }
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>`;
    }
}

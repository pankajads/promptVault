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

    public getAddFormContent(webview: vscode.Webview, editData?: any): string {
        const isEditing = !!editData;
        const title = editData?.title || '';
        const content = editData?.content || '';
        const tags = editData?.tags ? editData.tags.join(', ') : '';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${isEditing ? 'Edit' : 'Add'} Prompt</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 20px;
            line-height: 1.5;
        }
        
        .form-container {
            max-width: 600px;
            margin: 0 auto;
        }
        
        .form-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            color: var(--vscode-foreground);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--vscode-foreground);
        }
        
        input[type="text"] {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
            font-size: 14px;
            font-family: var(--vscode-font-family);
            box-sizing: border-box;
        }
        
        input[type="text"]:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
        
        .content-input {
            min-height: 150px;
            padding: 12px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
            font-size: 14px;
            font-family: var(--vscode-editor-font-family);
            line-height: 1.5;
            overflow-y: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
            outline: none;
            width: 100%;
            box-sizing: border-box;
        }
        
        .content-input:focus {
            border-color: var(--vscode-focusBorder);
        }
        
        .content-input:empty:before {
            content: "Enter your prompt content here...\\APress Enter normally for new lines, click Save button when done";
            color: var(--vscode-input-placeholderForeground);
            white-space: pre;
        }
        
        .form-actions {
            display: flex;
            gap: 12px;
            margin-top: 24px;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
        }
        
        .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .btn-primary:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .btn-ai {
            background-color: var(--vscode-debugIcon-breakpointForeground);
            color: var(--vscode-button-foreground);
            position: relative;
        }
        
        .btn-ai:hover {
            opacity: 0.8;
        }
        
        .btn-ai:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .ai-loading {
            display: none;
            margin-left: 8px;
            font-size: 12px;
        }
        
        .ai-loading.show {
            display: inline;
        }
        
        .btn-secondary:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .help-text {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }
    </style>
</head>
<body>
    <div class="form-container">
        <h1 class="form-title">${isEditing ? 'Edit' : 'Add New'} Prompt</h1>
        
        <form id="promptForm">
            <div class="form-group">
                <label for="title">Title</label>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="text" id="title" name="title" value="${title}" required style="flex: 1;">
                    <button type="button" id="aiSuggestBtn" class="btn btn-ai" onclick="getAISuggestions()">
                        ✨ AI Suggest
                        <span id="aiLoading" class="ai-loading">...</span>
                    </button>
                </div>
            </div>
            
            <div class="form-group">
                <label for="tags">Tags</label>
                <input type="text" id="tags" name="tags" value="${tags}" placeholder="e.g., development, react, debugging">
                <div class="help-text">Separate multiple tags with commas</div>
            </div>
            
            <div class="form-group">
                <label for="content">Content</label>
                <div id="content" class="content-input" contenteditable="true">${content}</div>
                <div class="help-text">Type normally, press Enter for new lines. Click Save button when finished.</div>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="btn btn-primary">${isEditing ? 'Update' : 'Save'} Prompt</button>
                <button type="button" class="btn btn-secondary" onclick="cancelForm()">Cancel</button>
            </div>
        </form>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        // Initialize form
        document.addEventListener('DOMContentLoaded', function() {
            const contentDiv = document.getElementById('content');
            const titleInput = document.getElementById('title');
            
            // Focus on title if empty, otherwise focus on content
            if (!titleInput.value.trim()) {
                titleInput.focus();
            } else {
                contentDiv.focus();
                // Place cursor at end
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(contentDiv);
                range.collapse(false);
                sel.removeAllRanges();
                sel.addRange(range);
            }
        });
        
        // Form submission
        document.getElementById('promptForm').addEventListener('submit', function(e) {
            e.preventDefault();
            savePrompt();
        });
        
        function savePrompt() {
            const title = document.getElementById('title').value.trim();
            const content = document.getElementById('content').textContent.trim();
            const tagsInput = document.getElementById('tags').value.trim();
            
            if (!title) {
                alert('Please enter a title');
                return;
            }
            
            if (!content) {
                alert('Please enter content');
                return;
            }
            
            const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
            
            vscode.postMessage({
                type: '${isEditing ? 'updatePrompt' : 'savePrompt'}',
                title: title,
                content: content,
                tags: tags${isEditing ? `,
                id: '${editData?.id || ''}'` : ''}
            });
        }
        
        function cancelForm() {
            vscode.postMessage({
                type: 'cancel'
            });
        }
        
        function getAISuggestions() {
            const content = document.getElementById('content').textContent.trim();
            
            if (!content) {
                alert('Please enter some content first');
                return;
            }
            
            const btn = document.getElementById('aiSuggestBtn');
            const loading = document.getElementById('aiLoading');
            
            // Show loading state
            btn.disabled = true;
            loading.classList.add('show');
            
            vscode.postMessage({
                type: 'getAISuggestions',
                content: content,
                language: 'general'
            });
        }
        
        // Listen for AI suggestions response
        window.addEventListener('message', event => {
            const message = event.data;
            
            if (message.type === 'aiSuggestions') {
                const btn = document.getElementById('aiSuggestBtn');
                const loading = document.getElementById('aiLoading');
                
                // Hide loading state
                btn.disabled = false;
                loading.classList.remove('show');
                
                if (message.suggestions) {
                    const titleInput = document.getElementById('title');
                    const tagsInput = document.getElementById('tags');
                    
                    // Only update if fields are empty or user confirms
                    if (!titleInput.value || confirm('Replace current title with AI suggestion?')) {
                        titleInput.value = message.suggestions.title;
                    }
                    
                    if (!tagsInput.value || confirm('Replace current tags with AI suggestions?')) {
                        tagsInput.value = message.suggestions.tags.join(', ');
                    }
                } else {
                    alert('AI suggestions are not available.\\n\\nTo enable AI suggestions:\\n1. Open VS Code Settings\\n2. Search for "PromptVault"\\n3. Enable "Enable AI"\\n4. Choose your AI provider\\n5. Add your API key');
                }
            }
        });
    </script>
</body>
</html>`;
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

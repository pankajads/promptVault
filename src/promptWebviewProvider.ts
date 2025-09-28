import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { PromptManager } from './promptManager';

export class PromptWebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'promptvault.webview';

    constructor(
        private readonly extensionUri: vscode.Uri,
        private promptManager: PromptManager
    ) {}

    private readTemplateFile(templatePath: string): string {
        try {
            const fullPath = path.join(this.extensionUri.fsPath, 'webview', templatePath);
            console.log(`Reading template from: ${fullPath}`);
            const content = fs.readFileSync(fullPath, 'utf8');
            console.log(`Template content length: ${content.length}`);
            return content;
        } catch (error) {
            console.error(`Failed to read template file ${templatePath}:`, error);
            console.error(`Full path attempted: ${path.join(this.extensionUri.fsPath, 'webview', templatePath)}`);
            // Return a basic fallback HTML if template reading fails
            return this.getFallbackHtml(templatePath);
        }
    }

    private getFallbackHtml(templatePath: string): string {
        if (templatePath.includes('add-form')) {
            return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Prompt</title>
    <style>
        body { font-family: var(--vscode-font-family); padding: 20px; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
        .error { color: red; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="error">Template loading failed. Using fallback form.</div>
    <h1>Add New Prompt</h1>
    <form id="promptForm">
        <div><label>Title:</label><input type="text" id="title" required></div><br>
        <div><label>Tags:</label><input type="text" id="tags" placeholder="comma-separated"></div><br>
        <div><label>Content:</label><textarea id="content" rows="10" cols="50"></textarea></div><br>
        <button type="submit">Save</button>
        <button type="button" onclick="cancel()">Cancel</button>
    </form>
    <script>
        const vscode = acquireVsCodeApi();
        window.formConfig = { isEditing: false, editData: null };
        document.getElementById('promptForm').addEventListener('submit', function(e) {
            e.preventDefault();
            vscode.postMessage({
                type: 'savePrompt',
                title: document.getElementById('title').value,
                content: document.getElementById('content').value,
                tags: document.getElementById('tags').value.split(',').map(t => t.trim()).filter(t => t)
            });
        });
        function cancel() { vscode.postMessage({ type: 'cancel' }); }
    </script>
</body>
</html>`;
        }
        return '<html><body><h1>Template not found</h1></body></html>';
    }

    private getResourceUri(webview: vscode.Webview, resourcePath: string): vscode.Uri {
        const resourceUri = vscode.Uri.joinPath(this.extensionUri, 'webview', resourcePath);
        return webview.asWebviewUri(resourceUri);
    }

    private escapeHtml(text: string): string {
        return text.replace(/[&<>"']/g, (match) => {
            const escapeMap: { [key: string]: string } = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return escapeMap[match] || match;
        });
    }

    private escapeHtmlAttribute(text: string): string {
        return text.replace(/[&<>"']/g, (match) => {
            const escapeMap: { [key: string]: string } = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return escapeMap[match] || match;
        });
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void | Thenable<void> {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this.extensionUri,
                vscode.Uri.joinPath(this.extensionUri, 'webview')
            ]
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
        console.log('getAddFormContent called with editData:', editData);
        const isEditing = !!editData;
        const title = editData?.title || '';
        const content = editData?.content || '';
        const tags = editData?.tags ? editData.tags.join(', ') : '';

        // TEMPORARY: Use inline HTML to test if issue is with file loading
        return this.getInlineAddFormHtml(isEditing, title, content, tags, editData);

        /*
        // Original template-based approach - disabled for debugging
        const template = this.readTemplateFile('html/add-form.html');
        console.log('Template loaded, length:', template.length);
        
        const cssUri = this.getResourceUri(webview, 'css/add-form.css');
        const jsUri = this.getResourceUri(webview, 'js/add-form.js');
        console.log('CSS URI:', cssUri.toString());
        console.log('JS URI:', jsUri.toString());
        */
    }

    private getInlineAddFormHtml(isEditing: boolean, title: string, content: string, tags: string, editData: any): string {
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
                <input type="text" id="title" name="title" value="${this.escapeHtmlAttribute(title)}" required>
            </div>
            
            <div class="form-group">
                <label for="tags">Tags</label>
                <input type="text" id="tags" name="tags" value="${this.escapeHtmlAttribute(tags)}" placeholder="e.g., development, react, debugging">
                <div class="help-text">Separate multiple tags with commas</div>
            </div>
            
            <div class="form-group">
                <label for="content">Content</label>
                <div id="content" class="content-input" contenteditable="true">${this.escapeHtml(content)}</div>
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
        
        // Form configuration
        window.formConfig = {
            isEditing: ${JSON.stringify(isEditing)},
            editData: ${JSON.stringify(editData || null)}
        };
        
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
            
            const messageData = {
                type: window.formConfig.isEditing ? 'updatePrompt' : 'savePrompt',
                title: title,
                content: content,
                tags: tags
            };
            
            if (window.formConfig.isEditing && window.formConfig.editData?.id) {
                messageData.id = window.formConfig.editData.id;
            }
            
            vscode.postMessage(messageData);
        }
        
        function cancelForm() {
            vscode.postMessage({
                type: 'cancel'
            });
        }
    </script>
</body>
</html>`;
    }

    /*
    // Original template-based approach - disabled for debugging
    private getOriginalAddFormContent(webview: vscode.Webview, editData?: any): string {
        const isEditing = !!editData;
        const title = editData?.title || '';
        const content = editData?.content || '';
        const tags = editData?.tags ? editData.tags.join(', ') : '';

        const template = this.readTemplateFile('html/add-form.html');
        const cssUri = this.getResourceUri(webview, 'css/add-form.css');
        const jsUri = this.getResourceUri(webview, 'js/add-form.js');
        
        // Create configuration script
        const configScript = \`
            <script>
                window.formConfig = {
                    isEditing: \${JSON.stringify(isEditing)},
                    editData: \${JSON.stringify(editData || null)}
                };
            </script>\`;
        
        return template
            .replace('{{TITLE}}', this.escapeHtml(isEditing ? 'Edit' : 'Add'))
            .replace('{{FORM_TITLE}}', this.escapeHtml(isEditing ? 'Edit' : 'Add New'))
            .replace('{{TITLE_VALUE}}', this.escapeHtmlAttribute(title))
            .replace('{{TAGS_VALUE}}', this.escapeHtmlAttribute(tags))
            .replace('{{CONTENT_VALUE}}', this.escapeHtml(content))
            .replace('{{SUBMIT_BUTTON}}', this.escapeHtml(isEditing ? 'Update' : 'Save'))
            .replace('{{CSS_PATH}}', cssUri.toString())
            .replace('{{JS_PATH}}', jsUri.toString())
            .replace('</head>', \`\${configScript}\n    </head>\`);
    }
    */

    public getWebviewContent(webview: vscode.Webview): string {
        const template = this.readTemplateFile('html/main.html');
        const cssUri = this.getResourceUri(webview, 'css/main.css');
        const jsUri = this.getResourceUri(webview, 'js/main.js');
        
        return template
            .replace('{{CSS_PATH}}', cssUri.toString())
            .replace('{{JS_PATH}}', jsUri.toString());
    }
}

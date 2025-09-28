import * as vscode from 'vscode';
import { PromptManager } from './promptManager';
import { PromptTreeProvider, PromptTreeItem } from './promptTreeProvider';
import { PromptWebviewProvider } from './promptWebviewProvider';
import { AIService } from './aiService';

let promptManager: PromptManager;
let promptTreeProvider: PromptTreeProvider;
let promptWebviewProvider: PromptWebviewProvider;
let aiService: AIService;
let extensionContext: vscode.ExtensionContext;
let treeView: vscode.TreeView<PromptTreeItem>;

export function activate(context: vscode.ExtensionContext) {
    try {
        console.log('PromptVault extension activation started...');
        
        // Store extension context globally
        extensionContext = context;
        
        // Initialize services
        console.log('Initializing PromptManager...');
        promptManager = new PromptManager(context);
        console.log('PromptManager initialized successfully');

        console.log('Initializing AIService...');
        aiService = new AIService();
        console.log('AIService initialized successfully');

        console.log('Initializing PromptTreeProvider...');
        if (promptTreeProvider) {
            console.log('⚠️ Disposing existing PromptTreeProvider instance before creating new one');
            promptTreeProvider.dispose();
        }
        promptTreeProvider = new PromptTreeProvider(promptManager);
        console.log('PromptTreeProvider initialized successfully');

        console.log('Initializing PromptWebviewProvider...');
        promptWebviewProvider = new PromptWebviewProvider(context.extensionUri, promptManager);
        console.log('PromptWebviewProvider initialized successfully');

        // Register tree view
        console.log('Creating tree view...');
        treeView = vscode.window.createTreeView('promptvault.treeView', {
            treeDataProvider: promptTreeProvider,
            showCollapseAll: true,
            canSelectMany: false
        });
        console.log('Tree view created successfully');

        // Set context to show tree view
        console.log('Setting context...');
        vscode.commands.executeCommand('setContext', 'promptvault.enabled', true);
        console.log('Context set successfully');

        // Register commands
        console.log('Registering commands...');
        const commands = [
            vscode.commands.registerCommand('promptvault.savePrompt', () => {
                console.log('savePrompt command called');
                return saveSelectedPrompt();
            }),
            vscode.commands.registerCommand('promptvault.openPanel', () => {
                console.log('openPanel command called');
                return openPromptPanel();
            }),
            vscode.commands.registerCommand('promptvault.refreshTree', () => {
                console.log('refreshTree command called');
                return promptTreeProvider.refresh();
            }),
            vscode.commands.registerCommand('promptvault.addPrompt', () => {
                console.log('addPrompt command called');
                return addNewPrompt();
            }),
            vscode.commands.registerCommand('promptvault.editPrompt', (treeItem: any) => {
                console.log('editPrompt command called with:', treeItem);
                return editPrompt(treeItem.promptId || treeItem);
            }),
            vscode.commands.registerCommand('promptvault.deletePrompt', (treeItem: any) => {
                console.log('deletePrompt command called with:', treeItem);
                return deletePrompt(treeItem.promptId || treeItem);
            }),
            vscode.commands.registerCommand('promptvault.copyPrompt', (treeItem: any) => {
                console.log('copyPrompt command called with:', treeItem);
                return copyPrompt(treeItem.promptId || treeItem);
            }),
            vscode.commands.registerCommand('promptvault.exportPrompts', () => {
                console.log('exportPrompts command called');
                return exportPrompts();
            }),
            vscode.commands.registerCommand('promptvault.importPrompts', () => {
                console.log('importPrompts command called');
                return importPrompts();
            }),
            vscode.commands.registerCommand('promptvault.searchPrompts', () => {
                console.log('searchPrompts command called');
                return searchPrompts();
            }),
            vscode.commands.registerCommand('promptvault.openPrompt', (promptId: string) => {
                console.log('openPrompt command called with promptId:', promptId);
                return openPrompt(promptId);
            })
        ];
        console.log(`Successfully registered ${commands.length} commands`);

        // Register webview provider
        console.log('Registering webview provider...');
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('promptvault.webview', promptWebviewProvider)
        );
        console.log('Webview provider registered successfully');

        // Add all disposables to context
        console.log('Adding disposables to context...');
        context.subscriptions.push(
            treeView,
            ...commands
        );
        console.log('Disposables added successfully');

        // Listen for tree view selection changes
        console.log('Setting up tree view selection listener...');
        treeView.onDidChangeSelection(e => {
            if (e.selection.length > 0 && e.selection[0].contextValue === 'prompt') {
                const treeItem = e.selection[0] as any; // Cast to access promptId
                const promptId = treeItem.promptId;
                if (promptId) {
                    openPrompt(promptId);
                }
            }
        });
        console.log('Tree view selection listener set up successfully');

        console.log('PromptVault extension activated successfully!');
        vscode.window.showInformationMessage('PromptVault extension is now active!');
    } catch (error) {
        console.error('Failed to activate PromptVault extension:', error);
        vscode.window.showErrorMessage(`Failed to activate PromptVault: ${error}`);
        throw error; // Re-throw to make VS Code aware of the failure
    }
}

async function saveSelectedPrompt() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
        vscode.window.showErrorMessage('Please select text to save as prompt');
        return;
    }

    const selectedText = editor.document.getText(selection);
    const language = editor.document.languageId;
    const filePath = editor.document.fileName;

    try {
        // Get AI suggestions if enabled
        let aiSuggestions = null;
        const config = vscode.workspace.getConfiguration('promptvault');
        const enableAI = config.get<boolean>('enableAI', false);
        
        if (enableAI) {
            const apiKey = config.get<string>('openaiApiKey', '');
            if (apiKey) {
                const aiConfig = {
                    provider: 'openai' as const,
                    apiKey: apiKey
                };
                aiSuggestions = await aiService.generateSuggestions(selectedText, language, aiConfig);
            }
        }

        // Show input dialog
        const result = await showPromptInputDialog(selectedText, aiSuggestions);
        if (!result) {
            return;
        }

        // Save prompt
        const prompt = await promptManager.savePrompt({
            title: result.title,
            content: selectedText,
            tags: result.tags,
            language: language,
            source: getSourceContext(),
            context: filePath
        });

        vscode.window.showInformationMessage(`Prompt "${prompt.title}" saved successfully!`);
        promptTreeProvider.refresh();

    } catch (error) {
        vscode.window.showErrorMessage(`Failed to save prompt: ${error}`);
    }
}

async function showPromptInputDialog(content: string, aiSuggestions: any = null): Promise<{title: string, tags: string[]} | undefined> {
    const suggestedTitle = aiSuggestions?.title || 'New Prompt';
    const suggestedTags = aiSuggestions?.tags || ['general'];

    // Get title
    const title = await vscode.window.showInputBox({
        prompt: 'Enter prompt title',
        value: suggestedTitle,
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Title cannot be empty';
            }
            return null;
        }
    });

    if (!title) {
        return undefined;
    }

    // Get tags
    const tagsInput = await vscode.window.showInputBox({
        prompt: 'Enter tags (comma-separated)',
        value: suggestedTags.join(', '),
        placeHolder: 'e.g., ai, coding, documentation'
    });

    const tags = tagsInput ? 
        tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : 
        ['general'];

    return { title: title.trim(), tags };
}

function getSourceContext(): string {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return 'unknown';
    }

    const document = activeEditor.document;
    const uri = document.uri;
    
    // Try to detect if it's from Copilot or Amazon Q based on file path or content
    if (uri.scheme === 'copilot' || document.fileName.includes('copilot')) {
        return 'copilot';
    } else if (uri.scheme === 'amazonq' || document.fileName.includes('amazonq')) {
        return 'amazonq';
    } else {
        return 'editor';
    }
}

async function openPromptPanel() {
    const panel = vscode.window.createWebviewPanel(
        'promptvault.panel',
        'PromptVault',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true
        }
    );

    panel.webview.html = await promptWebviewProvider.getWebviewContent(panel.webview);
}

async function addNewPrompt() {
    const panel = vscode.window.createWebviewPanel(
        'promptvault.addForm',
        'Add New Prompt',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(extensionContext.extensionUri, 'webview')
            ]
        }
    );

    // Use the HTML form instead of simple input boxes
    panel.webview.html = promptWebviewProvider.getAddFormContent(panel.webview);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(async (message) => {
        switch (message.type) {
            case 'savePrompt':
                try {
                    const prompt = await promptManager.savePrompt({
                        title: message.title,
                        content: message.content,
                        tags: message.tags,
                        language: 'text',
                        source: 'manual',
                        context: ''
                    });

                    vscode.window.showInformationMessage(`Prompt "${prompt.title}" created successfully!`);
                    
                    // Try to refresh tree, reset if duplicate ID error occurs
                    try {
                        promptTreeProvider.refresh();
                    } catch (error) {
                        console.error('Tree refresh failed, attempting reset:', error);
                        if (error.toString().includes('already registered')) {
                            await resetTreeView();
                        } else {
                            throw error;
                        }
                    }
                    
                    panel.dispose(); // Close the form
                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to create prompt: ${error}`);
                }
                break;
            case 'getAISuggestions':
                try {
                    const config = vscode.workspace.getConfiguration('promptvault');
                    const enableAI = config.get<boolean>('enableAI', false);
                    let suggestions = null;
                    
                    if (enableAI) {
                        const apiKey = config.get<string>('openaiApiKey', '');
                        if (apiKey) {
                            const aiConfig = {
                                provider: 'openai' as const,
                                apiKey: apiKey
                            };
                            suggestions = await aiService.generateSuggestions(message.content, message.language || 'general', aiConfig);
                        }
                    }
                    
                    panel.webview.postMessage({
                        type: 'aiSuggestions',
                        suggestions: suggestions
                    });
                } catch (error) {
                    console.error('AI suggestions failed:', error);
                    panel.webview.postMessage({
                        type: 'aiSuggestions',
                        suggestions: null
                    });
                }
                break;
            case 'cancel':
                panel.dispose();
                break;
        }
    });
}

async function editPrompt(promptId: string) {
    try {
        const prompt = await promptManager.getPrompt(promptId);
        if (!prompt) {
            vscode.window.showErrorMessage('Prompt not found');
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'promptvault.editForm',
            `Edit Prompt: ${prompt.title}`,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionContext.extensionUri, 'webview')
                ]
            }
        );

        // Use the HTML form with existing prompt data
        panel.webview.html = promptWebviewProvider.getAddFormContent(panel.webview, prompt);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'updatePrompt':
                    try {
                        await promptManager.updatePrompt(promptId, {
                            title: message.title,
                            content: message.content,
                            tags: message.tags
                        });

                        vscode.window.showInformationMessage(`Prompt "${message.title}" updated successfully!`);
                        
                        // Try to refresh tree, reset if duplicate ID error occurs
                        try {
                            promptTreeProvider.refresh();
                        } catch (error) {
                            console.error('Tree refresh failed, attempting reset:', error);
                            if (error.toString().includes('already registered')) {
                                await resetTreeView();
                            } else {
                                throw error;
                            }
                        }
                        
                        panel.dispose(); // Close the form
                    } catch (error) {
                        vscode.window.showErrorMessage(`Failed to update prompt: ${error}`);
                    }
                    break;
                case 'getAISuggestions':
                    try {
                        const config = vscode.workspace.getConfiguration('promptvault');
                        const enableAI = config.get<boolean>('enableAI', false);
                        let suggestions = null;
                        
                        if (enableAI) {
                            const apiKey = config.get<string>('openaiApiKey', '');
                            if (apiKey) {
                                const aiConfig = {
                                    provider: 'openai' as const,
                                    apiKey: apiKey
                                };
                                suggestions = await aiService.generateSuggestions(message.content, message.language || 'general', aiConfig);
                            }
                        }
                        
                        panel.webview.postMessage({
                            type: 'aiSuggestions',
                            suggestions: suggestions
                        });
                    } catch (error) {
                        console.error('AI suggestions failed:', error);
                        panel.webview.postMessage({
                            type: 'aiSuggestions',
                            suggestions: null
                        });
                    }
                    break;
                case 'cancel':
                    panel.dispose();
                    break;
            }
        });
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to edit prompt: ${error}`);
    }
}

async function deletePrompt(promptId: string) {
    try {
        const prompt = await promptManager.getPrompt(promptId);
        if (!prompt) {
            vscode.window.showErrorMessage('Prompt not found');
            return;
        }

        const confirmation = await vscode.window.showWarningMessage(
            `Are you sure you want to delete "${prompt.title}"?`,
            'Yes', 'No'
        );

        if (confirmation !== 'Yes') {
            return;
        }

        await promptManager.deletePrompt(promptId);
        vscode.window.showInformationMessage(`Prompt "${prompt.title}" deleted successfully!`);
        promptTreeProvider.refresh();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to delete prompt: ${error}`);
    }
}

async function exportPrompts() {
    try {
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(`promptvault-export-${new Date().toISOString().split('T')[0]}.json`),
            filters: {
                'JSON Files': ['json']
            }
        });

        if (!saveUri) {
            return;
        }

        await promptManager.exportPrompts(saveUri.fsPath);
        vscode.window.showInformationMessage('Prompts exported successfully!');
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to export prompts: ${error}`);
    }
}

async function importPrompts() {
    try {
        const openUri = await vscode.window.showOpenDialog({
            canSelectFiles: true,
            canSelectFolders: false,
            canSelectMany: false,
            filters: {
                'JSON Files': ['json']
            }
        });

        if (!openUri || openUri.length === 0) {
            return;
        }

        const importedCount = await promptManager.importPrompts(openUri[0].fsPath);
        vscode.window.showInformationMessage(`Successfully imported ${importedCount} prompts!`);
        promptTreeProvider.refresh();
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to import prompts: ${error}`);
    }
}

async function searchPrompts() {
    const searchTerm = await vscode.window.showInputBox({
        prompt: 'Search prompts by title, content, or tags',
        placeHolder: 'Enter search term...'
    });

    if (!searchTerm) {
        return;
    }

    try {
        const results = await promptManager.searchPrompts(searchTerm);
        if (results.length === 0) {
            vscode.window.showInformationMessage('No prompts found matching your search');
            return;
        }

        const selectedPrompt = await vscode.window.showQuickPick(
            results.map(prompt => ({
                label: prompt.title,
                description: prompt.tags.join(', '),
                detail: prompt.content.substring(0, 100) + '...',
                promptId: prompt.id
            })),
            {
                placeHolder: 'Select a prompt to open'
            }
        );

        if (selectedPrompt) {
            openPrompt(selectedPrompt.promptId);
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Search failed: ${error}`);
    }
}

async function openPrompt(promptId: string) {
    try {
        const prompt = await promptManager.getPrompt(promptId);
        if (!prompt) {
            vscode.window.showErrorMessage('Prompt not found');
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'promptvault.prompt',
            `PromptVault: ${prompt.title}`,
            vscode.ViewColumn.Beside,
            {
                enableScripts: true
            }
        );

        panel.webview.html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${prompt.title}</title>
                <style>
                    body { 
                        font-family: var(--vscode-font-family); 
                        background-color: var(--vscode-editor-background);
                        color: var(--vscode-editor-foreground);
                        padding: 20px;
                        line-height: 1.6;
                    }
                    .header { 
                        border-bottom: 1px solid var(--vscode-panel-border); 
                        padding-bottom: 15px; 
                        margin-bottom: 20px; 
                    }
                    .title { 
                        font-size: 24px; 
                        font-weight: bold; 
                        margin-bottom: 10px; 
                    }
                    .tags { 
                        display: flex; 
                        gap: 8px; 
                        flex-wrap: wrap; 
                    }
                    .tag { 
                        background: var(--vscode-badge-background); 
                        color: var(--vscode-badge-foreground); 
                        padding: 4px 8px; 
                        border-radius: 4px; 
                        font-size: 12px; 
                    }
                    .content { 
                        background: var(--vscode-textCodeBlock-background); 
                        padding: 15px; 
                        border-radius: 4px; 
                        border: 1px solid var(--vscode-panel-border);
                        white-space: pre-wrap; 
                        font-family: var(--vscode-editor-font-family); 
                    }
                    .metadata { 
                        margin-top: 20px; 
                        font-size: 14px; 
                        color: var(--vscode-descriptionForeground); 
                    }
                    .copy-button {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-top: 15px;
                    }
                    .copy-button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">${prompt.title}</div>
                    <div class="tags">
                        ${prompt.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="content">${prompt.content}</div>
                <button class="copy-button" onclick="copyToClipboard()">📋 Copy to Clipboard</button>
                <div class="metadata">
                    <p><strong>Source:</strong> ${prompt.source}</p>
                    <p><strong>Language:</strong> ${prompt.language}</p>
                    <p><strong>Created:</strong> ${new Date(prompt.createdAt).toLocaleString()}</p>
                    <p><strong>Updated:</strong> ${new Date(prompt.updatedAt).toLocaleString()}</p>
                </div>
                <script>
                    function copyToClipboard() {
                        const content = \`${prompt.content.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
                        navigator.clipboard.writeText(content).then(() => {
                            const button = document.querySelector('.copy-button');
                            const originalText = button.textContent;
                            button.textContent = '✅ Copied!';
                            setTimeout(() => {
                                button.textContent = originalText;
                            }, 2000);
                        }).catch(err => {
                            console.error('Failed to copy: ', err);
                            alert('Failed to copy to clipboard');
                        });
                    }
                </script>
            </body>
            </html>
        `;
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open prompt: ${error}`);
    }
}

async function copyPrompt(promptId: string) {
    try {
        const prompt = await promptManager.getPrompt(promptId);
        if (!prompt) {
            vscode.window.showErrorMessage('Prompt not found');
            return;
        }

        // Copy the prompt content to clipboard
        await vscode.env.clipboard.writeText(prompt.content);
        vscode.window.showInformationMessage(`Prompt "${prompt.title}" copied to clipboard!`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to copy prompt: ${error}`);
    }
}

async function resetTreeView() {
    try {
        console.log('Resetting tree view due to duplicate ID error...');
        
        // Dispose current tree view and provider
        if (treeView) {
            treeView.dispose();
        }
        
        if (promptTreeProvider && typeof promptTreeProvider.dispose === 'function') {
            promptTreeProvider.dispose();
        }
        
        // Wait a moment for cleanup
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Create new tree provider
        console.log('Creating new PromptTreeProvider...');
        promptTreeProvider = new PromptTreeProvider(promptManager);
        
        // Create new tree view
        console.log('Creating new tree view...');
        treeView = vscode.window.createTreeView('promptvault.treeView', {
            treeDataProvider: promptTreeProvider,
            showCollapseAll: true,
            canSelectMany: false
        });
        
        console.log('Tree view reset completed successfully');
        return true;
    } catch (error) {
        console.error('Failed to reset tree view:', error);
        return false;
    }
}

export function deactivate() {
    // Cleanup resources
    console.log('PromptVault extension deactivating...');
    
    if (treeView) {
        treeView.dispose();
    }
    
    if (promptTreeProvider && typeof promptTreeProvider.dispose === 'function') {
        promptTreeProvider.dispose();
    }
    
    console.log('PromptVault extension deactivated');
}

import * as vscode from 'vscode';
import { PromptManager } from './promptManager';
import { PromptTreeProvider } from './promptTreeProvider';
import { PromptWebviewProvider } from './promptWebviewProvider';
import { AIService } from './aiService';

let promptManager: PromptManager;
let promptTreeProvider: PromptTreeProvider;
let promptWebviewProvider: PromptWebviewProvider;
let aiService: AIService;

export function activate(context: vscode.ExtensionContext) {
    // Enable verbose logging
    const outputChannel = vscode.window.createOutputChannel('PromptVault');
    
    function log(message: string, ...args: any[]) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage, ...args);
        outputChannel.appendLine(logMessage + (args.length ? ' ' + JSON.stringify(args) : ''));
    }
    
    function logError(message: string, error: any) {
        const timestamp = new Date().toISOString();
        const errorMessage = `[${timestamp}] ERROR: ${message}`;
        console.error(errorMessage, error);
        outputChannel.appendLine(errorMessage + ' ' + (error?.stack || error?.message || JSON.stringify(error)));
        outputChannel.show(); // Show output channel on error
    }
    
    // Make sure activation is async to handle any promises properly
    activateExtension(context, log, logError, outputChannel).catch(error => {
        logError('Critical activation failure', error);
        vscode.window.showErrorMessage(`PromptVault failed to activate: ${error.message || error}`);
    });
}

async function activateExtension(context: vscode.ExtensionContext, log: Function, logError: Function, outputChannel: vscode.OutputChannel) {
    try {
        log('PromptVault extension activation started...');
        log('VS Code version:', vscode.version);
        log('Extension context:', {
            extensionPath: context.extensionPath,
            globalState: !!context.globalState,
            workspaceState: !!context.workspaceState
        });
        
        // Initialize services
        log('Initializing PromptManager...');
        promptManager = new PromptManager(context);
        if (!promptManager) {
            throw new Error('Failed to initialize PromptManager');
        }
        log('PromptManager initialized successfully');

        log('Initializing AIService...');
        aiService = new AIService();
        if (!aiService) {
            throw new Error('Failed to initialize AIService');
        }
        log('AIService initialized successfully');

        log('Initializing PromptTreeProvider...');
        promptTreeProvider = new PromptTreeProvider(promptManager);
        if (!promptTreeProvider) {
            throw new Error('Failed to initialize PromptTreeProvider');
        }
        log('PromptTreeProvider initialized successfully');

        log('Initializing PromptWebviewProvider...');
        promptWebviewProvider = new PromptWebviewProvider(context.extensionUri, promptManager);
        if (!promptWebviewProvider) {
            throw new Error('Failed to initialize PromptWebviewProvider');
        }
        log('PromptWebviewProvider initialized successfully');

        // Register tree view
        log('Creating tree view...');
        const treeView = vscode.window.createTreeView('promptvault.treeView', {
            treeDataProvider: promptTreeProvider,
            showCollapseAll: true,
            canSelectMany: false
        });
        log('Tree view created successfully');

        // Set context to show tree view
        log('Setting context...');
        vscode.commands.executeCommand('setContext', 'promptvault.enabled', true);
        log('Context set successfully');

        // Register commands
        log('Registering commands...');
        const commands = [
            vscode.commands.registerCommand('promptvault.savePrompt', () => {
                log('savePrompt command called');
                return saveSelectedPrompt();
            }),
            vscode.commands.registerCommand('promptvault.openPanel', () => {
                log('openPanel command called');
                return openPromptPanel();
            }),
            vscode.commands.registerCommand('promptvault.refreshTree', () => {
                log('refreshTree command called');
                return promptTreeProvider.refresh();
            }),
            vscode.commands.registerCommand('promptvault.addPrompt', () => {
                log('addPrompt command called');
                return addNewPrompt();
            }),
            vscode.commands.registerCommand('promptvault.editPrompt', (treeItem: any) => {
                log('editPrompt command called with:', treeItem);
                return editPrompt(treeItem.promptId || treeItem);
            }),
            vscode.commands.registerCommand('promptvault.deletePrompt', (treeItem: any) => {
                log('deletePrompt command called with:', treeItem);
                return deletePrompt(treeItem.promptId || treeItem);
            }),
            vscode.commands.registerCommand('promptvault.copyPrompt', (treeItem: any) => {
                log('copyPrompt command called with:', treeItem);
                return copyPrompt(treeItem.promptId || treeItem);
            }),
            vscode.commands.registerCommand('promptvault.exportPrompts', () => {
                log('exportPrompts command called');
                return exportPrompts();
            }),
            vscode.commands.registerCommand('promptvault.importPrompts', () => {
                log('importPrompts command called');
                return importPrompts();
            }),
            vscode.commands.registerCommand('promptvault.searchPrompts', () => {
                log('searchPrompts command called');
                return searchPrompts();
            }),
            vscode.commands.registerCommand('promptvault.openPrompt', (promptId: string) => {
                log('openPrompt command called with promptId:', promptId);
                return openPrompt(promptId);
            }),
            vscode.commands.registerCommand('promptvault.showDiagnostics', () => {
                log('showDiagnostics command called');
                return showDiagnostics(log, logError, outputChannel);
            })
        ];
        log(`Successfully registered ${commands.length} commands`);

        // Verify commands are registered
        log('Verifying command registration...');
        Promise.resolve(vscode.commands.getCommands(true)).then(allCommands => {
            const promptVaultCommands = allCommands.filter(cmd => cmd.startsWith('promptvault.'));
            log('Found registered PromptVault commands:', promptVaultCommands);
            
            // Test if addPrompt command specifically exists
            if (promptVaultCommands.includes('promptvault.addPrompt')) {
                log('✅ promptvault.addPrompt command is registered successfully');
            } else {
                logError('❌ promptvault.addPrompt command is NOT registered', 'Command missing from registration');
            }
        }).catch(error => {
            logError('Failed to verify command registration', error);
        });

        // Register webview provider - REMOVED: User doesn't want sidebar webview
        // log('Registering webview provider...');
        // context.subscriptions.push(
        //     vscode.window.registerWebviewViewProvider('promptvault.webview', promptWebviewProvider)
        // );
        // log('Webview provider registered successfully');

        // Add all disposables to context
        log('Adding disposables to context...');
        context.subscriptions.push(
            treeView,
            outputChannel, // Add output channel to disposables
            ...commands
        );
        log('Disposables added successfully');

        log('PromptVault extension activated successfully!');
        vscode.window.showInformationMessage('PromptVault extension is now active!');
        outputChannel.show(); // Show output channel after successful activation
        
    } catch (error) {
        logError('Failed to activate PromptVault extension', error);
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
                aiSuggestions = await aiService.generateSuggestions(selectedText, language, {
                    provider: 'openai',
                    apiKey: apiKey,
                    model: 'gpt-3.5-turbo'
                });
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
    // Generate smart suggestions based on content or AI
    let suggestedTitle = 'New Prompt';
    let suggestedTags = ['general'];

    if (aiSuggestions) {
        suggestedTitle = aiSuggestions.title || suggestedTitle;
        suggestedTags = aiSuggestions.tags || suggestedTags;
    } else if (content && content.trim().length > 0) {
        // Fallback: generate basic suggestions from content
        suggestedTitle = generateTitleFromContent(content);
        suggestedTags = generateTagsFromContent(content);
    }

    // Get title with AI suggestion
    const title = await vscode.window.showInputBox({
        prompt: 'Enter prompt title (AI suggested based on content)',
        value: suggestedTitle,
        placeHolder: aiSuggestions ? 'AI-generated title based on your content' : 'Generated from content keywords',
        ignoreFocusOut: true,
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

    // Get tags with AI suggestion
    const tagsInput = await vscode.window.showInputBox({
        prompt: 'Enter tags (comma-separated, AI suggested based on content)',
        value: suggestedTags.join(', '),
        placeHolder: aiSuggestions ? 'AI-generated tags based on your content' : 'e.g., ai, coding, documentation',
        ignoreFocusOut: true
    });

    const tags = tagsInput ? 
        tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : 
        ['general'];

    return { title: title.trim(), tags };
}

function generateTitleFromContent(content: string): string {
    // Simple title generation from content keywords
    const words = content.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other'].includes(word));
    
    if (words.length === 0) {
        return 'New Prompt';
    }
    
    // Take first 3-4 meaningful words and capitalize
    const titleWords = words.slice(0, Math.min(4, words.length));
    return titleWords.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function generateTagsFromContent(content: string): string[] {
    const lowerContent = content.toLowerCase();
    const tags: string[] = [];
    
    // Programming-related keywords
    if (/\b(function|class|method|variable|code|programming|javascript|python|typescript|java|c\+\+|html|css|sql|api|database)\b/.test(lowerContent)) {
        tags.push('programming');
    }
    
    // AI/ML keywords
    if (/\b(ai|artificial intelligence|machine learning|neural network|model|training|algorithm|data science)\b/.test(lowerContent)) {
        tags.push('ai');
    }
    
    // Documentation keywords
    if (/\b(documentation|readme|guide|tutorial|instructions|how to|step by step)\b/.test(lowerContent)) {
        tags.push('documentation');
    }
    
    // Web development keywords
    if (/\b(web|website|frontend|backend|react|angular|vue|node|express|api|rest)\b/.test(lowerContent)) {
        tags.push('web-development');
    }
    
    // DevOps keywords
    if (/\b(docker|kubernetes|deployment|ci\/cd|jenkins|github actions|aws|cloud|infrastructure)\b/.test(lowerContent)) {
        tags.push('devops');
    }
    
    // Testing keywords
    if (/\b(test|testing|unit test|integration test|automation|jest|mocha|cypress)\b/.test(lowerContent)) {
        tags.push('testing');
    }
    
    // If no specific tags found, use general
    if (tags.length === 0) {
        tags.push('general');
    }
    
    return tags;
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
    try {
        const outputChannel = vscode.window.createOutputChannel('PromptVault');
        outputChannel.appendLine('addNewPrompt function called - creating centered add form panel');
        
        // Check if webview provider is available
        if (!promptWebviewProvider) {
            const error = 'PromptWebviewProvider not initialized';
            outputChannel.appendLine('ERROR: ' + error);
            vscode.window.showErrorMessage(error);
            return;
        }
        
        // Create a new webview panel in the main editor area
        const panel = vscode.window.createWebviewPanel(
            'promptvault.addForm',
            'Add New Prompt',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Get the centered add form HTML content
        panel.webview.html = promptWebviewProvider.getAddFormContent(panel.webview);
        
        // Handle messages from the add form
        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.type === 'savePrompt') {
                try {
                    const savedPrompt = await promptManager.savePromptQuick(
                        message.title,
                        message.content,
                        message.tags
                    );
                    
                    // Show success message first
                    vscode.window.showInformationMessage(`Prompt "${message.title}" saved successfully!`);
                    
                    // Refresh the sidebar tree view
                    promptTreeProvider.refresh();
                    
                    // Send success message to webview
                    panel.webview.postMessage({
                        type: 'saveSuccess',
                        message: 'Prompt saved successfully!'
                    });
                    
                    // Close the panel after a short delay to show success message
                    setTimeout(() => {
                        panel.dispose();
                    }, 1500);
                    
                } catch (error) {
                    // Send error message to webview but keep panel open
                    panel.webview.postMessage({
                        type: 'showError',
                        message: 'Failed to save prompt: ' + (error instanceof Error ? error.message : String(error))
                    });
                }
            } else if (message.type === 'getAISuggestions') {
                try {
                    const config = vscode.workspace.getConfiguration('promptvault');
                    const enableAI = config.get<boolean>('enableAI', false);
                    
                    if (!enableAI) {
                        panel.webview.postMessage({
                            type: 'aiSuggestions',
                            suggestions: null
                        });
                        return;
                    }
                    
                    const aiProvider = config.get<string>('aiProvider', 'openai');
                    let apiKey = '';
                    let aiConfig: any = {
                        provider: aiProvider
                    };
                    
                    // Get the appropriate API key and configuration based on provider
                    switch (aiProvider) {
                        case 'openai':
                            apiKey = config.get<string>('openaiApiKey', '');
                            aiConfig.apiKey = apiKey;
                            aiConfig.model = config.get<string>('aiModel') || 'gpt-3.5-turbo';
                            break;
                        case 'anthropic':
                            apiKey = config.get<string>('anthropicApiKey', '');
                            aiConfig.apiKey = apiKey;
                            aiConfig.model = config.get<string>('aiModel') || 'claude-3-haiku-20240307';
                            break;
                        case 'bedrock':
                            apiKey = config.get<string>('awsAccessKey', '');
                            aiConfig.apiKey = apiKey;
                            aiConfig.region = config.get<string>('awsRegion', 'us-east-1');
                            aiConfig.model = config.get<string>('aiModel');
                            break;
                        case 'custom':
                            apiKey = config.get<string>('customAiApiKey', '');
                            aiConfig.apiKey = apiKey;
                            aiConfig.endpoint = config.get<string>('customAiEndpoint', '');
                            aiConfig.model = config.get<string>('aiModel');
                            break;
                    }
                    
                    if (!apiKey) {
                        panel.webview.postMessage({
                            type: 'aiSuggestions',
                            suggestions: null
                        });
                        return;
                    }
                    
                    const suggestions = await aiService.generateSuggestions(
                        message.content,
                        message.language || 'general',
                        aiConfig
                    );
                    
                    panel.webview.postMessage({
                        type: 'aiSuggestions',
                        suggestions: suggestions
                    });
                    
                } catch (error) {
                    panel.webview.postMessage({
                        type: 'aiSuggestions',
                        suggestions: null
                    });
                }
            } else if (message.type === 'cancel') {
                panel.dispose();
            }
        });
        
    } catch (error) {
        const outputChannel = vscode.window.createOutputChannel('PromptVault');
        outputChannel.appendLine('Error in addNewPrompt: ' + (error instanceof Error ? error.stack : JSON.stringify(error)));
        outputChannel.show();
        vscode.window.showErrorMessage(`Failed to open PromptVault add form: ${error}`);
    }
}

async function editPrompt(promptId: string) {
    try {
        const outputChannel = vscode.window.createOutputChannel('PromptVault');
        outputChannel.appendLine('editPrompt function called with promptId: ' + promptId);
        
        const prompt = await promptManager.getPrompt(promptId);
        if (!prompt) {
            vscode.window.showErrorMessage('Prompt not found');
            return;
        }

        // Create a new webview panel in the main editor area for editing
        const panel = vscode.window.createWebviewPanel(
            'promptvault.editForm',
            'Edit Prompt',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Get the centered edit form HTML content with existing prompt data
        panel.webview.html = promptWebviewProvider.getAddFormContent(panel.webview, prompt);
        
        // Handle messages from the edit form
        panel.webview.onDidReceiveMessage(async (message) => {
            if (message.type === 'updatePrompt') {
                try {
                    await promptManager.updatePrompt(prompt.id, {
                        title: message.title,
                        content: message.content,
                        tags: message.tags
                    });
                    
                    // Show success message
                    vscode.window.showInformationMessage(`Prompt "${message.title}" updated successfully!`);
                    
                    // Refresh the sidebar tree view
                    promptTreeProvider.refresh();
                    
                    // Send success message to webview
                    panel.webview.postMessage({
                        type: 'saveSuccess',
                        message: 'Prompt updated successfully!'
                    });
                    
                    // Close the panel after a short delay
                    setTimeout(() => {
                        panel.dispose();
                    }, 1500);
                    
                } catch (error) {
                    panel.webview.postMessage({
                        type: 'showError',
                        message: 'Failed to update prompt: ' + error
                    });
                }
            } else if (message.type === 'getAISuggestions') {
                try {
                    const config = vscode.workspace.getConfiguration('promptvault');
                    const enableAI = config.get<boolean>('enableAI', false);
                    
                    if (!enableAI) {
                        panel.webview.postMessage({
                            type: 'aiSuggestions',
                            suggestions: null
                        });
                        return;
                    }
                    
                    const aiProvider = config.get<string>('aiProvider', 'openai');
                    let apiKey = '';
                    let aiConfig: any = {
                        provider: aiProvider
                    };
                    
                    // Get the appropriate API key and configuration based on provider
                    switch (aiProvider) {
                        case 'openai':
                            apiKey = config.get<string>('openaiApiKey', '');
                            aiConfig.apiKey = apiKey;
                            aiConfig.model = config.get<string>('aiModel') || 'gpt-3.5-turbo';
                            break;
                        case 'anthropic':
                            apiKey = config.get<string>('anthropicApiKey', '');
                            aiConfig.apiKey = apiKey;
                            aiConfig.model = config.get<string>('aiModel') || 'claude-3-haiku-20240307';
                            break;
                        case 'bedrock':
                            apiKey = config.get<string>('awsAccessKey', '');
                            aiConfig.apiKey = apiKey;
                            aiConfig.region = config.get<string>('awsRegion', 'us-east-1');
                            aiConfig.model = config.get<string>('aiModel');
                            break;
                        case 'custom':
                            apiKey = config.get<string>('customAiApiKey', '');
                            aiConfig.apiKey = apiKey;
                            aiConfig.endpoint = config.get<string>('customAiEndpoint', '');
                            aiConfig.model = config.get<string>('aiModel');
                            break;
                    }
                    
                    if (!apiKey) {
                        panel.webview.postMessage({
                            type: 'aiSuggestions',
                            suggestions: null
                        });
                        return;
                    }
                    
                    const suggestions = await aiService.generateSuggestions(
                        message.content,
                        message.language || 'general',
                        aiConfig
                    );
                    
                    panel.webview.postMessage({
                        type: 'aiSuggestions',
                        suggestions: suggestions
                    });
                    
                } catch (error) {
                    panel.webview.postMessage({
                        type: 'aiSuggestions',
                        suggestions: null
                    });
                }
            } else if (message.type === 'cancel') {
                panel.dispose();
            }
        });

        outputChannel.appendLine('Centered edit form opened in main editor');
        
    } catch (error) {
        const outputChannel = vscode.window.createOutputChannel('PromptVault');
        outputChannel.appendLine('Error in editPrompt: ' + (error instanceof Error ? error.stack : JSON.stringify(error)));
        outputChannel.show();
        vscode.window.showErrorMessage(`Failed to open edit UI: ${error}`);
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

async function showDiagnostics(log: Function, logError: Function, outputChannel: vscode.OutputChannel) {
    try {
        log('=== PROMPTVAULT DIAGNOSTICS ===');
        
        // Extension info
        log('Extension Info:');
        log('- Version: 1.0.5');
        log('- VS Code Version:', vscode.version);
        
        // Workspace info
        log('Workspace Info:');
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            log('- Workspace folders:', vscode.workspace.workspaceFolders.map(f => f.uri.fsPath));
        } else {
            log('- No workspace folders open');
        }
        
        // Configuration
        const config = vscode.workspace.getConfiguration('promptvault');
        log('Configuration:');
        log('- enableAI:', config.get('enableAI'));
        log('- defaultTags:', config.get('defaultTags'));
        log('- storageMode:', config.get('storageMode'));
        log('- storagePath:', config.get('storagePath'));
        
        // Commands
        log('Checking command registration...');
        const allCommands = await vscode.commands.getCommands(true);
        const promptVaultCommands = allCommands.filter(cmd => cmd.startsWith('promptvault.'));
        log('Registered PromptVault commands:', promptVaultCommands);
        
        // Storage info
        if (promptManager) {
            log('PromptManager initialized: YES');
            const prompts = await promptManager.getAllPrompts();
            log('Total prompts:', prompts.length);
        } else {
            log('PromptManager initialized: NO');
        }
        
        // Tree provider
        if (promptTreeProvider) {
            log('PromptTreeProvider initialized: YES');
        } else {
            log('PromptTreeProvider initialized: NO');
        }
        
        log('=== END DIAGNOSTICS ===');
        outputChannel.show();
        
        vscode.window.showInformationMessage('Diagnostics completed. Check PromptVault output channel for details.');
        
    } catch (error) {
        logError('Diagnostics failed', error);
        vscode.window.showErrorMessage(`Diagnostics failed: ${error}`);
    }
}

export function deactivate() {
    // Cleanup resources if needed
}

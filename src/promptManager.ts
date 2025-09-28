import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface Prompt {
    id: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    source: string;
    language: string;
    context: string;
}

// Create PromptInput by omitting system-generated fields from Prompt
export type PromptInput = Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>;

export class PromptManager {
    private storagePath: string;
    private promptsFile: string;
    private prompts: Map<string, Prompt> = new Map();
    private outputChannel: vscode.OutputChannel;

    constructor(private context: vscode.ExtensionContext) {
        this.outputChannel = vscode.window.createOutputChannel('PromptVault-Storage');
        console.log('🏗️ INIT: PromptManager constructor called');
        this.log('PromptManager constructor called');
        
        try {
            this.storagePath = this.getStoragePath();
            console.log('🏗️ INIT: Storage path determined:', this.storagePath);
            this.log('Storage path determined:', this.storagePath);
            
            this.promptsFile = path.join(this.storagePath, 'prompts.json');
            console.log('🏗️ INIT: Prompts file path:', this.promptsFile);
            this.log('Prompts file path:', this.promptsFile);
            
            this.ensureStorageExists();
            console.log('🏗️ INIT: Storage directory ensured');
            this.log('Storage directory ensured');
            
            this.loadPrompts();
            console.log('🏗️ INIT: Prompts loaded, count:', this.prompts.size);
            this.log('Prompts loaded, count:', this.prompts.size);
        } catch (error) {
            console.error('❌ INIT: Failed to initialize PromptManager:', error);
            this.logError('Failed to initialize PromptManager', error);
            throw error;
        }
    }

    private log(message: string, ...args: any[]) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage, ...args);
        this.outputChannel.appendLine(logMessage + (args.length ? ' ' + JSON.stringify(args) : ''));
    }

    private logError(message: string, error: any) {
        const timestamp = new Date().toISOString();
        const errorMessage = `[${timestamp}] ERROR: ${message}`;
        console.error(errorMessage, error);
        this.outputChannel.appendLine(errorMessage + ' ' + (error?.stack || error?.message || JSON.stringify(error)));
        this.outputChannel.show();
    }

    private getStoragePath(): string {
        this.log('Getting storage path...');
        
        const config = vscode.workspace.getConfiguration('promptvault');
        const storageMode = config.get<string>('storageMode', 'global');
        const customPath = config.get<string>('storagePath', '');
        
        this.log('Storage configuration:', { storageMode, customPath });

        // Priority: custom > workspace > global (default)
        if (storageMode === 'custom' && customPath) {
            this.log('Using custom storage path');
            return customPath;
        } else if (storageMode === 'workspace') {
            this.log('Attempting workspace storage...');
            if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
                const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
                this.log('Workspace found:', workspaceRoot);
                return path.join(workspaceRoot, '.promptvault');
            } else {
                this.log('No workspace found, falling back to global storage');
                const globalStorage = this.context.globalStorageUri.fsPath;
                return path.join(globalStorage, 'promptvault');
            }
        } else {
            // Default to global storage (VS Code extension profile folder)
            this.log('Using global storage (VS Code extension profile)');
            const globalStorage = this.context.globalStorageUri.fsPath;
            return path.join(globalStorage, 'promptvault');
        }
    }

    private ensureStorageExists(): void {
        this.log('Ensuring storage directory exists:', this.storagePath);
        try {
            if (!fs.existsSync(this.storagePath)) {
                this.log('Storage directory does not exist, creating...');
                fs.mkdirSync(this.storagePath, { recursive: true });
                this.log('Storage directory created successfully');
            } else {
                this.log('Storage directory already exists');
            }
        } catch (error) {
            this.logError('Failed to create storage directory', error);
            throw error;
        }
    }

    private loadPrompts(): void {
        this.log('Loading prompts from file:', this.promptsFile);
        try {
            if (fs.existsSync(this.promptsFile)) {
                this.log('Prompts file exists, reading...');
                const data = fs.readFileSync(this.promptsFile, 'utf8');
                this.log('File read successfully, data length:', data.length);
                
                const promptsArray = JSON.parse(data) as Prompt[];
                this.log('JSON parsed successfully, prompts count:', promptsArray.length);
                
                this.prompts.clear();
                promptsArray.forEach(prompt => {
                    this.prompts.set(prompt.id, prompt);
                });
                this.log('Prompts loaded into memory successfully');
            } else {
                this.log('Prompts file does not exist, starting with empty collection');
            }
        } catch (error) {
            this.logError('Failed to load prompts', error);
            vscode.window.showErrorMessage('Failed to load prompts from storage');
        }
    }

    private savePrompts(): void {
        try {
            console.log('💾 STORAGE: savePrompts() called, total prompts:', this.prompts.size);
            const promptsArray = Array.from(this.prompts.values());
            console.log('💾 STORAGE: Converting to array, length:', promptsArray.length);
            console.log('💾 STORAGE: Writing to file:', this.promptsFile);
            
            fs.writeFileSync(this.promptsFile, JSON.stringify(promptsArray, null, 2));
            console.log('✅ STORAGE: Successfully wrote prompts to file');
            
            // Verify the file was written
            if (fs.existsSync(this.promptsFile)) {
                const stats = fs.statSync(this.promptsFile);
                console.log('✅ STORAGE: File exists, size:', stats.size, 'bytes');
            } else {
                console.error('❌ STORAGE: File does not exist after write!');
            }
        } catch (error) {
            console.error('❌ STORAGE: Failed to save prompts:', error);
            console.error('❌ STORAGE: Error details:', error instanceof Error ? error.stack : error);
            throw new Error('Failed to save prompts to storage');
        }
    }

    async savePrompt(input: PromptInput): Promise<Prompt> {
        const now = new Date().toISOString();
        const prompt: Prompt = {
            id: uuidv4(),
            title: input.title,
            content: input.content,
            tags: input.tags,
            createdAt: now,
            updatedAt: now,
            source: input.source,
            language: input.language,
            context: input.context
        };

        this.prompts.set(prompt.id, prompt);
        this.savePrompts();
        return prompt;
    }

    async getPrompt(id: string): Promise<Prompt | undefined> {
        return this.prompts.get(id);
    }

    async getPromptById(id: string): Promise<Prompt | undefined> {
        return this.prompts.get(id);
    }

    async savePromptQuick(title: string, content: string, tags: string[]): Promise<Prompt> {
        console.log('savePromptQuick called with:', { title, content, tags });
        const now = new Date().toISOString();
        const prompt: Prompt = {
            id: uuidv4(),
            title: title,
            content: content,
            tags: tags,
            createdAt: now,
            updatedAt: now,
            source: 'manual',
            language: 'text',
            context: ''
        };

        this.prompts.set(prompt.id, prompt);
        console.log('Prompt added to memory, total prompts:', this.prompts.size);
        
        await this.savePrompts();
        console.log('Prompts saved to storage');
        
        return prompt;
    }

    async generateAISuggestions(content: string): Promise<{ title: string; tags: string[] }> {
        try {
            const config = vscode.workspace.getConfiguration('promptvault');
            const enableAI = config.get<boolean>('enableAI', false);
            const apiKey = config.get<string>('openaiApiKey', '');

            // Check if AI is enabled
            if (!enableAI) {
                throw new Error('AI suggestions are disabled. Enable them in PromptVault settings.');
            }

            // Check if API key is provided
            if (!apiKey || apiKey.trim() === '') {
                throw new Error('OpenAI API key is missing. Please add your API key in PromptVault settings (promptvault.openaiApiKey).');
            }

            // Import OpenAI dynamically
            const { OpenAI } = await import('openai');
            const openai = new OpenAI({ apiKey });

            const prompt = `Analyze this text and suggest a concise title (max 60 characters) and relevant tags (max 5 tags):

Text: ${content.substring(0, 500)}...

Respond with JSON format:
{
  "title": "suggested title",
  "tags": ["tag1", "tag2", "tag3"]
}`;

            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 150,
                temperature: 0.3
            });

            const responseText = response.choices[0]?.message?.content;
            if (responseText) {
                try {
                    const suggestions = JSON.parse(responseText);
                    return {
                        title: suggestions.title || 'Untitled Prompt',
                        tags: Array.isArray(suggestions.tags) ? suggestions.tags : ['general']
                    };
                } catch (parseError) {
                    console.warn('Failed to parse AI response, using fallback');
                    return this.generateBasicSuggestions(content);
                }
            }

            return this.generateBasicSuggestions(content);
        } catch (error) {
            // Re-throw specific configuration errors for the UI to handle
            if (error instanceof Error && (
                error.message.includes('AI suggestions are disabled') || 
                error.message.includes('API key is missing')
            )) {
                throw error;
            }

            // For other errors (network, API issues), log and use fallback
            console.warn('AI suggestions failed, using fallback:', error);
            throw new Error(`AI service error: ${error instanceof Error ? error.message : 'Unknown error'}. Check your API key and internet connection.`);
        }
    }

    private generateBasicSuggestions(content: string): { title: string; tags: string[] } {
        // Extract potential title from first line or words
        const firstLine = content.split('\n')[0].trim();
        const title = firstLine.length > 60 ? firstLine.substring(0, 57) + '...' : firstLine || 'Untitled Prompt';

        // Basic tag detection based on keywords
        const tags = new Set<string>();
        const lowerContent = content.toLowerCase();

        // Programming language detection
        if (lowerContent.includes('function') || lowerContent.includes('const ') || lowerContent.includes('let ')) {
            tags.add('javascript');
        }
        if (lowerContent.includes('def ') || lowerContent.includes('import ')) {
            tags.add('python');
        }
        if (lowerContent.includes('public class') || lowerContent.includes('void main')) {
            tags.add('java');
        }
        if (lowerContent.includes('SELECT') || lowerContent.includes('FROM')) {
            tags.add('sql');
        }

        // Content type detection
        if (lowerContent.includes('api') || lowerContent.includes('endpoint')) {
            tags.add('api');
        }
        if (lowerContent.includes('test') || lowerContent.includes('expect')) {
            tags.add('testing');
        }
        if (lowerContent.includes('docker') || lowerContent.includes('kubernetes')) {
            tags.add('devops');
        }
        if (lowerContent.includes('ai') || lowerContent.includes('machine learning') || lowerContent.includes('neural')) {
            tags.add('ai');
        }

        // Default tag if none found
        if (tags.size === 0) {
            tags.add('general');
        }

        return {
            title,
            tags: Array.from(tags).slice(0, 5) // Limit to 5 tags
        };
    }

    async getAllPrompts(): Promise<Prompt[]> {
        return Array.from(this.prompts.values()).sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    }

    async updatePrompt(id: string, updates: Partial<Pick<Prompt, 'title' | 'content' | 'tags'>>): Promise<void> {
        const prompt = this.prompts.get(id);
        if (!prompt) {
            throw new Error('Prompt not found');
        }

        const updatedPrompt: Prompt = {
            ...prompt,
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.prompts.set(id, updatedPrompt);
        this.savePrompts();
    }

    async deletePrompt(id: string): Promise<void> {
        if (!this.prompts.has(id)) {
            throw new Error('Prompt not found');
        }

        this.prompts.delete(id);
        this.savePrompts();
    }

    async searchPrompts(query: string): Promise<Prompt[]> {
        const searchTerm = query.toLowerCase();
        return Array.from(this.prompts.values()).filter(prompt => 
            prompt.title.toLowerCase().includes(searchTerm) ||
            prompt.content.toLowerCase().includes(searchTerm) ||
            prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    async getPromptsByTag(tag: string): Promise<Prompt[]> {
        return Array.from(this.prompts.values()).filter(prompt =>
            prompt.tags.includes(tag)
        );
    }

    async getAllTags(): Promise<string[]> {
        const tags = new Set<string>();
        this.prompts.forEach(prompt => {
            prompt.tags.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }

    async exportPrompts(filePath: string): Promise<void> {
        try {
            const promptsArray = Array.from(this.prompts.values());
            const exportData = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                prompts: promptsArray
            };
            fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
        } catch (error) {
            throw new Error(`Failed to export prompts: ${error}`);
        }
    }

    async importPrompts(filePath: string): Promise<number> {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            const importData = JSON.parse(data);
            
            let promptsToImport: Prompt[];
            
            // Handle different import formats
            if (importData.prompts && Array.isArray(importData.prompts)) {
                promptsToImport = importData.prompts;
            } else if (Array.isArray(importData)) {
                promptsToImport = importData;
            } else {
                throw new Error('Invalid import file format');
            }

            let importedCount = 0;
            for (const promptData of promptsToImport) {
                // Validate prompt data
                if (!promptData.title || !promptData.content) {
                    continue;
                }

                // Generate new ID to avoid conflicts
                const prompt: Prompt = {
                    id: uuidv4(),
                    title: promptData.title,
                    content: promptData.content,
                    tags: promptData.tags || ['imported'],
                    createdAt: promptData.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    source: promptData.source || 'imported',
                    language: promptData.language || 'text',
                    context: promptData.context || ''
                };

                this.prompts.set(prompt.id, prompt);
                importedCount++;
            }

            if (importedCount > 0) {
                this.savePrompts();
            }

            return importedCount;
        } catch (error) {
            throw new Error(`Failed to import prompts: ${error}`);
        }
    }

    getStorageInfo(): { path: string; count: number; size: number } {
        const stats = fs.existsSync(this.promptsFile) ? fs.statSync(this.promptsFile) : null;
        return {
            path: this.storagePath,
            count: this.prompts.size,
            size: stats ? stats.size : 0
        };
    }
}

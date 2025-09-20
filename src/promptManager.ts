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

export interface PromptInput {
    title: string;
    content: string;
    tags: string[];
    language: string;
    source: string;
    context: string;
}

export class PromptManager {
    private storagePath: string;
    private promptsFile: string;
    private prompts: Map<string, Prompt> = new Map();

    constructor(private context: vscode.ExtensionContext) {
        this.storagePath = this.getStoragePath();
        this.promptsFile = path.join(this.storagePath, 'prompts.json');
        this.ensureStorageExists();
        this.loadPrompts();
    }

    private getStoragePath(): string {
        // Use workspace storage if available, otherwise use global storage
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
            return path.join(workspaceRoot, '.promptvault');
        } else {
            const globalStorage = this.context.globalStorageUri.fsPath;
            return path.join(globalStorage, 'promptvault');
        }
    }

    private ensureStorageExists(): void {
        if (!fs.existsSync(this.storagePath)) {
            fs.mkdirSync(this.storagePath, { recursive: true });
        }
    }

    private loadPrompts(): void {
        try {
            if (fs.existsSync(this.promptsFile)) {
                const data = fs.readFileSync(this.promptsFile, 'utf8');
                const promptsArray = JSON.parse(data) as Prompt[];
                this.prompts.clear();
                promptsArray.forEach(prompt => {
                    this.prompts.set(prompt.id, prompt);
                });
            }
        } catch (error) {
            console.error('Failed to load prompts:', error);
            vscode.window.showErrorMessage('Failed to load prompts from storage');
        }
    }

    private savePrompts(): void {
        try {
            const promptsArray = Array.from(this.prompts.values());
            fs.writeFileSync(this.promptsFile, JSON.stringify(promptsArray, null, 2));
        } catch (error) {
            console.error('Failed to save prompts:', error);
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

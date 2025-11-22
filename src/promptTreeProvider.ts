import * as vscode from 'vscode';
import { PromptManager, Prompt } from './promptManager';

export class PromptTreeProvider implements vscode.TreeDataProvider<PromptTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<PromptTreeItem | undefined | null | void> = new vscode.EventEmitter<PromptTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<PromptTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private promptManager: PromptManager) {
        console.log('PromptTreeProvider initialized');
    }

    refresh(): void {
        console.log('Refreshing tree view...');
        this._onDidChangeTreeData.fire();
    }

    dispose(): void {
        this._onDidChangeTreeData.dispose();
        console.log('PromptTreeProvider disposed');
    }

    getTreeItem(element: PromptTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: PromptTreeItem): Promise<PromptTreeItem[]> {
        if (!element) {
            return this.getTagGroups();
        } else if (element.contextValue === 'tag') {
            return this.getPromptsForTag(element.tagName!);
        }
        return [];
    }

    private async getTagGroups(): Promise<PromptTreeItem[]> {
        try {
            const allPrompts = await this.promptManager.getAllPrompts();
            const tagGroups: PromptTreeItem[] = [];
            const allTags = new Set<string>();
            let hasUntagged = false;
            
            allPrompts.forEach(prompt => {
                if (prompt.tags && prompt.tags.length > 0) {
                    prompt.tags.forEach(tag => allTags.add(tag));
                } else {
                    hasUntagged = true;
                }
            });

            for (const tag of Array.from(allTags).sort()) {
                const tagPrompts = allPrompts.filter(p => p.tags && p.tags.includes(tag));
                tagGroups.push(new PromptTreeItem(
                    `${tag} (${tagPrompts.length})`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'tag',
                    tag
                ));
            }

            if (hasUntagged) {
                const untaggedPrompts = allPrompts.filter(p => !p.tags || p.tags.length === 0);
                tagGroups.push(new PromptTreeItem(
                    `Untagged (${untaggedPrompts.length})`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'tag',
                    'untagged'
                ));
            }

            return tagGroups;
        } catch (error) {
            console.error('Error getting tag groups:', error);
            vscode.window.showErrorMessage(`Failed to load prompts: ${error}`);
            return [];
        }
    }

    private async getPromptsForTag(tagName: string): Promise<PromptTreeItem[]> {
        try {
            const allPrompts = await this.promptManager.getAllPrompts();
            let prompts: Prompt[];

            if (tagName === 'untagged') {
                // Handle the special case for truly untagged prompts
                prompts = allPrompts.filter(p => !p.tags || p.tags.length === 0);
            } else {
                // Simply filter by the tag name - treat all tags equally
                prompts = allPrompts.filter(p => p.tags && p.tags.includes(tagName));
            }

            return prompts.map(prompt => new PromptTreeItem(
                prompt.title, // Clean title without spaces
                vscode.TreeItemCollapsibleState.None,
                'prompt',
                tagName, // Pass the parent tag name
                prompt.id,
                undefined, // Remove the command property to prevent duplicate calls
                prompt
            ));
        } catch (error) {
            console.error('Error getting prompts for tag:', error);
            vscode.window.showErrorMessage(`Failed to load prompts for tag: ${error}`);
            return [];
        }
    }
}

export class PromptTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly tagName?: string,
        public readonly promptId?: string,
        public readonly command?: vscode.Command,
        public readonly promptData?: Prompt
    ) {
        super(label, collapsibleState);
        
        if (contextValue === 'tag') {
            this.iconPath = new vscode.ThemeIcon('tag');
            this.id = `tag-${tagName}`;
        } else if (contextValue === 'prompt') {
            this.iconPath = new vscode.ThemeIcon('edit');
            // Set resource URI with a meaningful scheme
            this.resourceUri = vscode.Uri.parse(`promptvault-prompt:${promptId}`);
            // Set the ID to help establish parent-child relationship
            this.id = `prompt-${tagName}-${promptId}`;
            // Use regular spaces for indentation - VS Code should handle this properly
            this.label = `${label}`;
        }
    }
}

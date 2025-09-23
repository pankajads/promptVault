import * as vscode from 'vscode';
import { PromptManager, Prompt } from './promptManager';

export class PromptTreeProvider implements vscode.TreeDataProvider<PromptTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<PromptTreeItem | undefined | null | void> = new vscode.EventEmitter<PromptTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<PromptTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private promptManager: PromptManager) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: PromptTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: PromptTreeItem): Promise<PromptTreeItem[]> {
        if (!element) {
            // Root level - show tag groups and ungrouped prompts
            return this.getRootItems();
        } else if (element.contextValue === 'tag') {
            // Tag group - show prompts with this tag
            return this.getPromptsForTag(element.label as string);
        } else {
            // Prompt item - no children
            return [];
        }
    }

    private async getRootItems(): Promise<PromptTreeItem[]> {
        try {
            const prompts = await this.promptManager.getAllPrompts();
            const tags = await this.promptManager.getAllTags();
            const items: PromptTreeItem[] = [];
            const timestamp = Date.now();

            // Add tag groups
            for (const tag of tags) {
                const tagPrompts = await this.promptManager.getPromptsByTag(tag);
                if (tagPrompts.length > 0) {
                    items.push(new PromptTreeItem(
                        `${tag} (${tagPrompts.length})`,
                        vscode.TreeItemCollapsibleState.Collapsed,
                        'tag',
                        `${timestamp}-tag-${tag}`, // Unique ID for tag with timestamp
                        undefined, // No prompt ID for tags
                        undefined // No command for tag items
                    ));
                }
            }

            // Add ungrouped prompts (if any)
            const ungroupedPrompts = prompts.filter(prompt => 
                prompt.tags.length === 0 || prompt.tags.every(tag => tag === 'general')
            );

            if (ungroupedPrompts.length > 0) {
                items.push(new PromptTreeItem(
                    `General (${ungroupedPrompts.length})`,
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'tag',
                    `${timestamp}-tag-general`, // Unique ID for general tag with timestamp
                    undefined, // No prompt ID for tags
                    undefined // No command for tag items
                ));
            }

            return items;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to load prompts: ${error}`);
            return [];
        }
    }

    private async getPromptsForTag(tagLabel: string): Promise<PromptTreeItem[]> {
        try {
            const tag = tagLabel.split(' (')[0]; // Remove count from label
            let prompts: Prompt[];
            const timestamp = Date.now();

            if (tag === 'General') {
                const allPrompts = await this.promptManager.getAllPrompts();
                prompts = allPrompts.filter(prompt => 
                    prompt.tags.length === 0 || prompt.tags.every(t => t === 'general')
                );
            } else {
                prompts = await this.promptManager.getPromptsByTag(tag);
            }

            return prompts.map((prompt, index) => new PromptTreeItem(
                prompt.title,
                vscode.TreeItemCollapsibleState.None,
                'prompt',
                `${timestamp}-${tag}-${prompt.id}-${index}`, // Unique tree item ID with timestamp
                prompt.id, // Store actual prompt ID separately
                {
                    command: 'promptvault.openPrompt',
                    title: 'Open Prompt',
                    arguments: [prompt.id]
                }
            ));
        } catch (error) {
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
        public readonly id?: string,
        public readonly promptId?: string, // Actual prompt ID for commands
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);

        this.tooltip = this.label;
        this.contextValue = contextValue;
        
        if (contextValue === 'prompt') {
            this.iconPath = new vscode.ThemeIcon('file-text');
        } else if (contextValue === 'tag') {
            this.iconPath = new vscode.ThemeIcon('tag');
        }
    }
}

import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    
    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('promptvault.promptvault'));
    });

    test('Should activate extension', async () => {
        const extension = vscode.extensions.getExtension('promptvault.promptvault');
        if (extension) {
            await extension.activate();
            assert.ok(extension.isActive);
        }
    });

    test('Should register commands', async () => {
        const commands = await vscode.commands.getCommands(true);
        
        const expectedCommands = [
            'promptvault.savePrompt',
            'promptvault.openPanel',
            'promptvault.refreshTree',
            'promptvault.addPrompt',
            'promptvault.editPrompt',
            'promptvault.deletePrompt',
            'promptvault.copyPrompt',
            'promptvault.exportPrompts',
            'promptvault.importPrompts',
            'promptvault.searchPrompts',
            'promptvault.openPrompt'
        ];

        for (const command of expectedCommands) {
            assert.ok(commands.includes(command), `Command ${command} should be registered`);
        }
    });

    test('Should have proper package.json configuration', () => {
        const extension = vscode.extensions.getExtension('promptvault.promptvault');
        if (extension) {
            const packageJSON = extension.packageJSON;
            
            assert.strictEqual(packageJSON.name, 'promptvault');
            assert.strictEqual(packageJSON.displayName, 'PromptVault');
            assert.ok(packageJSON.contributes);
            assert.ok(packageJSON.contributes.commands);
            assert.ok(packageJSON.contributes.views);
            assert.ok(packageJSON.contributes.menus);
        }
    });

    test('Should have tree view configuration', () => {
        const extension = vscode.extensions.getExtension('promptvault.promptvault');
        if (extension) {
            const packageJSON = extension.packageJSON;
            const views = packageJSON.contributes.views;
            
            assert.ok(views.explorer);
            assert.ok(views.explorer.some((view: any) => view.id === 'promptvault.treeView'));
        }
    });

    test('Should have context menu configuration', () => {
        const extension = vscode.extensions.getExtension('promptvault.promptvault');
        if (extension) {
            const packageJSON = extension.packageJSON;
            const menus = packageJSON.contributes.menus;
            
            assert.ok(menus['editor/context']);
            assert.ok(menus['view/title']);
            assert.ok(menus['view/item/context']);
        }
    });

    test('Should have keyboard shortcuts', () => {
        const extension = vscode.extensions.getExtension('promptvault.promptvault');
        if (extension) {
            const packageJSON = extension.packageJSON;
            const keybindings = packageJSON.contributes.keybindings;
            
            assert.ok(keybindings);
            assert.ok(keybindings.some((kb: any) => kb.command === 'promptvault.savePrompt'));
        }
    });

    test('Should have configuration options', () => {
        const extension = vscode.extensions.getExtension('promptvault.promptvault');
        if (extension) {
            const packageJSON = extension.packageJSON;
            const configuration = packageJSON.contributes.configuration;
            
            assert.ok(configuration);
            assert.ok(configuration.properties);
            assert.ok(configuration.properties['promptvault.enableAI']);
            assert.ok(configuration.properties['promptvault.openaiApiKey']);
            assert.ok(configuration.properties['promptvault.defaultTags']);
        }
    });
});

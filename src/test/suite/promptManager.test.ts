import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PromptManager, PromptInput } from '../../promptManager';

suite('PromptManager Test Suite', () => {
    let promptManager: PromptManager;
    let testContext: any;
    let tempDir: string;

    setup(async () => {
        // Create a temporary directory for testing
        tempDir = path.join(__dirname, 'test-temp-' + Date.now());
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        // Mock extension context
        testContext = {
            globalStorageUri: vscode.Uri.file(tempDir),
            subscriptions: [],
            workspaceState: {
                get: () => undefined,
                update: () => Promise.resolve()
            },
            globalState: {
                get: () => undefined,
                update: () => Promise.resolve()
            }
        };

        promptManager = new PromptManager(testContext);
    });

    teardown(() => {
        // Clean up test files
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    test('Should save and retrieve a prompt', async () => {
        const promptInput: PromptInput = {
            title: 'Test Prompt',
            content: 'This is a test prompt content',
            tags: ['test', 'example'],
            language: 'typescript',
            source: 'editor',
            context: '/test/file.ts'
        };

        const savedPrompt = await promptManager.savePrompt(promptInput);
        
        assert.strictEqual(savedPrompt.title, promptInput.title);
        assert.strictEqual(savedPrompt.content, promptInput.content);
        assert.deepStrictEqual(savedPrompt.tags, promptInput.tags);
        assert.ok(savedPrompt.id);
        assert.ok(savedPrompt.createdAt);
        assert.ok(savedPrompt.updatedAt);

        const retrievedPrompt = await promptManager.getPrompt(savedPrompt.id);
        assert.ok(retrievedPrompt);
        assert.strictEqual(retrievedPrompt.id, savedPrompt.id);
        assert.strictEqual(retrievedPrompt.title, savedPrompt.title);
    });

    test('Should return undefined for non-existent prompt', async () => {
        const nonExistentPrompt = await promptManager.getPrompt('non-existent-id');
        assert.strictEqual(nonExistentPrompt, undefined);
    });

    test('Should get all prompts', async () => {
        const prompt1: PromptInput = {
            title: 'First Prompt',
            content: 'First content',
            tags: ['first'],
            language: 'typescript',
            source: 'editor',
            context: ''
        };

        const prompt2: PromptInput = {
            title: 'Second Prompt',
            content: 'Second content',
            tags: ['second'],
            language: 'javascript',
            source: 'amazonq',
            context: ''
        };

        await promptManager.savePrompt(prompt1);
        await promptManager.savePrompt(prompt2);

        const allPrompts = await promptManager.getAllPrompts();
        assert.ok(allPrompts.length >= 2);
    });

    test('Should search prompts', async () => {
        const promptInput: PromptInput = {
            title: 'React Component',
            content: 'Create a React component with hooks',
            tags: ['react', 'javascript'],
            language: 'javascript',
            source: 'editor',
            context: ''
        };

        await promptManager.savePrompt(promptInput);

        const searchResults = await promptManager.searchPrompts('React');
        assert.ok(searchResults.length > 0);
        assert.ok(searchResults.some(p => p.title.includes('React')));
    });

    test('Should update a prompt', async () => {
        const promptInput: PromptInput = {
            title: 'Original Title',
            content: 'Original content',
            tags: ['original'],
            language: 'python',
            source: 'editor',
            context: ''
        };

        const savedPrompt = await promptManager.savePrompt(promptInput);
        
        await promptManager.updatePrompt(savedPrompt.id, {
            title: 'Updated Title',
            tags: ['updated', 'modified']
        });

        const updatedPrompt = await promptManager.getPrompt(savedPrompt.id);
        assert.ok(updatedPrompt);
        assert.strictEqual(updatedPrompt.title, 'Updated Title');
        assert.deepStrictEqual(updatedPrompt.tags, ['updated', 'modified']);
        assert.strictEqual(updatedPrompt.content, 'Original content');
    });

    test('Should delete a prompt', async () => {
        const promptInput: PromptInput = {
            title: 'To Be Deleted',
            content: 'This will be deleted',
            tags: ['delete'],
            language: 'sql',
            source: 'editor',
            context: ''
        };

        const savedPrompt = await promptManager.savePrompt(promptInput);
        await promptManager.deletePrompt(savedPrompt.id);

        const deletedPrompt = await promptManager.getPrompt(savedPrompt.id);
        assert.strictEqual(deletedPrompt, undefined);
    });

    test('Should get prompts by tag', async () => {
        const prompt1: PromptInput = {
            title: 'Python Test',
            content: 'Python content',
            tags: ['python', 'test'],
            language: 'python',
            source: 'editor',
            context: ''
        };

        const prompt2: PromptInput = {
            title: 'JavaScript Test',
            content: 'JavaScript content',
            tags: ['javascript', 'test'],
            language: 'javascript',
            source: 'editor',
            context: ''
        };

        await promptManager.savePrompt(prompt1);
        await promptManager.savePrompt(prompt2);

        const testPrompts = await promptManager.getPromptsByTag('test');
        assert.ok(testPrompts.length >= 2);
    });

    test('Should get all tags', async () => {
        const promptInput: PromptInput = {
            title: 'Tagged Prompt',
            content: 'Content with tags',
            tags: ['react', 'javascript', 'frontend'],
            language: 'javascript',
            source: 'editor',
            context: ''
        };

        await promptManager.savePrompt(promptInput);

        const allTags = await promptManager.getAllTags();
        assert.ok(allTags.includes('react'));
        assert.ok(allTags.includes('javascript'));
        assert.ok(allTags.includes('frontend'));
    });
});

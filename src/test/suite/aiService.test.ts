import * as assert from 'assert';
import { AIService } from '../../aiService';

suite('AIService Test Suite', () => {
    let aiService: AIService;

    setup(() => {
        aiService = new AIService();
    });

    test('Should handle missing API key', async () => {
        const result = await aiService.generateSuggestions('test content', 'javascript', {
            provider: 'openai',
            apiKey: ''
        });
        assert.strictEqual(result, null);
    });

    test('Should handle empty content', async () => {
        const result = await aiService.generateSuggestions('', 'javascript', {
            provider: 'openai',
            apiKey: 'fake-api-key'
        });
        assert.strictEqual(result, null);
    });

    test('Should return null for invalid API key', async () => {
        const isValid = await aiService.validateConfig({
            provider: 'openai',
            apiKey: 'invalid-key'
        });
        assert.strictEqual(isValid, false);
    });

    test('Should return false for empty API key validation', async () => {
        const isValid = await aiService.validateConfig({
            provider: 'openai',
            apiKey: ''
        });
        assert.strictEqual(isValid, false);
    });

    test('Should create AIService instance', () => {
        assert.ok(aiService instanceof AIService);
    });

    test('Should return available providers', () => {
        const providers = aiService.getAvailableProviders();
        assert.ok(Array.isArray(providers));
        assert.ok(providers.length > 0);
        assert.ok(providers.some(p => p.id === 'openai'));
        assert.ok(providers.some(p => p.id === 'anthropic'));
    });

    test('Should support legacy methods', async () => {
        const result = await aiService.generateSuggestionsLegacy('test content', 'javascript', '');
        assert.strictEqual(result, null);
        
        const isValid = await aiService.isApiKeyValid('');
        assert.strictEqual(isValid, false);
    });
});

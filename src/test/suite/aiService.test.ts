import * as assert from 'assert';
import { AIService } from '../../aiService';

suite('AIService Test Suite', () => {
    let aiService: AIService;

    setup(() => {
        aiService = new AIService();
    });

    test('Should handle missing API key', async () => {
        const result = await aiService.generateSuggestions('test content', 'javascript', '');
        assert.strictEqual(result, null);
    });

    test('Should handle empty content', async () => {
        const result = await aiService.generateSuggestions('', 'javascript', 'fake-api-key');
        assert.strictEqual(result, null);
    });

    test('Should return null for invalid API key', async () => {
        const isValid = await aiService.isApiKeyValid('invalid-key');
        assert.strictEqual(isValid, false);
    });

    test('Should return false for empty API key validation', async () => {
        const isValid = await aiService.isApiKeyValid('');
        assert.strictEqual(isValid, false);
    });

    test('Should create AIService instance', () => {
        assert.ok(aiService instanceof AIService);
    });
});

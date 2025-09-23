import { OpenAI } from 'openai';

export interface AISuggestions {
    title: string;
    tags: string[];
}

export interface AIProvider {
    name: string;
    generateSuggestions(content: string, language: string, config: any): Promise<AISuggestions | null>;
    validateConfig(config: any): Promise<boolean>;
}

export type AIProviderType = 'openai' | 'anthropic' | 'bedrock' | 'custom';

export interface AIConfig {
    provider: AIProviderType;
    apiKey: string;
    model?: string;
    endpoint?: string; // For custom providers
    region?: string; // For AWS Bedrock
}

class OpenAIProvider implements AIProvider {
    name = 'OpenAI';

    async generateSuggestions(content: string, language: string, config: AIConfig): Promise<AISuggestions | null> {
        try {
            const openai = new OpenAI({
                apiKey: config.apiKey
            });

            const prompt = this.buildPrompt(content, language);
            
            const response = await openai.chat.completions.create({
                model: config.model || 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant that analyzes prompts and suggests appropriate titles and tags. Always respond with valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 150,
                temperature: 0.3
            });

            const result = response.choices[0]?.message?.content;
            if (!result) {
                return null;
            }

            return this.parseAIResponse(result);
        } catch (error) {
            console.error('OpenAI error:', error);
            return null;
        }
    }

    async validateConfig(config: AIConfig): Promise<boolean> {
        try {
            const openai = new OpenAI({
                apiKey: config.apiKey
            });

            await openai.chat.completions.create({
                model: config.model || 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 1
            });

            return true;
        } catch (error) {
            return false;
        }
    }

    private buildPrompt(content: string, language: string): string {
        const truncatedContent = content.length > 500 ? content.substring(0, 500) + '...' : content;
        
        return `Analyze the following ${language} prompt and suggest:
1. A concise, descriptive title (max 50 characters)
2. 2-4 relevant tags

Content:
"${truncatedContent}"

Please respond with JSON in this exact format:
{
  "title": "suggested title",
  "tags": ["tag1", "tag2", "tag3"]
}`;
    }

    private parseAIResponse(response: string): AISuggestions | null {
        try {
            // Try to extract JSON from the response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return null;
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            if (!parsed.title || !Array.isArray(parsed.tags)) {
                return null;
            }

            return {
                title: parsed.title.substring(0, 100), // Limit title length
                tags: parsed.tags.slice(0, 5).map((tag: string) => tag.toLowerCase().trim()) // Limit and normalize tags
            };
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            return null;
        }
    }
}

class AnthropicProvider implements AIProvider {
    name = 'Anthropic';

    async generateSuggestions(content: string, language: string, config: AIConfig): Promise<AISuggestions | null> {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': config.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: config.model || 'claude-3-haiku-20240307',
                    max_tokens: 150,
                    messages: [{
                        role: 'user',
                        content: this.buildPrompt(content, language)
                    }]
                })
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            const result = data.content?.[0]?.text;
            
            return result ? this.parseAIResponse(result) : null;
        } catch (error) {
            console.error('Anthropic error:', error);
            return null;
        }
    }

    async validateConfig(config: AIConfig): Promise<boolean> {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': config.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: config.model || 'claude-3-haiku-20240307',
                    max_tokens: 1,
                    messages: [{ role: 'user', content: 'test' }]
                })
            });

            return response.ok;
        } catch (error) {
            return false;
        }
    }

    private buildPrompt(content: string, language: string): string {
        const truncatedContent = content.length > 500 ? content.substring(0, 500) + '...' : content;
        
        return `Analyze the following ${language} prompt and suggest:
1. A concise, descriptive title (max 50 characters)
2. 2-4 relevant tags

Content:
"${truncatedContent}"

Please respond with JSON in this exact format:
{
  "title": "suggested title",
  "tags": ["tag1", "tag2", "tag3"]
}`;
    }

    private parseAIResponse(response: string): AISuggestions | null {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return null;
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            if (!parsed.title || !Array.isArray(parsed.tags)) {
                return null;
            }

            return {
                title: parsed.title.substring(0, 100),
                tags: parsed.tags.slice(0, 5).map((tag: string) => tag.toLowerCase().trim())
            };
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            return null;
        }
    }
}

class BedrockProvider implements AIProvider {
    name = 'AWS Bedrock';

    async generateSuggestions(content: string, language: string, config: AIConfig): Promise<AISuggestions | null> {
        // Note: This is a simplified implementation
        // In production, you'd use AWS SDK for proper authentication
        console.warn('AWS Bedrock integration requires proper AWS SDK setup');
        return null;
    }

    async validateConfig(config: AIConfig): Promise<boolean> {
        // Basic validation - in production, test actual AWS credentials
        return !!(config.apiKey && config.region);
    }
}

class CustomProvider implements AIProvider {
    name = 'Custom';

    async generateSuggestions(content: string, language: string, config: AIConfig): Promise<AISuggestions | null> {
        if (!config.endpoint) {
            return null;
        }

        try {
            // OpenAI-compatible API format
            const response = await fetch(`${config.endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    model: config.model || 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful assistant that analyzes prompts and suggests appropriate titles and tags. Always respond with valid JSON.'
                        },
                        {
                            role: 'user',
                            content: this.buildPrompt(content, language)
                        }
                    ],
                    max_tokens: 150,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json();
            const result = data.choices?.[0]?.message?.content;
            
            return result ? this.parseAIResponse(result) : null;
        } catch (error) {
            console.error('Custom provider error:', error);
            return null;
        }
    }

    async validateConfig(config: AIConfig): Promise<boolean> {
        if (!config.endpoint || !config.apiKey) {
            return false;
        }

        try {
            const response = await fetch(`${config.endpoint}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                body: JSON.stringify({
                    model: config.model || 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: 'test' }],
                    max_tokens: 1
                })
            });

            return response.ok;
        } catch (error) {
            return false;
        }
    }

    private buildPrompt(content: string, language: string): string {
        const truncatedContent = content.length > 500 ? content.substring(0, 500) + '...' : content;
        
        return `Analyze the following ${language} prompt and suggest:
1. A concise, descriptive title (max 50 characters)
2. 2-4 relevant tags

Content:
"${truncatedContent}"

Please respond with JSON in this exact format:
{
  "title": "suggested title",
  "tags": ["tag1", "tag2", "tag3"]
}`;
    }

    private parseAIResponse(response: string): AISuggestions | null {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return null;
            }

            const parsed = JSON.parse(jsonMatch[0]);
            
            if (!parsed.title || !Array.isArray(parsed.tags)) {
                return null;
            }

            return {
                title: parsed.title.substring(0, 100),
                tags: parsed.tags.slice(0, 5).map((tag: string) => tag.toLowerCase().trim())
            };
        } catch (error) {
            console.error('Failed to parse AI response:', error);
            return null;
        }
    }
}

export class AIService {
    private providers: Map<AIProviderType, AIProvider> = new Map();

    constructor() {
        this.initializeProviders();
    }

    private initializeProviders() {
        this.providers.set('openai', new OpenAIProvider());
        this.providers.set('anthropic', new AnthropicProvider());
        this.providers.set('bedrock', new BedrockProvider());
        this.providers.set('custom', new CustomProvider());
    }

    async generateSuggestions(content: string, language: string, config: AIConfig): Promise<AISuggestions | null> {
        if (!config.apiKey || !content) {
            return null;
        }

        const provider = this.providers.get(config.provider);
        if (!provider) {
            throw new Error(`Unsupported AI provider: ${config.provider}`);
        }

        try {
            return await provider.generateSuggestions(content, language, config);
        } catch (error) {
            console.error(`AI suggestion error (${config.provider}):`, error);
            return null;
        }
    }

    async validateConfig(config: AIConfig): Promise<boolean> {
        if (!config.apiKey) {
            return false;
        }

        const provider = this.providers.get(config.provider);
        if (!provider) {
            return false;
        }

        try {
            return await provider.validateConfig(config);
        } catch (error) {
            console.error(`Config validation error (${config.provider}):`, error);
            return false;
        }
    }

    getAvailableProviders(): { id: AIProviderType; name: string }[] {
        return [
            { id: 'openai', name: 'OpenAI (ChatGPT)' },
            { id: 'anthropic', name: 'Anthropic (Claude)' },
            { id: 'bedrock', name: 'AWS Bedrock' },
            { id: 'custom', name: 'Custom OpenAI-Compatible API' }
        ];
    }

    // Legacy method for backward compatibility
    async generateSuggestionsLegacy(content: string, language: string, apiKey: string): Promise<AISuggestions | null> {
        return this.generateSuggestions(content, language, {
            provider: 'openai',
            apiKey: apiKey,
            model: 'gpt-3.5-turbo'
        });
    }

    // Legacy method for backward compatibility
    async isApiKeyValid(apiKey: string): Promise<boolean> {
        return this.validateConfig({
            provider: 'openai',
            apiKey: apiKey
        });
    }
}

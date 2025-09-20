import { OpenAI } from 'openai';

export interface AISuggestions {
    title: string;
    tags: string[];
}

export class AIService {
    async generateSuggestions(content: string, language: string, apiKey: string): Promise<AISuggestions | null> {
        if (!apiKey || !content) {
            return null;
        }

        try {
            const openai = new OpenAI({
                apiKey: apiKey
            });

            const prompt = this.buildPrompt(content, language);
            
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
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
            console.error('AI suggestion error:', error);
            return null;
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

    async isApiKeyValid(apiKey: string): Promise<boolean> {
        if (!apiKey) {
            return false;
        }

        try {
            const openai = new OpenAI({
                apiKey: apiKey
            });

            // Make a simple test request
            await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 1
            });

            return true;
        } catch (error) {
            return false;
        }
    }
}

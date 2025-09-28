# PromptVault - VS Code Extension

Personal Prompt Manager for locally managing and organizing AI prompts with intelligent tagging, categorization, and comprehensive multi-LLM AI integration.

> **🎉 Version 1.1.2**: Major AI enhancement release! Now features multi-provider AI support (OpenAI, Anthropic, AWS Bedrock, Custom), progressive settings UX, and all critical form issues fixed. Ready for production use with your favorite LLM!

## ✨ What's New in 1.1.2

### 🤖 **Multi-Provider AI Integration**
- **OpenAI (ChatGPT)**: GPT-3.5, GPT-4 support
- **Anthropic (Claude)**: Claude-3 models integration  
- **AWS Bedrock**: Enterprise foundation models
- **Custom APIs**: Local LLMs, Ollama, OpenAI-compatible endpoints
- **Smart Suggestions**: AI analyzes content and suggests titles/tags
- **Progressive Settings**: Clean UX that only shows relevant options

### 🔧 **Critical Fixes (All Previously Reported Issues)**
- ✅ **Save Button Fixed**: Add New Prompt save button works correctly
- ✅ **Content Input Enhanced**: Natural text entry (no more Shift+Enter restriction)
- ✅ **Edit Form Fixed**: Edit prompts now pre-populate correctly
- ✅ **Windows Compatible**: 100% confirmed cross-platform support

### 🎨 **Enhanced User Experience**
- **✨ AI Suggest Button**: One-click intelligent suggestions in forms
- **Progressive Disclosure**: AI settings appear only when enabled (OFF by default)
- **Rich Descriptions**: Settings include helpful links and examples
- **Better Error Messages**: Clear guidance and troubleshooting info

## 🚀 How to Use PromptVault

### 📍 **Finding PromptVault in VS Code**
After installation, PromptVault appears in your **Explorer panel** (left sidebar):
1. Look for the **"PROMPTVAULT"** section in Explorer (below your file tree)
2. If not visible, go to **View → Explorer** or press `Ctrl+Shift+E` (`Cmd+Shift+E` on Mac)
3. The PromptVault tree view will show all your saved prompts organized by tags

### 🎯 **3 Ways to Add Prompts**

#### Method 1: From Selected Text (Most Common)
1. **Select any text** in any VS Code file
2. **Right-click** → Choose **"Save to PromptVault"**
3. **Fill the form**: Title, tags, and content (pre-filled)
4. **Optional**: Click **"✨ AI Suggest"** for smart title/tag suggestions
5. **Click "Save Prompt"**

#### Method 2: From Tree View 
1. **Click the "+" button** in the PROMPTVAULT section header
2. **Enter content** in the form
3. **Optional**: Use **"✨ AI Suggest"** for intelligent suggestions
4. **Fill title and tags**, then **Save**

#### Method 2b: Quick Add Shortcut
1. **Press `Ctrl+Shift+A`** (`Cmd+Shift+A` on Mac) from anywhere
2. **Form opens** for creating a new prompt
3. **Enter content, title, and tags**
4. **Save** your new prompt

#### Method 3: Quick Keyboard Shortcut
1. **Select text** in any file
2. **Press `Ctrl+Shift+S`** (`Cmd+Shift+S` on Mac)
3. **Form opens** with selected text pre-filled
4. **Add title/tags** and save

> **Note**: If `Ctrl+Shift+S` doesn't work, try using the Command Palette (`Ctrl+Shift+P`) and search for "PromptVault: Save to PromptVault"

### 🔍 **Managing Your Prompts**

#### In the Tree View:
- **📁 Browse by tags**: Prompts are organized under tag folders
- **👀 Preview**: Click any prompt to view details in a panel
- **✏️ Edit**: Right-click prompt → "Edit" or click edit icon
- **📋 Copy**: Right-click prompt → "Copy to Clipboard"
- **🗑️ Delete**: Right-click prompt → "Delete"
- **🔍 Search**: Use the search icon in tree view header

#### Tree View Actions:
- **➕ Add New**: Click "+" button in header
- **🔄 Refresh**: Click refresh icon to reload
- **📤 Export**: Right-click in tree view → "Export Prompts"
- **📥 Import**: Right-click in tree view → "Import Prompts"

### 🤖 **Using AI Features (Optional)**

#### Enable AI:
1. **Open Settings**: `Ctrl+,` (`Cmd+,` on Mac)
2. **Search "PromptVault"**
3. **Toggle "Enable AI"** to ON
4. **Choose provider**: OpenAI, Anthropic, AWS Bedrock, or Custom
5. **Add API key** for your chosen provider

#### In Forms:
- **Click "✨ AI Suggest"** after entering content
- **AI analyzes** your text and suggests titles/tags
- **Accept or modify** suggestions as needed
- **Save** your prompt with AI-enhanced metadata

## ✅ Core Features

### Prompt Management ✅
- ✅ **Complete UI Interface**: No command dialogs - all operations in webview panels
- ✅ **Add/Edit Forms**: Rich interface with optional AI-powered suggestions
- ✅ **Detail Views**: Full prompt display with metadata and quick actions
- ✅ **Text Selection & Save**: Right-click any selected text to save as prompt
- ✅ **Tree View Organization**: Hierarchical display grouped by tags
- ✅ **Real-time Search**: Instant filtering with search-as-you-type
- ✅ **Import/Export**: Backup and share prompt collections
- ✅ **Keyboard Shortcuts**: `Ctrl+Shift+S` (Mac: `Cmd+Shift+S`) to save prompts

### AI Integration ✅
- ✅ **Smart Suggestions**: Multi-provider AI integration for title/tag generation
- ✅ **Provider Support**: OpenAI (ChatGPT), Anthropic (Claude), AWS Bedrock, Custom APIs
- ✅ **Context Awareness**: Analyzes code language and content for better suggestions
- ✅ **Flexible Configuration**: Choose your preferred AI provider and model
- ✅ **Fallback Mode**: Works perfectly without AI (manual input)

### Storage & Organization ✅
- ✅ **Local File Storage**: JSON-based storage in `.promptvault/` directory
- ✅ **Multiple Storage Modes**: Workspace, global, or custom path options
- ✅ **Cross-Platform**: Works on Windows, macOS, and Linux
- ✅ **Font Synchronization**: Automatic matching with VS Code editor fonts
- ✅ **Tag-Based System**: Organize prompts with flexible tagging

## 🚀 Quick Start

### 1. **Install & Locate**
- Install from VS Code Marketplace
- Find **"PROMPTVAULT"** in Explorer panel (left sidebar)

### 2. **Save Your First Prompt**
- Select any text → Right-click → "Save to PromptVault"
- Or use keyboard shortcut: `Ctrl+Shift+S` (`Cmd+Shift+S` on Mac)

### 3. **Manage in Tree View**
- Browse prompts by tags in Explorer panel
- Click prompts to view, right-click to edit/copy/delete

### 4. **Optional: Enable AI** 
- Settings → PromptVault → Enable AI → Choose provider → Add API key

## 🔧 Configuration Options

### AI Integration (New in 1.1.2)
- **Enable AI**: Toggle AI-powered suggestions on/off
- **AI Provider**: Choose from OpenAI, Anthropic, AWS Bedrock, or Custom API
- **API Keys**: Configure keys for your chosen provider(s)
  - `promptvault.openaiApiKey` - OpenAI API key
  - `promptvault.anthropicApiKey` - Anthropic API key  
  - `promptvault.awsAccessKey` - AWS access key for Bedrock
  - `promptvault.customAiApiKey` - Custom provider API key
- **AI Models**: Specify preferred models (optional, uses provider defaults)
- **Custom Endpoints**: Configure custom OpenAI-compatible APIs

### Storage & Behavior
- **Storage Location**: Choose workspace, global, or custom path
- **Default Tags**: Set default tags for new prompts
- **Auto-save**: Enable/disable automatic saving
- **Font Settings**: Match VS Code editor fonts

### Advanced Options
- **Max Prompts**: Limit total stored prompts
- **Export Format**: JSON structure preferences
- **AWS Region**: For Bedrock integration

## 🎯 AI Provider Examples

### OpenAI (ChatGPT)
```json
{
  "promptvault.enableAI": true,
  "promptvault.aiProvider": "openai",
  "promptvault.openaiApiKey": "sk-...",
  "promptvault.aiModel": "gpt-4"
}
```

### Anthropic (Claude)
```json
{
  "promptvault.enableAI": true,
  "promptvault.aiProvider": "anthropic", 
  "promptvault.anthropicApiKey": "sk-ant-...",
  "promptvault.aiModel": "claude-3-sonnet-20240229"
}
```

### Local LLM (Ollama)
```json
{
  "promptvault.enableAI": true,
  "promptvault.aiProvider": "custom",
  "promptvault.customAiEndpoint": "http://localhost:11434/v1",
  "promptvault.customAiApiKey": "",
  "promptvault.aiModel": "llama2"
}
```

## 🧪 Testing

The extension includes comprehensive testing covering all major functionality:

### Running Tests
```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Compile only
pnpm run compile
```

### Test Coverage
- ✅ Extension activation and command registration (22/23 tests passing)
- ✅ Prompt CRUD operations and data persistence
- ✅ AI service integration with multiple providers
- ✅ Search and filtering functionality
- ✅ Cross-platform compatibility
- ✅ Error handling and edge cases

## 🚀 Installation & Development

### Prerequisites
- Node.js 16+ 
- pnpm (recommended package manager)
- VS Code 1.74.0+

### Development Setup
```bash
# Clone repository
git clone https://github.com/pankajads/promptVault.git
cd promptVault

# Install dependencies
pnpm install

# Compile TypeScript
pnpm run compile

# Run tests
pnpm run test

# Package extension
pnpm run package
```

## 📁 Project Structure

```
PromptVault/
├── src/
│   ├── extension.ts          # Main extension activation
│   ├── promptManager.ts      # Data management
│   ├── promptTreeProvider.ts # Tree view provider
│   ├── promptWebviewProvider.ts # UI forms and panels
│   ├── aiService.ts          # Multi-provider AI integration
│   └── test/                 # Test suites
├── package.json              # Extension configuration
├── CHANGELOG.md              # Version history
└── README.md                 # This file
```

## 🔄 Migration from 1.0.2

**Zero-effort upgrade!** 
- ✅ All existing prompts remain unchanged
- ✅ All existing workflows continue to work
- ✅ New AI features are completely optional
- ✅ Previous settings are preserved

## 💡 Use Cases

- **Developers**: Save code snippets, debugging prompts, documentation templates
- **Writers**: Store article outlines, character descriptions, plot ideas
- **Researchers**: Organize research prompts, data analysis templates
- **AI Users**: Manage ChatGPT prompts, Claude conversations, custom instructions
- **Teams**: Share and backup prompt libraries across projects

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality  
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- **GitHub Repository**: [pankajads/promptVault](https://github.com/pankajads/promptVault)
- **VS Code Marketplace**: Search "PromptVault Manager"
- **Issues & Support**: [GitHub Issues](https://github.com/pankajads/promptVault/issues)

---

**Version 1.1.2** - The complete prompt management solution with multi-LLM AI integration! 🚀
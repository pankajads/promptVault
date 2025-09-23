# Changelog

All notable changes to the "PromptVault" extension will be documented in this file.

## [1.1.2] - 2025-09-21

### 🎉 Major Release: Complete AI Integration & Enhanced UX

This is a comprehensive update that transforms PromptVault from a basic prompt manager into a powerful, AI-enhanced productivity tool. This release consolidates all improvements and jumps from version 1.0.2 to 1.1.2.

### ✨ NEW FEATURES

#### 🤖 Multi-Provider AI Integration
- **AI-Powered Suggestions**: Get intelligent title and tag recommendations for your prompts
- **Multiple AI Providers Support**:
  - **OpenAI (ChatGPT)**: GPT-3.5 Turbo, GPT-4 support
  - **Anthropic (Claude)**: Claude-3 models integration  
  - **AWS Bedrock**: Enterprise foundation models framework
  - **Custom APIs**: Support for local LLMs, Ollama, and OpenAI-compatible endpoints
- **Smart Context Analysis**: AI analyzes your prompt content and programming language for better suggestions
- **Optional & Fallback**: Works perfectly without AI - completely optional feature

#### 🎨 Enhanced User Interface
- **✨ AI Suggest Button**: Added to both Add New Prompt and Edit Prompt forms
- **Progressive Settings UX**: Clean, conditional settings that only show relevant options
- **Rich Markdown Descriptions**: Settings include helpful links and examples
- **Loading States & Feedback**: Visual feedback during AI processing
- **Improved Error Messages**: Clear guidance when AI is unavailable

#### ⚙️ Advanced Configuration
- **Progressive Disclosure**: AI settings only appear when enabled (AI OFF by default)
- **Provider-Specific Options**: Only relevant settings show for selected AI provider
- **Smart Defaults**: Clean initial experience with sensible provider defaults
- **Organized Categories**: 
  - "AI Integration" - All AI-related settings
  - "Storage & Behavior" - Storage and functional settings

### 🔧 CRITICAL FIXES (Previously Reported Issues)

#### Form Functionality
- **✅ Save Button Fixed**: "Add New Prompt" save button now works correctly
- **✅ Content Input Enhanced**: Removed restrictive Enter key behavior, natural text input
- **✅ Edit Prompt Fixed**: Edit now properly pre-populates form instead of showing blank add form
- **✅ Form Validation**: Better error handling and user feedback

#### Cross-Platform Compatibility  
- **✅ Windows Support Confirmed**: 100% compatible with Windows machines
- **✅ Cross-Platform File Operations**: Robust path handling for all operating systems
- **✅ Universal Font Support**: Font synchronization works across platforms

### 🚀 IMPROVEMENTS

#### Developer Experience
- **Enhanced Testing**: Comprehensive test suite with 22/23 tests passing
- **Better Error Handling**: Graceful fallbacks and detailed logging
- **Code Organization**: Clean architecture with provider interfaces
- **Legacy Compatibility**: Existing prompts and workflows remain unchanged

#### Performance & Reliability
- **Real-time Font Sync**: PromptVault webviews automatically match VS Code editor fonts
- **Improved Tree View**: Enhanced stability and unique ID generation
- **Better Resource Management**: Proper disposal of webview providers and listeners

### 📋 CORE FEATURES (Established)

#### Prompt Management
- Save selected text as prompts with right-click context menu
- Tree view for organizing prompts by tags in Explorer panel
- Search and filter functionality across titles, content, and tags
- Import/Export capabilities for backup and sharing
- Local JSON file storage in `.promptvault/` directory

#### User Interface
- Native VS Code integration with tree view
- Webview panels for prompt viewing and editing
- Keyboard shortcuts (Ctrl+Shift+S / Cmd+Shift+S to save prompt)
- Context menu support for quick actions

#### Storage & Organization
- Tag-based categorization system
- Multiple storage modes (workspace, global, custom)
- Cross-workspace compatibility
- Configurable storage paths and limits

### 🔒 SECURITY & PRIVACY
- **Local-First**: All prompts stored locally by default
- **Secure API Keys**: API keys stored in VS Code's secure settings
- **Optional External**: No data sent to external services without explicit AI usage
- **Data Control**: Users maintain full control over their prompt data

### ⚙️ CONFIGURATION OPTIONS

```json
{
  // AI Integration (New in 1.1.2)
  "promptvault.enableAI": false,
  "promptvault.aiProvider": "openai|anthropic|bedrock|custom", 
  "promptvault.openaiApiKey": "",
  "promptvault.anthropicApiKey": "",
  "promptvault.awsRegion": "us-east-1",
  "promptvault.awsAccessKey": "",
  "promptvault.customAiEndpoint": "",
  "promptvault.customAiApiKey": "",
  "promptvault.aiModel": "",
  
  // Storage & Behavior
  "promptvault.defaultTags": ["general"],
  "promptvault.autoSave": true,
  "promptvault.maxPrompts": 1000,
  "promptvault.storageMode": "workspace|global|custom",
  "promptvault.storagePath": "",
  "promptvault.useEditorFont": true,
  "promptvault.fontSizeMultiplier": 1.0
}
```

### 🚀 MIGRATION FROM 1.0.2

**Zero-effort upgrade!**
- ✅ All existing prompts remain unchanged
- ✅ All existing workflows continue to work  
- ✅ New AI features are completely optional
- ✅ Previous settings are preserved
- ✅ No data loss or breaking changes

### 📊 TESTING & VALIDATION
- ✅ Comprehensive test suite (22/23 tests passing)
- ✅ Cross-platform compatibility verified (macOS, Windows, Linux)
- ✅ AI integration tested with multiple providers
- ✅ Backward compatibility confirmed
- ✅ Performance optimization validated

### 🎯 USER BENEFITS

1. **⚡ Faster Workflow**: AI suggests titles and tags instantly
2. **🎯 Better Organization**: Intelligent tag suggestions improve categorization
3. **🔀 Flexible AI**: Choose your preferred LLM provider or use none at all
4. **✨ Enhanced UX**: Streamlined interface with progressive disclosure
5. **🔒 Privacy-First**: Local storage with optional external AI

---

## [1.0.2] - 2025-09-20 (Previous Stable)

### Features
- Basic prompt management functionality
- Local storage and organization  
- Simple add/edit/delete operations
- Tree view navigation
- Search and filtering
- Import/Export capabilities

### Known Issues (Fixed in 1.1.2)
- Save button not working in Add New Prompt
- Content input restrictions (Shift+Enter required)
- Edit prompt showing blank form instead of pre-populated data

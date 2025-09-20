# Change Log

All notable changes to the "PromptVault" extension will be documented in this file.

## [1.0.0] - 2025-09-20

### Added
- Initial release of PromptVault
- Save selected text as prompts with right-click context menu
- Tree view for organizing prompts by tags
- AI-powered title and tag suggestions (optional)
- Local file storage using JSON
- Search and filter functionality
- Import/Export capabilities
- Keyboard shortcuts (Ctrl+Shift+S to save prompt)
- Integration with VS Code editor
- Support for multiple programming languages
- Prompt preview with syntax highlighting
- Tag-based organization system

### Features
- **Core Functionality**
  - Save any selected text as a prompt
  - Organize prompts in hierarchical tree structure
  - Tag-based categorization
  - Search across titles, content, and tags
  
- **AI Integration**
  - Optional OpenAI integration for smart suggestions
  - Automatic title generation
  - Intelligent tag recommendations
  
- **Storage & Management**
  - Local JSON file storage
  - Import/Export functionality
  - Backup and restore capabilities
  - Cross-workspace compatibility

- **User Experience**
  - Native VS Code integration
  - Context menu support
  - Keyboard shortcuts
  - Webview panels for prompt viewing
  - Tree view for navigation

### Technical Details
- Built with TypeScript
- Uses VS Code Extension API
- Supports VS Code 1.74.0+
- Local storage in `.promptvault/` directory
- Optional OpenAI API integration

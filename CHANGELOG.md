# Change Log

All notable changes to the "PromptVault" extension will be documented in this file.

## [1.2.2] - 2025-11-22

### 🐛 Bug Fixes
- **Multiple Windows Issue**: Fixed critical bug where selecting a prompt from the tree view opened multiple windows instead of just one
- **Event Handler Cleanup**: Removed duplicate event handling that caused the same prompt to open twice simultaneously
- **Tree View Behavior**: Improved tree view selection behavior to be more predictable and responsive

### Technical
- **Event Architecture**: Centralized prompt opening logic to use only the selection listener, removing redundant command properties from tree items
- **Code Cleanup**: Simplified tree item creation by removing unnecessary command properties that were causing duplicate calls
- **Performance**: Reduced overhead by eliminating duplicate event processing when selecting prompts

## [1.2.1] - 2025-09-27

### 🐛 Critical Fixes
- **Tree View Duplicate IDs**: Fixed the fundamental issue where prompts appearing under multiple tags caused "Element with id already registered" errors
- **Multi-Tag Support**: Properly implemented reference-based tree structure where the same prompt can appear under multiple tag groups without ID conflicts
- **Stable Tree Items**: Each tree item now has a unique ID combining tag context and prompt UUID (e.g., `prompt-javascript-uuid123`)
- **Save/Edit Operations**: Fixed duplicate ID errors that occurred when saving or editing prompts

### Technical
- **Proper Architecture**: Implemented the correct tree view pattern where prompts are referenced by UUID under multiple tag nodes
- **UUID-Based IDs**: Ensured all prompt IDs use UUIDs for true uniqueness
- **Tag-Scoped Tree Items**: Tree item IDs now include tag context to prevent conflicts when same prompt appears under multiple tags

## [1.2.0] - 2025-09-27

### ✨ Major Features
- **Rich HTML Forms**: Replaced simple input boxes with beautiful, interactive HTML forms for adding and editing prompts
- **Modern Web UI**: Clean, responsive forms with VS Code theme integration and proper styling
- **AI Integration**: Built-in AI suggestion button directly in the form interface
- **Code Organization**: Separated HTML, CSS, and JavaScript into dedicated files for better maintainability

### Improved
- **User Experience**: Professional-looking forms with proper validation and feedback
- **Developer Experience**: Cleaner codebase with separated concerns (HTML templates, CSS styles, JS logic)
- **Accessibility**: Proper form labels, keyboard navigation, and focus management
- **Consistency**: Both add and edit operations now use the same rich form interface

### Added
- HTML template system with placeholder replacement
- Dedicated CSS files for form styling
- JavaScript modules for form logic and interactions
- Resource URI handling for webview assets
- Form configuration injection for edit mode
- Comprehensive error handling for form operations

### Technical
- Template-based HTML generation with proper escaping
- Webview resource management and security
- Message passing between extension and webview
- AI service integration with form interface

## [1.1.4] - 2025-09-27

### Improved
- **Tree View Tooltips**: Enhanced hover tooltips with rich content preview, tags, and metadata
- **Tooltip Performance**: Optimized tooltip generation for faster hover response
- **User Experience**: Added markdown-formatted tooltips showing prompt content, language, source, and update date
- **Configuration**: Added `promptvault.showRichTooltips` setting to control tooltip richness

### Fixed
- **Hover Delay**: Improved tooltip responsiveness by pre-computing tooltip data
- **Information Density**: Tooltips now show useful information instead of just the title

### Added
- Rich markdown tooltips for prompt items with content preview
- Simple count tooltips for tag groups
- Configuration option to enable/disable rich tooltips
- Better visual feedback on hover

## [1.1.3] - 2025-09-27

### Changed
- **Default Storage Location**: Changed default storage from workspace to VS Code extension profile folder
- **Global Storage**: Prompts now persist across different workspaces by default
- **Storage Configuration**: Reordered storage options to prioritize global storage (recommended)

### Improved
- **User Experience**: Prompts are now available across all VS Code instances and workspaces
- **Data Persistence**: Better data management using VS Code's global storage system
- **Configuration**: Clearer descriptions for storage mode options

### Technical
- Updated `PromptManager.getStoragePath()` to default to global storage
- Modified storage mode priority: custom > workspace > global (default)
- Enhanced storage configuration with better descriptions and enum ordering

## [1.0.6] - 2025-09-27

### Improved
- **Code Quality**: Refactored `PromptInput` interface to use TypeScript `Omit` utility type
- **Type Safety**: Eliminated duplicate property definitions between `Prompt` and `PromptInput`
- **AI Service**: Fixed AI configuration to use proper `AIConfig` object structure
- **Maintainability**: Single source of truth for prompt properties reduces maintenance overhead

### Technical
- Replaced `PromptInput` interface with `Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>`
- Updated AI service calls to use structured configuration objects
- Improved TypeScript type safety and compile-time validation

## [1.0.5] - 2025-09-20

### Fixed
- **Command Registration**: Fixed extension activation issues that prevented commands from being registered
- **Extension ID Reference**: Fixed incorrect extension ID reference in webview resource loading
- **Error Handling**: Added better error handling and logging during extension activation
- **Tree View Commands**: All tree view commands (Add Prompt, Edit, Delete, etc.) now work correctly

### Improved
- Enhanced extension activation reliability
- Better error messages for debugging activation issues

## [1.0.3] - 2025-09-20

### Fixed
- **Tree View Visibility**: Removed conditional visibility requirement for the PromptVault tree view in Explorer panel
- **User Experience**: Tree view now appears for all users immediately upon installation from VS Code Marketplace
- **Package Configuration**: Fixed `package.json` views configuration to ensure consistent tree view display

### Changed
- Improved extension activation and tree view registration for better marketplace compatibility

## [1.0.2] - 2025-09-20

### Fixed
- **Tree View Visibility**: Removed conditional visibility requirement for the PromptVault tree view in Explorer panel
- **User Experience**: Tree view now appears for all users immediately upon installation from VS Code Marketplace
- **Package Configuration**: Fixed `package.json` views configuration to ensure consistent tree view display

### Changed
- Improved extension activation and tree view registration for better marketplace compatibility

## [1.0.1] - 2025-09-20

### Fixed
- Updated publisher configuration and repository URLs
- Marketplace publishing configuration improvements

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

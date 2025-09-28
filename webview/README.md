# Webview Resources

This folder contains the separated HTML, CSS, and JavaScript files for the PromptVault extension's webview components.

## Structure

```
webview/
├── html/           # HTML templates
│   ├── main.html          # Main prompt list view template
│   └── add-form.html      # Add/Edit prompt form template
├── css/            # Stylesheets
│   ├── main.css           # Styles for main prompt list view
│   └── add-form.css       # Styles for add/edit form
├── js/             # JavaScript files
│   ├── main.js            # Logic for main prompt list view
│   └── add-form.js        # Logic for add/edit form
└── README.md       # This file
```

## Templates

HTML templates use placeholder syntax (`{{PLACEHOLDER}}`) that gets replaced by the TypeScript code:

### main.html placeholders:
- `{{CSS_PATH}}` - CSS file URI
- `{{JS_PATH}}` - JavaScript file URI

### add-form.html placeholders:
- `{{TITLE}}` - Page title (Add/Edit)
- `{{FORM_TITLE}}` - Form heading
- `{{TITLE_VALUE}}` - Pre-filled title value
- `{{TAGS_VALUE}}` - Pre-filled tags value
- `{{CONTENT_VALUE}}` - Pre-filled content value
- `{{SUBMIT_BUTTON}}` - Submit button text (Save/Update)
- `{{CSS_PATH}}` - CSS file URI
- `{{JS_PATH}}` - JavaScript file URI
- `{{IS_EDITING}}` - Boolean flag for edit mode
- `{{EDIT_DATA}}` - JSON data for editing

## Benefits of Separation

1. **Better Organization** - Separate concerns (HTML structure, CSS styling, JS logic)
2. **Easier Maintenance** - Edit files independently without complex string escaping
3. **Improved Development Experience** - Syntax highlighting, code completion, and linting
4. **Reusability** - Templates can be shared or extended more easily
5. **Version Control** - Cleaner diffs when making changes to individual files

## Usage

The `PromptWebviewProvider` class loads these templates and replaces placeholders with actual values at runtime.
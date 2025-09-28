const vscode = acquireVsCodeApi();

// Initialize form
document.addEventListener('DOMContentLoaded', function() {
    const contentDiv = document.getElementById('content');
    const titleInput = document.getElementById('title');
    
    // Focus on title if empty, otherwise focus on content
    if (!titleInput.value.trim()) {
        titleInput.focus();
    } else {
        contentDiv.focus();
        // Place cursor at end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(contentDiv);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }
});

// Form submission
document.getElementById('promptForm').addEventListener('submit', function(e) {
    e.preventDefault();
    savePrompt();
});

function savePrompt() {
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').textContent.trim();
    const tagsInput = document.getElementById('tags').value.trim();
    
    if (!title) {
        alert('Please enter a title');
        return;
    }
    
    if (!content) {
        alert('Please enter content');
        return;
    }
    
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    const messageData = {
        type: window.formConfig.isEditing ? 'updatePrompt' : 'savePrompt',
        title: title,
        content: content,
        tags: tags
    };
    
    if (window.formConfig.isEditing && window.formConfig.editData?.id) {
        messageData.id = window.formConfig.editData.id;
    }
    
    vscode.postMessage(messageData);
}

function cancelForm() {
    vscode.postMessage({
        type: 'cancel'
    });
}

function getAISuggestions() {
    const content = document.getElementById('content').textContent.trim();
    
    if (!content) {
        alert('Please enter some content first');
        return;
    }
    
    const btn = document.getElementById('aiSuggestBtn');
    const loading = document.getElementById('aiLoading');
    
    // Show loading state
    btn.disabled = true;
    loading.classList.add('show');
    
    vscode.postMessage({
        type: 'getAISuggestions',
        content: content,
        language: 'general'
    });
}

// Listen for AI suggestions response
window.addEventListener('message', event => {
    const message = event.data;
    
    if (message.type === 'aiSuggestions') {
        const btn = document.getElementById('aiSuggestBtn');
        const loading = document.getElementById('aiLoading');
        
        // Hide loading state
        btn.disabled = false;
        loading.classList.remove('show');
        
        if (message.suggestions) {
            const titleInput = document.getElementById('title');
            const tagsInput = document.getElementById('tags');
            
            // Only update if fields are empty or user confirms
            if (!titleInput.value || confirm('Replace current title with AI suggestion?')) {
                titleInput.value = message.suggestions.title;
            }
            
            if (!tagsInput.value || confirm('Replace current tags with AI suggestions?')) {
                tagsInput.value = message.suggestions.tags.join(', ');
            }
        } else {
            alert('AI suggestions are not available.\n\nTo enable AI suggestions:\n1. Open VS Code Settings\n2. Search for "PromptVault"\n3. Enable "Enable AI"\n4. Choose your AI provider\n5. Add your API key');
        }
    }
});
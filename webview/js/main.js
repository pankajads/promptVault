const vscode = acquireVsCodeApi();
let allPrompts = [];

// Request initial data
vscode.postMessage({ type: 'getPrompts' });

// Listen for messages from extension
window.addEventListener('message', event => {
    const message = event.data;
    
    switch (message.type) {
        case 'promptsData':
            allPrompts = message.data;
            renderPrompts(allPrompts);
            break;
    }
});

// Search functionality
document.getElementById('searchBox').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredPrompts = allPrompts.filter(prompt => 
        prompt.title.toLowerCase().includes(searchTerm) ||
        prompt.content.toLowerCase().includes(searchTerm) ||
        prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
    renderPrompts(filteredPrompts);
});

function renderPrompts(prompts) {
    const promptList = document.getElementById('promptList');
    
    if (prompts.length === 0) {
        promptList.innerHTML = '<div class="empty-state">No prompts found</div>';
        return;
    }
    
    const promptsHtml = prompts.map(prompt => {
        const tagsHtml = prompt.tags.map(tag => '<span class="tag">' + escapeHtml(tag) + '</span>').join('');
        const preview = prompt.content.substring(0, 150) + (prompt.content.length > 150 ? '...' : '');
        const date = new Date(prompt.updatedAt).toLocaleDateString();
        
        return '<div class="prompt-item" onclick="openPrompt(' + "'" + prompt.id + "'" + ')">' +
            '<div class="prompt-title">' + escapeHtml(prompt.title) + '</div>' +
            '<div class="prompt-tags">' + tagsHtml + '</div>' +
            '<div class="prompt-preview">' + escapeHtml(preview) + '</div>' +
            '<div class="prompt-meta">' +
                '<span>' + date + '</span>' +
                '<div class="prompt-actions">' +
                    '<button class="action-button" onclick="event.stopPropagation(); copyPrompt(' + "'" + prompt.id + "'" + ')">Copy</button>' +
                    '<button class="action-button" onclick="event.stopPropagation(); deletePrompt(' + "'" + prompt.id + "'" + ')">Delete</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    }).join('');
    
    promptList.innerHTML = promptsHtml;
}

function openPrompt(promptId) {
    vscode.postMessage({
        type: 'openPrompt',
        promptId: promptId
    });
}

function copyPrompt(promptId) {
    vscode.postMessage({
        type: 'copyPrompt',
        promptId: promptId
    });
}

function deletePrompt(promptId) {
    if (confirm('Are you sure you want to delete this prompt?')) {
        vscode.postMessage({
            type: 'deletePrompt',
            promptId: promptId
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
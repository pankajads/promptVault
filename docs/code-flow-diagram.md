# PromptVault Extension Code Flow

## Main Extension Flow

```mermaid
flowchart TD
    A[VS Code Starts] --> B[Extension Activation]
    B --> C{Activation Success?}
    C -->|No| D[Show Error Message]
    C -->|Yes| E[Initialize Services]
    
    E --> F[Initialize PromptManager]
    F --> G[Initialize AIService]
    G --> H[Initialize PromptTreeProvider]
    H --> I[Initialize PromptWebviewProvider]
    
    I --> J[Create Tree View]
    J --> K[Set Context Variables]
    K --> L[Register Commands]
    L --> M[Register Webview Provider]
    M --> N[Add Disposables to Context]
    N --> O[Setup Tree View Listeners]
    O --> P[Extension Ready]
    
    P --> Q[Show Success Message]
```

## Command Registration Flow

```mermaid
flowchart TD
    A[Register Commands] --> B[savePrompt Command]
    A --> C[openPanel Command]
    A --> D[refreshTree Command]
    A --> E[addPrompt Command]
    A --> F[editPrompt Command]
    A --> G[deletePrompt Command]
    A --> H[copyPrompt Command]
    A --> I[exportPrompts Command]
    A --> J[importPrompts Command]
    A --> K[searchPrompts Command]
    A --> L[openPrompt Command]
    
    B --> M[Command Available in VS Code]
    C --> M
    D --> M
    E --> M
    F --> M
    G --> M
    H --> M
    I --> M
    J --> M
    K --> M
    L --> M
```

## Save Selected Prompt Flow

```mermaid
flowchart TD
    A[User Executes savePrompt] --> B{Active Editor?}
    B -->|No| C[Show Error: No Editor]
    B -->|Yes| D{Text Selected?}
    D -->|No| E[Show Error: No Selection]
    D -->|Yes| F[Get Selected Text]
    
    F --> G[Get Language & File Path]
    G --> H{AI Enabled?}
    H -->|Yes| I{API Key Configured?}
    I -->|Yes| J[Generate AI Suggestions]
    I -->|No| K[Skip AI Suggestions]
    H -->|No| K
    
    J --> L[Show Input Dialog]
    K --> L
    L --> M{User Confirms?}
    M -->|No| N[Cancel Operation]
    M -->|Yes| O[Save Prompt to Storage]
    
    O --> P[Show Success Message]
    P --> Q[Refresh Tree View]
```

## Add New Prompt Flow

```mermaid
flowchart TD
    A[User Clicks Add Prompt] --> B[Show Title Input Dialog]
    B --> C{Title Entered?}
    C -->|No| D[Cancel Operation]
    C -->|Yes| E[Show Tags Input Dialog]
    
    E --> F[Show Content Input Dialog]
    F --> G{Content Entered?}
    G -->|No| D
    G -->|Yes| H[Create Prompt Object]
    
    H --> I[Save to PromptManager]
    I --> J[Show Success Message]
    J --> K[Refresh Tree View]
```

## Tree View Interaction Flow

```mermaid
flowchart TD
    A[Tree View Loaded] --> B[PromptTreeProvider.getChildren()]
    B --> C[PromptManager.getAllPrompts()]
    C --> D[Return Prompt Items]
    
    D --> E[User Clicks Tree Item]
    E --> F{Item Type?}
    F -->|Prompt| G[Open Prompt in Panel]
    F -->|Category| H[Expand/Collapse]
    
    G --> I[Create Webview Panel]
    I --> J[Display Prompt Content]
    
    K[User Right-clicks Item] --> L[Show Context Menu]
    L --> M{Menu Action?}
    M -->|Edit| N[editPrompt Command]
    M -->|Delete| O[deletePrompt Command] 
    M -->|Copy| P[copyPrompt Command]
    
    N --> Q[Show Edit Dialog]
    O --> R[Show Confirmation Dialog]
    P --> S[Copy to Clipboard]
```

## Search Prompts Flow

```mermaid
flowchart TD
    A[User Executes Search] --> B[Show Search Input]
    B --> C{Search Term Entered?}
    C -->|No| D[Cancel Search]
    C -->|Yes| E[PromptManager.searchPrompts()]
    
    E --> F{Results Found?}
    F -->|No| G[Show No Results Message]
    F -->|Yes| H[Show Quick Pick List]
    
    H --> I{User Selects Prompt?}
    I -->|No| J[Cancel Selection]
    I -->|Yes| K[Open Selected Prompt]
    K --> L[Display in Webview Panel]
```

## Export/Import Flow

```mermaid
flowchart TD
    A[Export Command] --> B[Show Save Dialog]
    B --> C{File Path Selected?}
    C -->|No| D[Cancel Export]
    C -->|Yes| E[PromptManager.exportPrompts()]
    E --> F[Write JSON File]
    F --> G[Show Success Message]
    
    H[Import Command] --> I[Show Open Dialog]
    I --> J{File Selected?}
    J -->|No| K[Cancel Import]
    J -->|Yes| L[PromptManager.importPrompts()]
    L --> M[Read & Parse JSON]
    M --> N[Save Prompts to Storage]
    N --> O[Show Import Count]
    O --> P[Refresh Tree View]
```

## Error Handling Flow

```mermaid
flowchart TD
    A[Any Operation] --> B{Try Block}
    B -->|Success| C[Continue Normal Flow]
    B -->|Error| D[Catch Block]
    
    D --> E[Log Error to Console]
    E --> F[Show Error Message to User]
    F --> G[Graceful Degradation]
    
    H[Extension Activation] --> I{Activation Error?}
    I -->|Yes| J[Log Detailed Error]
    J --> K[Show Error Notification]
    K --> L[Re-throw Error]
    I -->|No| M[Continue Normal Activation]
```

## Service Dependencies

```mermaid
flowchart TD
    A[Extension Context] --> B[PromptManager]
    B --> C[Local Storage Management]
    
    D[PromptManager] --> E[PromptTreeProvider]
    E --> F[Tree View Display]
    
    G[Extension Context] --> H[PromptWebviewProvider]
    H --> I[Webview Panels]
    
    J[AIService] --> K[OpenAI Integration]
    K --> L[Prompt Suggestions]
    
    M[All Services] --> N[Command Handlers]
    N --> O[User Interactions]
```

## Key Components Interaction

```mermaid
flowchart LR
    A[VS Code Extension Host] --> B[extension.ts]
    B --> C[PromptManager]
    B --> D[PromptTreeProvider] 
    B --> E[PromptWebviewProvider]
    B --> F[AIService]
    
    C --> G[Local File System]
    D --> H[Tree View UI]
    E --> I[Webview Panels]
    F --> J[OpenAI API]
    
    H --> K[User Commands]
    I --> K
    K --> B
```

## Activation Sequence

```mermaid
sequenceDiagram
    participant VSCode
    participant Extension
    participant PromptManager
    participant TreeProvider
    participant WebviewProvider
    participant AIService
    
    VSCode->>Extension: activate()
    Extension->>PromptManager: new PromptManager(context)
    Extension->>AIService: new AIService()
    Extension->>TreeProvider: new PromptTreeProvider(promptManager)
    Extension->>WebviewProvider: new PromptWebviewProvider(context, promptManager)
    Extension->>VSCode: createTreeView()
    Extension->>VSCode: registerCommand() x11
    Extension->>VSCode: registerWebviewViewProvider()
    Extension->>VSCode: Extension Ready
```

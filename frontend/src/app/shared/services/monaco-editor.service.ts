import { Injectable, NgZone } from '@angular/core';
import loader from '@monaco-editor/loader';
import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';
import { BehaviorSubject } from 'rxjs';

/**
 * Service for managing Monaco Editor instances and configuration.
 * Optimized for performance with single initialization and proper error handling.
 */
@Injectable({
    providedIn: 'root',
})
export class MonacoEditorService {
    /** Whether Monaco has been initialized */
    private initialized = false;
    
    /** Subject tracking initialization completion */
    private initializationComplete$ = new BehaviorSubject<boolean>(false);
    
    /** Set of active editor instances for cleanup */
    private activeEditors = new Set<editor.IStandaloneCodeEditor>();
    
    /** Whether language features have been registered */
    private languageFeaturesRegistered = false;
    
    /** Store for completion provider disposables */
    private disposables: monaco.IDisposable[] = [];

    constructor(private ngZone: NgZone) {
        // Use CDN for Monaco Editor to avoid asset copying issues
        loader.config({
            'vs/nls': {
                availableLanguages: {
                    '*': 'en'
                }
            }
        });
        
        // Set the Monaco paths directly
        (window as any).MonacoEnvironment = {
            getWorkerUrl: function (moduleId: any, label: string) {
                if (label === 'json') {
                    return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/language/json/json.worker.js';
                }
                if (label === 'css' || label === 'scss' || label === 'less') {
                    return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/language/css/css.worker.js';
                }
                if (label === 'html' || label === 'handlebars' || label === 'razor') {
                    return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/language/html/html.worker.js';
                }
                if (label === 'typescript' || label === 'javascript') {
                    return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/language/typescript/ts.worker.js';
                }
                return 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/editor/editor.worker.js';
            }
        };
    }

    /**
     * Initializes Monaco Editor with default configuration (called only once)
     * @returns Promise that resolves when initialization is complete
     */
    async initMonaco(): Promise<void> {
        if (this.initialized) {
            return this.waitForInitialization();
        }

        try {
            this.initialized = true;
            
            // Configure Monaco loader paths
            loader.config({
                paths: {
                    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs',
                },
            });
            
            // Load Monaco only once
            await loader.init();

            // Configure defaults once
            this.configureDefaults();
            
            // Setup SQL language features once
            this.setupSQLLanguageFeatures();

            this.initializationComplete$.next(true);
        } catch (error) {
            this.initialized = false;
            this.initializationComplete$.next(false);
            console.error('Failed to initialize Monaco Editor:', error);
            throw error;
        }
    }

    /**
     * Waits for Monaco initialization to complete
     * @returns Promise that resolves when Monaco is ready
     */
    private waitForInitialization(): Promise<void> {
        if (this.initializationComplete$.value) {
            return Promise.resolve();
        }
        
        return new Promise((resolve, reject) => {
            const subscription = this.initializationComplete$.subscribe((initialized) => {
                if (initialized) {
                    subscription.unsubscribe();
                    resolve();
                }
            });
            
            // Timeout after 30 seconds
            setTimeout(() => {
                subscription.unsubscribe();
                reject(new Error('Monaco Editor initialization timeout'));
            }, 30000);
        });
    }

    /**
     * Configures default Monaco Editor themes and settings (called only once)
     */
    private configureDefaults(): void {
        try {
            // Define custom themes
            monaco.editor.defineTheme('sqlLearnerLight', {
                base: 'vs',
                inherit: true,
                rules: [
                    { token: 'keyword.sql', foreground: '0066cc', fontStyle: 'bold' },
                    { token: 'string.sql', foreground: '008800' },
                    { token: 'comment.sql', foreground: '999999', fontStyle: 'italic' },
                ],
                colors: {
                    'editor.background': '#ffffff',
                    'editor.lineHighlightBackground': '#f8f8f8',
                    'editorCursor.foreground': '#333333',
                    'editor.selectionBackground': '#b3d4fc',
                },
            });

            monaco.editor.defineTheme('sqlLearnerDark', {
                base: 'vs-dark',
                inherit: true,
                rules: [
                    { token: 'keyword.sql', foreground: '569cd6', fontStyle: 'bold' },
                    { token: 'string.sql', foreground: 'ce9178' },
                    { token: 'comment.sql', foreground: '6a9955', fontStyle: 'italic' },
                ],
                colors: {
                    'editor.background': '#1e1e1e',
                    'editor.lineHighlightBackground': '#2a2a2a',
                    'editorCursor.foreground': '#ffffff',
                    'editor.selectionBackground': '#264f78',
                },
            });
        } catch (error) {
            console.warn('Failed to configure Monaco themes:', error);
        }
    }

    /**
     * Gets optimized editor options with performance improvements
     * @param customOptions Custom options to override defaults
     * @returns Complete editor configuration
     */
    getEditorOptions(
        customOptions: Partial<editor.IStandaloneEditorConstructionOptions> = {},
    ): editor.IStandaloneEditorConstructionOptions {
        const defaultOptions: editor.IStandaloneEditorConstructionOptions = {
            language: 'sql',
            theme: 'sqlLearnerLight',
            
            // Performance optimizations
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            
            // Visual improvements
            lineNumbers: 'on',
            roundedSelection: true,
            fontSize: 14,
            fontFamily: 'Consolas, "Courier New", monospace',
            
            // Reduced suggestion frequency for better performance
            quickSuggestions: {
                other: false,  // Reduced from true
                comments: false,
                strings: false, // Reduced from true
            },
            
            // Optimized suggestions
            suggestOnTriggerCharacters: true,
            tabCompletion: 'on',
            suggest: {
                localityBonus: true,
                snippetsPreventQuickSuggestions: false,
                showIcons: true,
                filterGraceful: true,
                insertMode: 'insert',
            },
            
            // Disable resource-heavy features
            formatOnType: false, // Disabled for performance
            formatOnPaste: false, // Disabled for performance
            
            // Essential features only
            wordWrap: 'on',
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: 'always',
            matchBrackets: 'always',
            
            // Error handling
            glyphMargin: false,
            folding: false, // Disable for simpler UI
            renderLineHighlight: 'line',
        };

        return { ...defaultOptions, ...customOptions };
    }

    /**
     * Creates a new Monaco Editor instance with optimized configuration
     * @param element DOM element to attach the editor to
     * @param initialValue Initial content
     * @param customOptions Custom editor options
     * @returns Promise that resolves to the created editor instance
     */
    async createEditor(
        element: HTMLElement,
        initialValue: string = '',
        customOptions: Partial<editor.IStandaloneEditorConstructionOptions> = {},
    ): Promise<editor.IStandaloneCodeEditor> {
        if (!element) {
            throw new Error('Invalid element reference provided to create editor');
        }

        await this.waitForInitialization();

        return this.ngZone.run(() => {
            try {
                const options = this.getEditorOptions({ 
                    ...customOptions, 
                    value: initialValue 
                });
                
                const editorInstance = monaco.editor.create(element, options);
                this.activeEditors.add(editorInstance);

                // Setup disposal with error handling
                editorInstance.onDidDispose(() => {
                    try {
                        this.activeEditors.delete(editorInstance);
                    } catch (error) {
                        console.warn('Error during editor disposal:', error);
                    }
                });

                return editorInstance;
            } catch (error) {
                console.error('Failed to create Monaco editor:', error);
                throw error;
            }
        });
    }

    /**
     * Sets up SQL language features with proper error handling (called only once)
     */
    private setupSQLLanguageFeatures(): void {
        if (this.languageFeaturesRegistered) {
            return;
        }

        try {
            // Register completion provider with proper structure
            const completionProvider = monaco.languages.registerCompletionItemProvider('sql', {
                provideCompletionItems: (model, position) => {
                    try {
                        const word = model.getWordUntilPosition(position);
                        const range = new monaco.Range(
                            position.lineNumber,
                            word.startColumn,
                            position.lineNumber,
                            word.endColumn,
                        );
                        
                        return {
                            suggestions: this.getSQLSuggestions(range),
                        };
                    } catch (error) {
                        console.warn('Error providing completions:', error);
                        return { suggestions: [] };
                    }
                },
                triggerCharacters: [' ', '.'],
            });

            // Register hover provider with error handling
            const hoverProvider = monaco.languages.registerHoverProvider('sql', {
                provideHover: (model, position) => {
                    try {
                        const word = model.getWordAtPosition(position);
                        if (!word) return null;

                        return {
                            range: new monaco.Range(
                                position.lineNumber,
                                word.startColumn,
                                position.lineNumber,
                                word.endColumn,
                            ),
                            contents: [
                                { value: `**${word.word}**` },
                                { value: this.getSQLKeywordDescription(word.word) },
                            ],
                        };
                    } catch (error) {
                        console.warn('Error providing hover:', error);
                        return null;
                    }
                },
            });

            this.disposables.push(completionProvider, hoverProvider);
            this.languageFeaturesRegistered = true;
        } catch (error) {
            console.error('Failed to setup SQL language features:', error);
        }
    }

    /**
     * Generates SQL completion suggestions with proper structure
     * @param range Text range for the suggestion
     * @returns Array of completion items
     */
    private getSQLSuggestions(range: monaco.Range): monaco.languages.CompletionItem[] {
        const keywords = [
            'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE',
            'CREATE', 'ALTER', 'DROP', 'JOIN', 'LEFT', 'RIGHT',
            'INNER', 'OUTER', 'ON', 'AND', 'OR', 'NOT', 'NULL',
            'TRUE', 'FALSE', 'DISTINCT', 'ORDER', 'BY', 'GROUP',
            'HAVING', 'LIMIT', 'OFFSET', 'AS', 'IN', 'EXISTS'
        ];

        const functions = [
            'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'UPPER', 'LOWER',
            'LENGTH', 'TRIM', 'CONCAT', 'SUBSTRING', 'NOW', 'DATE'
        ];

        const suggestions: monaco.languages.CompletionItem[] = [];

        // Add keywords
        keywords.forEach(keyword => {
            suggestions.push({
                label: keyword,
                kind: monaco.languages.CompletionItemKind.Keyword,
                insertText: keyword,
                range: range,
                detail: 'SQL Keyword',
            });
        });

        // Add functions
        functions.forEach(func => {
            suggestions.push({
                label: func,
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: `${func}()`,
                range: range,
                detail: 'SQL Function',
            });
        });

        return suggestions;
    }

    /**
     * Gets description for SQL keywords for hover functionality
     * @param keyword The SQL keyword
     * @returns Description text
     */
    private getSQLKeywordDescription(keyword: string): string {
        const descriptions: { [key: string]: string } = {
            'SELECT': 'Retrieves data from one or more tables',
            'FROM': 'Specifies the tables to query',
            'WHERE': 'Filters rows based on conditions',
            'INSERT': 'Adds new rows to a table',
            'UPDATE': 'Modifies existing rows in a table',
            'DELETE': 'Removes rows from a table',
            'JOIN': 'Combines rows from multiple tables',
            'COUNT': 'Returns the number of rows',
            'SUM': 'Calculates the sum of values',
            'AVG': 'Calculates the average of values',
        };

        return descriptions[keyword.toUpperCase()] || 'SQL keyword or function';
    }

    /**
     * Sets the current theme for all editors
     * @param isDarkMode True for dark theme, false for light theme
     */
    setTheme(isDarkMode: boolean): void {
        try {
            const theme = isDarkMode ? 'sqlLearnerDark' : 'sqlLearnerLight';
            monaco.editor.setTheme(theme);
        } catch (error) {
            console.warn('Failed to set Monaco theme:', error);
        }
    }

    /**
     * Destroys an editor instance safely
     * @param editorInstance The editor instance to destroy
     */
    destroyEditor(editorInstance: editor.IStandaloneCodeEditor): void {
        try {
            if (this.activeEditors.has(editorInstance)) {
                editorInstance.dispose();
                this.activeEditors.delete(editorInstance);
            }
        } catch (error) {
            console.warn('Error destroying editor:', error);
        }
    }

    /**
     * Cleans up all resources and disposes active editors
     */
    dispose(): void {
        try {
            // Dispose all active editors
            this.activeEditors.forEach((editor) => {
                try {
                    editor.dispose();
                } catch (error) {
                    console.warn('Error disposing editor:', error);
                }
            });
            this.activeEditors.clear();

            // Dispose language features
            this.disposables.forEach(disposable => {
                try {
                    disposable.dispose();
                } catch (error) {
                    console.warn('Error disposing language feature:', error);
                }
            });
            this.disposables = [];

            this.languageFeaturesRegistered = false;
        } catch (error) {
            console.error('Error during Monaco service disposal:', error);
        }
    }
}

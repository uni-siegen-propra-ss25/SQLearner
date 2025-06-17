import { Injectable, NgZone } from '@angular/core';
import loader from '@monaco-editor/loader';
import * as monaco from 'monaco-editor';
import { editor } from 'monaco-editor';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MonacoEditorService {
    private initialized = false;
    private initializationComplete$ = new BehaviorSubject<boolean>(false);
    private activeEditors = new Set<editor.IStandaloneCodeEditor>();
    private languageFeaturesRegistered = false;
    private monacoLoaded = false;

    constructor(private ngZone: NgZone) {
        // Configure Monaco loader
        loader.config({
            paths: {
                vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs'
            }
        });
    }

    async initMonaco(): Promise<void> {
        if (this.initialized) {
            return this.waitForInitialization();
        }
        
        try {
            this.initialized = true;
            await loader.init();
            
            // Configure default themes and languages
            this.configureDefaults();
            
            this.initializationComplete$.next(true);
        } catch (error) {
            this.initialized = false;
            this.initializationComplete$.next(false);
            console.error('Failed to initialize Monaco Editor:', error);
            throw error;
        }
    }

    waitForInitialization(): Promise<void> {
        if (this.initializationComplete$.value) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            this.initializationComplete$.subscribe((initialized) => {
                if (initialized) {
                    resolve();
                }
            });
        });
    }

    private configureDefaults(): void {
        // Define default themes
        monaco.editor.defineTheme('sqlLearnerLight', {
            base: 'vs',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#ffffff',
                'editor.lineHighlightBackground': '#f5f5f5',
                'editorCursor.foreground': '#666666',
                'editor.selectionBackground': '#e3e3e3'
            }
        });

        monaco.editor.defineTheme('sqlLearnerDark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#1e1e1e',
                'editor.lineHighlightBackground': '#282828',
                'editorCursor.foreground': '#cccccc',
                'editor.selectionBackground': '#404040'
            }
        });
    }

    async loadMonaco(): Promise<void> {
        if (!this.monacoLoaded) {
            await loader.init();
            this.monacoLoaded = true;
        }
    }

    getEditorOptions(customOptions: Partial<editor.IStandaloneEditorConstructionOptions> = {}): editor.IStandaloneEditorConstructionOptions {
        const defaultOptions: editor.IStandaloneEditorConstructionOptions = {
            language: 'sql',
            theme: 'sqlLearnerLight',
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            roundedSelection: true,
            contextmenu: true,
            fontSize: 14,
            quickSuggestions: {
                other: true,
                comments: false,
                strings: true
            },
            fixedOverflowWidgets: true,
            snippetSuggestions: 'inline',
            suggestOnTriggerCharacters: true,
            tabCompletion: 'on',
            suggest: {
                localityBonus: true,
                snippetsPreventQuickSuggestions: false,
                showIcons: true,
                filterGraceful: true,
                insertMode: 'insert'
            },
            formatOnType: true,
            formatOnPaste: true,
            multiCursorModifier: 'ctrlCmd',
            wordWrap: 'on',
            bracketPairColorization: {
                enabled: true
            },
            autoClosingBrackets: 'always',
            matchBrackets: 'always'
        };

        return { ...defaultOptions, ...customOptions };
    }

    async createEditor(element: HTMLElement, initialValue: string = '', customOptions: Partial<editor.IStandaloneEditorConstructionOptions> = {}): Promise<editor.IStandaloneCodeEditor> {
        if (!element) {
            throw new Error('Invalid element reference provided to create editor');
        }

        await this.waitForInitialization();

        return this.ngZone.run(() => {
            const options = this.getEditorOptions({ ...customOptions, value: initialValue });
            const editorInstance = monaco.editor.create(element, options);
            this.activeEditors.add(editorInstance);

            // Setup disposal
            editorInstance.onDidDispose(() => {
                this.activeEditors.delete(editorInstance);
            });

            return editorInstance;
        });
    }

    registerSqlLanguageFeatures(getSuggestions: (word: editor.IWordAtPosition, range: monaco.Range) => monaco.languages.CompletionItem[]): void {
        if (this.languageFeaturesRegistered) {
            return;
        }

        this.ngZone.run(() => {
            monaco.languages.registerCompletionItemProvider('sql', {
                provideCompletionItems: (model, position) => {
                    const word = model.getWordUntilPosition(position);
                    const range = new monaco.Range(
                        position.lineNumber,
                        word.startColumn,
                        position.lineNumber,
                        word.endColumn
                    );
                    return {
                        suggestions: getSuggestions(word, range)
                    };
                },
                triggerCharacters: [' ', '.', ',']
            });
        });

        this.languageFeaturesRegistered = true;
    }

    setTheme(isDarkMode: boolean): void {
        const theme = isDarkMode ? 'sqlLearnerDark' : 'sqlLearnerLight';
        monaco.editor.setTheme(theme);
    }

    disposeAll(): void {
        this.activeEditors.forEach(editor => {
            editor.dispose();
        });
        this.activeEditors.clear();
        this.languageFeaturesRegistered = false;
    }
}

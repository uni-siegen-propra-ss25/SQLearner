/**
 * Component for SQL query exercises.
 * Handles container setup, query execution, answer submission, schema loading, and ER diagram visualization.
 */
import { Component, Input, ViewChild, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Exercise } from '../../../roadmap/models/exercise.model';
import { SubmissionService } from '../../services/submission.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { SqlEditorComponent } from '../../../../shared/components/sql-editor/sql-editor.component';
import { DockerService } from '../../services/docker.service';
import { ActivatedRoute, ParamMap, Router, RouterEvent, NavigationStart } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DatabaseService } from '../../../database/services/database.service';
import { SchemaVisualizationService } from '../../../../features/schema-visualization/services/schema-visualization.service';
import { ErDiagramComponent } from '../../../schema-visualization/components/er-diagram/er-diagram.component';
import { ProgressService } from '../../../progress/services/progress.service';
@Component({
    selector: 'app-query-exercise',
    templateUrl: './query-exercise.component.html',
    styleUrls: ['./query-exercise.component.scss'],
})
export class QueryExerciseComponent implements OnInit, OnDestroy {
    /**
     * Cooldown timer in seconds for the submit button
     */
    cooldown = 0;
    private cooldownInterval: any;
    /**
     * The exercise object containing all relevant data for the current query exercise.
     * @type {Exercise}
     */
    @Input() exercise!: Exercise;

    /**
     * Reference to the SQL editor component.
     * @type {SqlEditorComponent}
     */
    @ViewChild(SqlEditorComponent) sqlEditor!: SqlEditorComponent;
    
    /**
     * The current SQL query entered by the user.
     * @type {string}
     */
    sqlQuery = '';

    /**
     * The result of the last executed query.
     * @type {any}
     */
    queryResult: any = null;

    /**
     * Indicates if a query or submission is currently loading.
     * @type {boolean}
     */
    isLoading = false;

    /**
     * Controls the visibility of feedback for the user.
     * @type {boolean}
     */
    showFeedback = false;

    /**
     * Stores feedback text from the backend.
     * @type {string | null}
     */
    feedback: string | null = null;

    /**
     * The current view mode ('schema' or 'result').
     * @type {'schema' | 'result'}
     */
    currentView: 'schema' | 'result' = 'result';

    /**
     * Indicates if dark mode is enabled.
     * @type {boolean}
     */
    isDarkMode = false;

    /**
     * Indicates if the last submitted answer was correct.
     * @type {boolean}
     */
    isCorrectAnswer = false;

    /**
     * Stores the actual schema loaded from the database.
     * @type {string}
     */
    actualDatabaseSchema = '';

    /**
     * Indicates if the Docker container is ready for queries.
     * @type {boolean}
     */
    isContainerReady = false;

    /**
     * Indicates if the Docker container is currently being created (initializing).
     * Used to block navigation and logout until ready.
     */
    public isContainerInitializing = false;

    /**
     * The ID of the running Docker container for this exercise.
     * @type {string | null}
     */
    private containerId: string | null = null;

    /**
     * Connection details for the running Docker container.
     * @type {{ host: string; port: number; database?: string } | null}
     */
    private connectionDetails: { host: string; port: number; database?: string } | null = null;

    /**
     * Subscription for the Docker container lifecycle.
     * @type {Subscription | null}
     */
    private containerSubscription: Subscription | null = null;

    /**
     * Subscription for router navigation events to delete container on URL change.
     */
    private routerSubscription: Subscription | null = null;

    /**
     * Pagination: number of rows per page.
     * @type {number}
     */
    pageSize = 10;

    /**
     * Pagination: available page size options.
     * @type {number[]}
     */
    pageSizeOptions = [5, 10, 25, 100];

    /**
     * Pagination: current page index.
     * @type {number}
     */
    pageIndex = 0;
    
    /**
     * Emits the exercise ID when the user completes the exercise.
     * @type {EventEmitter<number>}
     */
    @Output() completed = new EventEmitter<number>();

    /**
     * Stores the last query error message (e.g., SQL syntax error) to show in the UI.
     */
    public queryError: string | null = null;

    /**
     * Constructor for QueryExerciseComponent.
     * @param {SubmissionService} submissionService - Service for submitting answers and running queries.
     * @param {MatSnackBar} snackBar - Service for showing notifications.
     * @param {DockerService} dockerService - Service for managing Docker containers.
     * @param {ActivatedRoute} route - Activated route for accessing route parameters.
     * @param {DatabaseService} databaseService - Service for database schema operations.
     * @param {MatDialog} dialog - Material dialog service for opening dialogs.
     * @param {SchemaVisualizationService} schemaVisualizationService - Service for ER diagram visualization.
     */
    constructor(
        private submissionService: SubmissionService,
        private snackBar: MatSnackBar,
        private dockerService: DockerService,
        private route: ActivatedRoute,
        private router: Router,
        private databaseService: DatabaseService,
        private dialog: MatDialog,
        private schemaVisualizationService: SchemaVisualizationService,
        private progressService: ProgressService
    ) {}

    /**
     * Lifecycle hook: Initializes the component, loads schema, and creates Docker container.
     * @returns {void}
     */
    ngOnInit(): void {
        // Check if the user has already answered this exercise correctly
        this.isCorrectAnswer = this.progressService.isCorrectAnswer(this.exercise.id);

        // Restore containerId from sessionStorage if present
        const storedContainerId = sessionStorage.getItem('activeContainerId');
        if (storedContainerId) {
            this.containerId = storedContainerId;
        }

        // Set initializing flag to true before starting container creation
        this.isContainerInitializing = true;
        // Set global window property for cross-component access
        (window as any)["containerInitializing"] = true;

        // Subscribe to router events to delete container when navigating away
        this.routerSubscription = this.router.events.pipe(
            filter((event: any): event is NavigationStart => event instanceof NavigationStart)
        ).subscribe((event: NavigationStart) => {
            // If containerId is available, delete the container immediately
            if (this.containerId) {
                this.deleteContainer();
            } else if (this.exercise?.id) {
                // If containerId is not yet available, set a pending delete flag for this exerciseId
                sessionStorage.setItem('pendingContainerDeleteForExercise', String(this.exercise.id));
            }
        });

        // Load the actual database schema if available
        if (this.exercise?.database?.id) {
            this.loadDatabaseSchema(this.exercise.database.id);
        }

        this.route.paramMap.subscribe((params: ParamMap) => {
            const exerciseId = Number(params.get('exerciseId'));

            if (exerciseId) {
                this.isContainerReady = false; // Container is not ready yet
                this.containerSubscription = this.dockerService.createContainer(exerciseId).subscribe({
                    next: (response: { containerId: string; connectionDetails: any }) => {
                        this.containerId = response.containerId;
                        this.connectionDetails = response.connectionDetails;
                        this.isContainerReady = true; // Container is now ready for queries
                        this.isContainerInitializing = false; // Container is done initializing
                        // Unset global window property
                        (window as any)["containerInitializing"] = false;
                        // Store containerId in sessionStorage
                        sessionStorage.setItem('activeContainerId', this.containerId);
                        // Check if there is a pending delete for this exerciseId only
                        const pendingDeleteFor = sessionStorage.getItem('pendingContainerDeleteForExercise');
                        if (pendingDeleteFor && String(this.exercise.id) === pendingDeleteFor) {
                            this.deleteContainer();
                            sessionStorage.removeItem('pendingContainerDeleteForExercise');
                        }
                        this.snackBar.open('Container ready - you can now run queries!', 'OK', {
                            duration: 3000,
                        });
                    },
                    error: (error: any) => {
                        this.isContainerReady = false; // Container creation failed
                        this.isContainerInitializing = false; // Initialization failed
                        // Unset global window property
                        (window as any)["containerInitializing"] = false;
                        this.snackBar.open('Failed to create exercise environment.', 'Close', {
                            duration: 5000,
                        });
                    }
                });
            }
        });
    }

    /**
     * Lifecycle hook: Cleans up subscriptions and deletes the Docker container on destroy.
     * @returns {void}
     */
    ngOnDestroy(): void {
        if (this.containerSubscription) {
            this.containerSubscription.unsubscribe();
        }
        if (this.routerSubscription) {
            this.routerSubscription.unsubscribe();
        }
        if (this.containerId) {
            this.deleteContainer();
        }
        // Always unset the global window property on destroy
        (window as any)["containerInitializing"] = false;
    }

    /**
     * Handles changes in the SQL editor.
     * @param {string} newValue - The new SQL query value.
     * @returns {void}
     */
    onSqlChange(newValue: string) {
        this.sqlQuery = newValue;
    }

    /**
     * Called when the SQL editor is ready. Sets the theme if dark mode is enabled.
     * @returns {void}
     */
    onEditorReady() {
        if (this.isDarkMode) {
            this.sqlEditor.setTheme('dark');
        }
    }

    /**
     * Toggles the SQL editor theme between dark and light.
     * @param {boolean} isDark - Whether dark mode should be enabled.
     * @returns {void}
     */
    toggleTheme(isDark: boolean) {
        this.isDarkMode = isDark;
        this.sqlEditor?.setTheme(isDark ? 'dark' : 'light');
    }

    /**
     * Executes the current SQL query and displays the result.
     * @returns {void}
     */
    runQuery(): void {
        if (!this.sqlQuery.trim()) return;

        this.isLoading = true;
        this.queryError = null; // Clear previous error

        this.submissionService.runQuery(this.exercise.id, this.sqlQuery, this.connectionDetails || undefined).subscribe({
            next: (result: any) => {
                this.queryResult = result;
                this.isLoading = false;
                this.currentView = 'result';
                this.queryError = null; // Clear error on success
            },
            error: (error: any) => {
                this.isLoading = false;
                this.queryResult = null;
                // Log the full error object for debugging
                console.error('Full error object:', error);
                // Robust error extraction for all backend formats
                let msg = 'Failed to run query';
                if (typeof error.error === 'string') {
                    msg = error.error;
                } else if (error.error?.detail) {
                    msg = error.error.detail;
                } else if (error.error?.message) {
                    msg = error.error.message;
                } else if (error.message) {
                    msg = error.message;
                }
                this.queryError = msg;
                this.snackBar.open(this.queryError || 'Unknown error', 'Close', {
                    duration: 5000,
                    panelClass: ['error-snackbar']
                });
            },
        });
    }

    /**
     * Submits the current SQL query as an answer for the exercise.
     * Shows feedback and emits completion if correct.
     * @returns {void}
     */
    submitAnswer(): void {
        if (!this.sqlQuery.trim() || this.isLoading || this.cooldown > 0) return;

        this.isLoading = true;
        this.submissionService.submitAnswer(this.exercise.id, this.sqlQuery, this.connectionDetails || undefined).subscribe({
            next: (submission: any) => {
                this.isLoading = false;
                this.isCorrectAnswer = submission.isCorrect;
                if (submission.isCorrect) {
                    this.completed.emit(this.exercise.id);
                }
                // Store feedback for potential display in UI
                if (submission.feedback) {
                    this.feedback = submission.feedback;
                    this.showFeedback = true;
                }
                this.startCooldown(10);
            },
            error: (error: any) => {
                this.isLoading = false;
                this.snackBar.open(error.message || 'Failed to submit answer', 'Close', {
                    duration: 3000,
                });
                this.startCooldown(10);
            }
        });
    }

    /**
     * Starts the cooldown timer for the submit button
     */
    private startCooldown(seconds: number) {
        this.cooldown = seconds;
        if (this.cooldownInterval) {
            clearInterval(this.cooldownInterval);
        }
        this.cooldownInterval = setInterval(() => {
            this.cooldown--;
            if (this.cooldown <= 0) {
                clearInterval(this.cooldownInterval);
            }
        }, 1000);
    }

    /**
     * Toggles the visibility of the feedback section.
     * @returns {void}
     */
    toggleFeedback(): void {
        this.showFeedback = !this.showFeedback;
    }

    /**
     * Handles pagination changes for the query result table.
     * @param {any} e - The pagination event.
     * @returns {void}
     */
    onPageChange(e: any): void {
        this.pageIndex = e.pageIndex;
        this.pageSize = e.pageSize;
    }

    /**
     * Returns the paginated rows for the current page.
     * @returns {any[]} - Array of rows for the current page.
     */
    get paginatedRows(): any[] {
        if (!this.queryResult?.rows) return [];
        const start = this.pageIndex * this.pageSize;
        return this.queryResult.rows.slice(start, start + this.pageSize);
    }

    /**
     * Loads the actual database schema from the PostgreSQL database instead of using the static schemaSql field.
     * @param {number} databaseId - The ID of the database to load the schema for.
     * @returns {void}
     */
    private loadDatabaseSchema(databaseId: number): void {
        this.databaseService.getDatabaseSchema(databaseId).subscribe({
            next: (response) => {
                this.actualDatabaseSchema = response.schema;
                
                // Update SQL editor with new schema if it's already initialized
                if (this.sqlEditor) {
                    // The SQL editor component will automatically pick up the schema change
                    // through the [schema] binding in the template
                }
            },
            error: (error) => {
                console.error('Failed to load database schema:', error);
                // Fallback to static schema if available
                this.actualDatabaseSchema = this.exercise?.database?.schemaSql || '';
            }
        });
    }

    /**
     * Shows the ER diagram in a dialog for the current exercise schema.
     * Uses the backend visualization if possible, otherwise parses the schema string.
     * @returns {void}
     */
    showErDiagram(): void {
        const schemaToUse = this.actualDatabaseSchema || this.exercise?.database?.schemaSql || '';
        
        if (!schemaToUse.trim()) {
            this.snackBar.open('Kein Schema verfügbar für das ER-Diagramm', 'Schließen', {
                duration: 3000
            });
            return;
        }

        // If we have a database ID, use that for visualization
        if (this.exercise?.database?.id) {
            this.schemaVisualizationService.visualizeDatabase(this.exercise.database.id).subscribe({
                next: (erDiagram) => {
                    this.openErDiagramDialog(erDiagram);
                },
                error: (error) => {
                    console.error('Failed to visualize database:', error);
                    this.fallbackToSchemaString(schemaToUse);
                }
            });
        } else {
            // Fallback to parsing the schema string
            this.fallbackToSchemaString(schemaToUse);
        }
    }

    /**
     * Parses the schema string and opens the ER diagram dialog as a fallback.
     * @param {string} schema - The SQL schema string to parse.
     * @returns {void}
     */
    private fallbackToSchemaString(schema: string): void {
        this.schemaVisualizationService.parseSchemaString({
            schema: schema,
            name: this.exercise?.database?.name || 'Schema'
        }).subscribe({
            next: (erDiagram) => {
                this.openErDiagramDialog(erDiagram);
            },
            error: (error) => {
                console.error('Failed to parse schema:', error);
                this.snackBar.open('Fehler beim Generieren des ER-Diagramms. Bitte SQL-Schema prüfen.', 'Schließen', {
                    duration: 5000
                });
            }
        });
    }

    /**
     * Opens the ER diagram dialog with the provided ER diagram data.
     * @param {any} erDiagram - The ER diagram data (DBML code and database name).
     * @returns {void}
     */
    private openErDiagramDialog(erDiagram: any): void {
        this.dialog.open(ErDiagramComponent, {
            data: {
                dbmlCode: erDiagram.dbmlCode,
                databaseName: this.exercise?.database?.name
            },
            width: '90vw',
            height: '90vh',
            maxWidth: '1200px',
            maxHeight: '800px',
            disableClose: false,
            panelClass: 'er-diagram-dialog'
        });
    }

    /**
     * Deletes the Docker container associated with the current exercise.
     * This is called when the user navigates away from the exercise page.
     */
    private deleteContainer(): void {
        // Always remove both containerId and pending delete flag after attempting deletion
        if (this.containerId) {
            this.dockerService.deleteContainer(this.containerId).subscribe({
                next: () => {
                    this.containerId = null;
                    this.connectionDetails = null;
                    this.isContainerReady = false;
                    sessionStorage.removeItem('activeContainerId');
                    sessionStorage.removeItem('pendingContainerDeleteForExercise');
                },
                error: (error: any) => {
                    this.isContainerReady = false;
                    sessionStorage.removeItem('activeContainerId');
                    sessionStorage.removeItem('pendingContainerDeleteForExercise');
                }
            });
        } else {
            // If called without a containerId, just clear the flags
            sessionStorage.removeItem('activeContainerId');
            sessionStorage.removeItem('pendingContainerDeleteForExercise');
        }
    }

    /**
     * Returns appropriate tooltip text for the query button based on container status
     * @returns {string} - The tooltip text
     */
    getQueryButtonTooltip(): string {
        if (!this.isContainerReady) {
            return 'Warten Sie, bis der Container bereit ist...';
        }
        if (!this.sqlQuery.trim()) {
            return 'Geben Sie zuerst eine SQL-Query ein';
        }
        if (this.isLoading) {
            return 'Query wird ausgeführt...';
        }
        return 'Testet deine Query direkt in der Datenbank. Das Ergebnis wird dir sofort angezeigt.';
    }
}

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Topic } from '../../models/topic.model';
import { Exercise } from '../../models/exercise.model';
import { RoadmapService } from '../../services/roadmap.service';
import { ExercisesService } from '../../../exercises/services/exercises.service';
import { ExerciseDialogComponent } from '../../dialogs/exercise-dialog/exercise-dialog.component';

/**
 * Component for displaying and managing topic cards within chapters in the roadmap.
 * Handles topic expansion, exercise loading, CRUD operations, and bookmark event propagation.
 * Provides different interfaces for students (view-only) and tutors (full management capabilities).
 *
 * @example
 * ```html
 * <app-topic-card
 *   [topic]="topic"
 *   [isTutor]="false"
 *   [bookmarkedExerciseIds]="bookmarkSet"
 *   [completedExerciseIds]="completedSet"
 *   (bookmarkToggled)="handleBookmarkChange($event)">
 * </app-topic-card>
 * ```
 */
@Component({
    selector: 'app-topic-card',
    templateUrl: './topic-card.component.html',
    styleUrls: ['./topic-card.component.scss'],
})
export class TopicCardComponent implements OnInit {
    /**
     * The topic data object containing all topic information including title, description, and metadata.
     * @type {Topic}
     * @required
     */
    @Input() topic!: Topic;

    /**
     * Flag indicating if the current user has tutor privileges for content management.
     * When true, shows edit/delete buttons and exercise creation functionality.
     * @type {boolean}
     * @default false
     */
    @Input() isTutor = false;

    /**
     * Set of exercise IDs that are currently bookmarked by the user.
     * Used for efficient O(1) bookmark status lookups across exercise cards within this topic.
     * Passed down from parent components for bookmark state synchronization.
     * @type {Set<number>}
     * @default new Set()
     */
    @Input() bookmarkedExerciseIds: Set<number> = new Set();

    /**
     * Set of exercise IDs that are currently completed by the user.
     * Used for efficient O(1) completion status lookups across exercise cards within this topic.
     * Passed down from parent components for completion state synchronization.
     * @type {Set<number>}
     * @default new Set()
     */
    @Input() completedExerciseIds: Set<number> = new Set();

    /**
     * Event emitter for topic edit operations triggered by tutors.
     * Emits the complete topic object to parent component for editing.
     * @type {EventEmitter<Topic>}
     */
    @Output() edit = new EventEmitter<Topic>();

    /**
     * Event emitter for topic deletion operations triggered by tutors.
     * Emits the topic ID to parent component for deletion confirmation and processing.
     * @type {EventEmitter<number>}
     */
    @Output() delete = new EventEmitter<number>();

    /**
     * Event emitter for bookmark toggle operations from child exercise components.
     * Forwards bookmark events up the component hierarchy for centralized state management.
     * @type {EventEmitter<{exerciseId: number; isBookmarked: boolean}>}
     */
    @Output() bookmarkToggled = new EventEmitter<{ exerciseId: number; isBookmarked: boolean }>();

    /**
     * Event emitter for exercise completion events from child exercise components.
     * Forwards exercise completion events up the component hierarchy for centralized state management.
     * @type {EventEmitter<number>}
     */
    @Output() exerciseCompleted = new EventEmitter<number>();

    /**
     * Array of exercises belonging to this topic, loaded from the backend.
     * Populated when the topic is expanded or component initializes.
     * @type {Exercise[]}
     */
    exercises: Exercise[] = [];

    /**
     * Flag indicating if the topic expansion panel is currently expanded.
     * Controls the visibility of topic content and triggers exercise loading.
     * @type {boolean}
     */
    isExpanded = false;

    /**
     * Flag indicating if exercise data is currently being loaded from the backend.
     * Used to show loading indicators and prevent duplicate requests.
     * @type {boolean}
     */
    isLoading = false;

    /**
     * Creates an instance of TopicCardComponent with required service dependencies.
     * @param {RoadmapService} roadmapService - Service for roadmap and topic data operations
     * @param {ExercisesService} exercisesService - Service for exercise CRUD operations
     * @param {MatDialog} dialog - Angular Material dialog service for exercise management dialogs
     * @param {MatSnackBar} snackBar - Angular Material snackbar service for user notifications
     */
    constructor(
        private readonly roadmapService: RoadmapService,
        private readonly exercisesService: ExercisesService,
        private readonly dialog: MatDialog,
        private readonly snackBar: MatSnackBar,
    ) {}

    /**
     * Component initialization lifecycle hook.
     * Triggers initial loading of exercises for the topic.
     */
    ngOnInit(): void {
        this.loadExercises();
    }

    /**
     * Loads exercises for the current topic from the backend API.
     * Sets loading state and handles both success and error scenarios.
     * Provides user feedback through snackbar notifications on errors.
     */
    loadExercises(): void {
        this.isLoading = true;
        this.exercisesService.getExercisesByTopic(this.topic.id).subscribe({
            next: (exercises) => {
                this.exercises = exercises;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading exercises:', error);
                this.snackBar.open('Failed to load exercises', 'Close', { duration: 3000 });
                this.isLoading = false;
            },
        });
    }

    /**
     * Handles topic expansion state changes from the expansion panel.
     * Toggles the expanded state and triggers exercise loading when expanded.
     * Optimizes performance by lazy-loading exercise data only when needed.
     */
    onExpand(): void {
        this.isExpanded = !this.isExpanded;
        if (this.isExpanded) {
            this.loadExercises();
        }
    }

    /**
     * Opens the exercise creation dialog for tutors to add new exercises to the topic.
     * Pre-fills dialog with topic ID and calculates order based on existing exercise count.
     * Handles dialog result and triggers exercise reload with user feedback on success/failure.
     */
    openNewExerciseDialog(): void {
        const dialogRef = this.dialog.open(ExerciseDialogComponent, {
            width: '800px',
            data: {
                topicId: this.topic.id,
                order: this.exercises.length,
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                // Add topic ID to the exercise data for backend association
                const exerciseData = { ...result, topicId: this.topic.id };
                this.exercisesService.createExercise(exerciseData).subscribe({
                    next: () => {
                        this.loadExercises();
                        this.snackBar.open('Exercise created successfully', 'Close', {
                            duration: 3000,
                        });
                    },
                    error: (error) => {
                        console.error('Error creating exercise:', error);
                        this.snackBar.open('Failed to create exercise', 'Close', {
                            duration: 3000,
                        });
                    },
                });
            }
        });
    }

    /**
     * Opens the exercise edit dialog with pre-filled exercise data for modification.
     * Allows tutors to update existing exercise information and configuration.
     * Handles dialog result and triggers exercise reload with user feedback on success/failure.
     * @param {Exercise} exercise - The exercise object to be edited
     */
    onExerciseEdit(exercise: Exercise): void {
        const dialogRef = this.dialog.open(ExerciseDialogComponent, {
            width: '800px',
            data: exercise,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.exercisesService.updateExercise(exercise.id, result).subscribe({
                    next: () => {
                        this.loadExercises();
                        this.snackBar.open('Exercise updated successfully', 'Close', {
                            duration: 3000,
                        });
                    },
                    error: (error) => {
                        console.error('Error updating exercise:', error);
                        this.snackBar.open('Failed to update exercise', 'Close', {
                            duration: 3000,
                        });
                    },
                });
            }
        });
    }

    /**
     * Handles exercise deletion with user confirmation dialog.
     * Prompts user for confirmation before permanently deleting the exercise.
     * Triggers exercise reload and provides user feedback on success/failure.
     * @param {number} exerciseId - The unique identifier of the exercise to be deleted
     */
    onExerciseDelete(exerciseId: number): void {
        if (confirm('Are you sure you want to delete this exercise?')) {
            this.exercisesService.deleteExercise(exerciseId).subscribe({
                next: () => {
                    this.loadExercises();
                    this.snackBar.open('Exercise deleted successfully', 'Close', {
                        duration: 3000,
                    });
                },
                error: (error) => {
                    console.error('Error deleting exercise:', error);
                    this.snackBar.open('Failed to delete exercise', 'Close', { duration: 3000 });
                },
            });
        }
    }

    /**
     * Checks if a specific exercise is bookmarked by the current user.
     * Provides efficient O(1) lookup using Set data structure from parent component.
     * Used by exercise cards to determine bookmark display state.
     * @param {number} exerciseId - The unique identifier of the exercise to check
     * @returns {boolean} True if the exercise is bookmarked, false otherwise
     */
    isExerciseBookmarked(exerciseId: number): boolean {
        return this.bookmarkedExerciseIds.has(exerciseId);
    }

    /**
     * Checks if a specific exercise is completed by the current user.
     * Provides efficient O(1) lookup using Set data structure from parent component.
     * Used by exercise cards to determine completion display state.
     * @param {number} exerciseId - The unique identifier of the exercise to check
     * @returns {boolean} True if the exercise is completed, false otherwise
     */
    isExerciseCompleted(exerciseId: number): boolean {
        return this.completedExerciseIds.has(exerciseId);
    }

    /**
     * Handles bookmark toggle events from child exercise card components.
     * Forwards the bookmark event to the parent chapter component for centralized state management.
     * Maintains the event flow for real-time bookmark synchronization across the component hierarchy.
     * @param {Object} event - Event object containing exercise ID and new bookmark status
     * @param {number} event.exerciseId - The ID of the exercise being bookmarked/unbookmarked
     * @param {boolean} event.isBookmarked - The new bookmark status of the exercise
     */
    onBookmarkToggled(event: { exerciseId: number; isBookmarked: boolean }): void {
        this.bookmarkToggled.emit(event);
    }

    /**
     * Handles exercise completion events from child exercise card components.
     * Forwards the exercise completion event to the parent chapter component for centralized state management.
     * Maintains the event flow for real-time completion synchronization across the component hierarchy.
     * @param {number} exerciseId - The ID of the completed exercise
     */
    onExerciseCompleted(exerciseId: number): void {
        this.exerciseCompleted.emit(exerciseId);
    }

    getCompletedCount(): number {
        return this.exercises.filter(
            ex => this.isExerciseCompleted(ex.id) || this.isLocallyCompleted(ex.id)
        ).length;
    }

    isLocallyCompleted(exerciseId: number): boolean {
        const completed = localStorage.getItem('completedExercises');
        if (!completed) return false;
        try {
            const arr = JSON.parse(completed);
            return Array.isArray(arr) && arr.includes(exerciseId);
        } catch {
            return false;
        }
    }
}

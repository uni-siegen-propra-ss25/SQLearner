import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Exercise, ExerciseType, Difficulty } from '../../models/exercise.model';
import { Router } from '@angular/router';
import { BookmarkService } from '../../../progress/services/bookmark.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Subject, takeUntil, catchError, of } from 'rxjs';

/**
 * Component for displaying individual exercise cards with interactive features.
 * Handles exercise navigation, bookmark functionality, and provides different views for students and tutors.
 * Supports drag-and-drop operations and integrates with the bookmark system for personalized learning.
 * 
 * @example
 * ```html
 * <app-exercise-card 
 *   [exercise]="exercise" 
 *   [isTutor]="false"
 *   [isBookmarked]="true"
 *   (bookmarkToggled)="onBookmarkChange($event)">
 * </app-exercise-card>
 * ```
 */
@Component({
    selector: 'app-exercise-card',
    templateUrl: './exercise-card.component.html',
    styleUrls: ['./exercise-card.component.scss'],
})
export class ExerciseCardComponent implements OnInit, OnDestroy {
    /**
     * The exercise data object containing all exercise information including title, description, type, and difficulty.
     * @type {Exercise}
     * @required
     */
    @Input() exercise!: Exercise;
    
    /**
     * Flag indicating if the current user is a tutor with editing privileges.
     * When true, shows edit/delete buttons instead of bookmark functionality.
     * @type {boolean}
     * @default false
     */
    @Input() isTutor = false;
    
    /**
     * Flag indicating if the card is currently being dragged for reordering operations.
     * Used to apply special styling during drag operations.
     * @type {boolean}
     * @default false
     */
    @Input() isDragging = false;
    
    /**
     * Flag indicating if the exercise is bookmarked by the current user.
     * Controls the visual state of the bookmark button and icon display.
     * @type {boolean}
     * @default false
     */
    @Input() isBookmarked = false;
    
    /**
     * Event emitter for exercise edit operations triggered by tutors.
     * Emits the complete exercise object to parent component for editing.
     * @type {EventEmitter<Exercise>}
     */
    @Output() edit = new EventEmitter<Exercise>();
    
    /**
     * Event emitter for exercise deletion operations triggered by tutors.
     * Emits the exercise ID to parent component for deletion confirmation and processing.
     * @type {EventEmitter<number>}
     */
    @Output() delete = new EventEmitter<number>();
    
    /**
     * Event emitter for bookmark toggle operations.
     * Emits object containing exercise ID and new bookmark status for parent component synchronization.
     * @type {EventEmitter<{exerciseId: number; isBookmarked: boolean}>}
     */
    @Output() bookmarkToggled = new EventEmitter<{ exerciseId: number; isBookmarked: boolean }>();

    /** Reference to ExerciseType enum for template usage and type checking */
    ExerciseType = ExerciseType;
    
    /** Reference to Difficulty enum for template usage and badge display */
    Difficulty = Difficulty;
    
    /** Subject for managing component lifecycle and preventing memory leaks in subscriptions */
    private destroy$ = new Subject<void>();
    
    /** Internal bookmark ID used for API delete operations when removing bookmarks */
    private bookmarkId: number | null = null;
    
    /** Flag indicating if bookmark operation is currently in progress to prevent duplicate requests */
    isBookmarkLoading = false;

    /**
     * Creates an instance of ExerciseCardComponent with required service dependencies.
     * @param {Router} router - Angular router service for navigation to exercise details
     * @param {BookmarkService} bookmarkService - Service for bookmark CRUD operations
     * @param {AuthService} authService - Service for authentication state and user management
     */
    constructor(
        private router: Router,
        private bookmarkService: BookmarkService,
        private authService: AuthService
    ) {}

    /**
     * Component initialization lifecycle hook.
     * Sets up initial state and loads bookmark status if user is authenticated and not a tutor.
     * Only loads bookmark data for students to optimize performance.
     */
    ngOnInit(): void {
        // Load bookmark status for authenticated students
        if (!this.isTutor && this.authService.hasToken()) {
            this.loadBookmarkStatus();
        }
    }

    /**
     * Component cleanup lifecycle hook.
     * Completes all active subscriptions to prevent memory leaks and cleanup resources.
     * Essential for proper component lifecycle management.
     */
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Loads the bookmark status for the current exercise from the backend API.
     * Sets the internal bookmark ID if the exercise is already bookmarked by the user.
     * Handles errors gracefully without blocking the UI functionality.
     * @private
     */
    private loadBookmarkStatus(): void {
        if (!this.exercise?.id) return;
        
        this.bookmarkService.getUserBookmarks()
            .pipe(
                takeUntil(this.destroy$),
                catchError(error => {
                    console.error('Error loading bookmark status:', error);
                    return of([]);
                })
            )
            .subscribe(bookmarks => {
                const bookmark = bookmarks.find(b => b.exercise.id === this.exercise.id);
                this.isBookmarked = !!bookmark;
                this.bookmarkId = bookmark?.id || null;
            });
    }

    /**
     * Toggles the bookmark status of the current exercise with optimistic UI updates.
     * Creates a new bookmark if not bookmarked, removes existing bookmark if bookmarked.
     * Provides immediate visual feedback and handles API errors gracefully.
     * Emits bookmarkToggled event to notify parent components of state changes.
     */
    toggleBookmark(): void {
        if (!this.exercise?.id || this.isBookmarkLoading) return;
        
        this.isBookmarkLoading = true;
        
        if (this.isBookmarked && this.bookmarkId) {
            // Remove existing bookmark from backend
            this.bookmarkService.removeBookmark(this.bookmarkId)
                .pipe(
                    takeUntil(this.destroy$),
                    catchError(error => {
                        console.error('Error removing bookmark:', error);
                        return of(null);
                    })
                )
                .subscribe(() => {
                    this.isBookmarked = false;
                    this.bookmarkId = null;
                    this.isBookmarkLoading = false;
                    this.bookmarkToggled.emit({ 
                        exerciseId: this.exercise.id!, 
                        isBookmarked: false 
                    });
                });
        } else {
            // Create new bookmark in backend
            this.bookmarkService.addBookmark(this.exercise.id)
                .pipe(
                    takeUntil(this.destroy$),
                    catchError(error => {
                        console.error('Error adding bookmark:', error);
                        return of(null);
                    })
                )
                .subscribe(bookmark => {
                    if (bookmark) {
                        this.isBookmarked = true;
                        this.bookmarkId = bookmark.id;
                        this.bookmarkToggled.emit({ 
                            exerciseId: this.exercise.id!, 
                            isBookmarked: true 
                        });
                    }
                    this.isBookmarkLoading = false;
                });
        }
    }

    /**
     * Handles bookmark button click events with proper event management.
     * Prevents event propagation to avoid triggering card click navigation.
     * Delegates to toggleBookmark method for actual bookmark operations.
     * @param {Event} event - The mouse click event from the bookmark button
     */
    onBookmarkClick(event: Event): void {
        event.stopPropagation();
        this.toggleBookmark();
    }

    /**
     * Returns the appropriate CSS color value for difficulty badges based on exercise difficulty level.
     * Provides consistent visual hierarchy and accessibility through color coding.
     * @param {Difficulty} difficulty - The exercise difficulty level enum value
     * @returns {string} Hex color code string for the difficulty badge background
     */
    getDifficultyColor(difficulty: Difficulty): string {
        switch (difficulty) {
            case Difficulty.EASY:
                return '#4CAF50'; // Green for easy exercises
            case Difficulty.MEDIUM:
                return '#FF9800'; // Orange for medium exercises
            case Difficulty.HARD:
                return '#F44336'; // Red for hard exercises
            default:
                return '#9E9E9E'; // Gray for undefined difficulty
        }
    }

    /**
     * Returns the appropriate Material Design icon name for exercise type badges.
     * Provides visual representation of different exercise types for quick identification.
     * @param {ExerciseType} type - The exercise type enum value
     * @returns {string} Material Design icon name string for the exercise type
     */
    getExerciseTypeIcon(type: ExerciseType): string {
        switch (type) {
            case ExerciseType.QUERY:
                return 'code'; // Code icon for SQL queries
            case ExerciseType.SINGLE_CHOICE:
                return 'radio_button_checked'; // Radio button for single choice
            case ExerciseType.MULTIPLE_CHOICE:
                return 'check_box'; // Checkbox for multiple choice
            case ExerciseType.FREETEXT:
                return 'subject'; // Text icon for free text exercises
            default:
                return 'help'; // Help icon for unknown types
        }
    }

    /**
     * Returns the human-readable label for exercise type badges.
     * Converts enum values to user-friendly display text for better UX.
     * @param {ExerciseType} type - The exercise type enum value
     * @returns {string} Human-readable label string for the exercise type
     */
    getExerciseTypeLabel(type: ExerciseType): string {
        switch (type) {
            case ExerciseType.QUERY:
                return 'SQL Query';
            case ExerciseType.SINGLE_CHOICE:
                return 'Single Choice';
            case ExerciseType.MULTIPLE_CHOICE:
                return 'Multiple Choice';
            case ExerciseType.FREETEXT:
                return 'Free Text';
            default:
                return type; // Fallback to enum value
        }
    }

    /**
     * Handles card click events for navigation to exercise details page.
     * Only navigates for students (non-tutors) to prevent accidental navigation during content management.
     * Routes to the DynamicExerciseComponent with the exercise ID parameter.
     * Validates exercise data before attempting navigation.
     */
    onCardClick(): void {
        if (!this.isTutor && this.exercise && this.exercise.id != null) {
            // Navigate to DynamicExerciseComponent with exercise ID
            this.router.navigate(['/exercises', this.exercise.id]);
        }
    }
}

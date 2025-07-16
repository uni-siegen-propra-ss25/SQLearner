import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RoadmapService } from '../../services/roadmap.service';
import { AuthService } from '../../../auth/services/auth.service';
import { BookmarkService } from '../../../progress/services/bookmark.service';
import { ProgressService } from '../../../progress/services/progress.service';
import { Chapter } from '../../models/chapter.model';
import { Role } from '../../../users/models/role.model';
import { ChapterDialogComponent } from '../../dialogs/chapter-dialog/chapter-dialog.component';
import { ProgressDto } from '../../../progress/models/progress-dto.model';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

/**
 * Main component for displaying and managing the learning roadmap with chapters and bookmark functionality.
 * Handles the complete roadmap view including chapter management, bookmark synchronization, and role-based access control.
 * Provides different interfaces for students (bookmark-focused) and tutors (content management).
 *
 * @example
 * ```html
 * <app-roadmap-view></app-roadmap-view>
 * ```
 */
@Component({
    selector: 'app-roadmap-view',
    templateUrl: './roadmap-view.component.html',
    styleUrls: ['./roadmap-view.component.scss'],
})
export class RoadmapViewComponent implements OnInit, OnDestroy {
    /**
     * Array of chapters loaded from the backend, sorted by display order.
     * Contains all chapter data including topics and exercises hierarchy.
     * @type {Chapter[]}
     */
    chapters: Chapter[] = [];

    /**
     * Flag indicating if the current user has tutor privileges for content management.
     * Determines visibility of edit/delete buttons and bookmark functionality.
     * @type {boolean}
     */
    isTutor = false;

    /**
     * Current progress data from the unified ProgressService.
     * Contains completed exercise IDs and total counts for real-time UI updates.
     * @type {ProgressDto}
     */
    roadmapProgress: ProgressDto = { completedExerciseIds: [], totalCount: 0 };

    /**
     * Set of exercise IDs that are bookmarked by the current user.
     * Used for efficient O(1) bookmark status lookups across all exercise cards.
     * @type {Set<number>}
     */
    bookmarkedExerciseIds: Set<number> = new Set();

    /**
     * Converts the completed exercise IDs array to a Set for template usage.
     * The chapter-card component expects a Set<number> for completedExerciseIds.
     * @returns {Set<number>} Set of completed exercise IDs
     */
    get completedExerciseIdsAsSet(): Set<number> {
        return new Set(this.roadmapProgress.completedExerciseIds);
    }

    /**
     * Array of RxJS subscriptions for proper cleanup and memory leak prevention.
     * Contains all active subscriptions that need to be unsubscribed on component destroy.
     * @type {Subscription[]}
     * @private
     */
    private subscriptions: Subscription[] = [];

    /**
     * Backup state of chapters for potential rollback operations.
     * Stores previous chapter configuration for undo functionality.
     * @type {Chapter[]}
     * @private
     */
    private previousChaptersState: Chapter[] = [];

    /**
     * Creates an instance of RoadmapViewComponent with required service dependencies.
     * @param {RoadmapService} roadmapService - Service for chapter and roadmap data operations
     * @param {AuthService} authService - Service for user authentication and role management
     * @param {BookmarkService} bookmarkService - Service for bookmark CRUD operations
     * @param {ProgressService} progressService - Service for unified progress management
     * @param {MatDialog} dialog - Angular Material dialog service for chapter management dialogs
     * @param {MatSnackBar} snackBar - Angular Material snackbar for error notifications
     */
    constructor(
        private readonly roadmapService: RoadmapService,
        private readonly authService: AuthService,
        private readonly bookmarkService: BookmarkService,
        private readonly progressService: ProgressService,
        private readonly dialog: MatDialog,
        private readonly snackBar: MatSnackBar,
    ) {}

    /**
     * Component initialization lifecycle hook.
     * Sets up user authentication and progress subscriptions for real-time updates.
     * Handles different loading strategies based on user authentication state.
     */
    ngOnInit(): void {
        // Immer beim Betreten der Roadmap den Progress neu laden
        this.progressService.reloadUserProgress();

        this.subscriptions.push(
            this.authService.user$.subscribe((user) => {
                this.isTutor = user?.role === Role.TUTOR || user?.role === Role.ADMIN;

                // Load chapters and bookmarks based on user state
                if (user) {
                    this.loadData();
                } else {
                    // If no user authenticated, load chapters only
                    this.loadChapters();
                }
            }),
        );

        // Subscribe to unified progress updates for real-time UI changes
        this.subscriptions.push(
            this.progressService.getUserProgress().subscribe({
                next: (progress) => {
                    console.log('🗺️ ROADMAP - Progress received:', progress);
                    console.log('🗺️ ROADMAP - Completed IDs:', progress.completedExerciseIds);
                    this.roadmapProgress = progress;
                },
                error: (error) => {
                    console.error('Failed to load progress:', error);
                    this.showErrorMessage('Fortschritt konnte nicht geladen werden');
                },
            }),
        );
    }

    /**
     * Component cleanup lifecycle hook.
     * Unsubscribes from all active subscriptions to prevent memory leaks.
     * Essential for proper component lifecycle management in Angular applications.
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    /**
     * Loads chapters and bookmark data concurrently using RxJS forkJoin.
     * Progress is now handled by the unified ProgressService subscription.
     * @private
     */
    private loadData(): void {
        const chaptersRequest = this.roadmapService.getChapters();
        const bookmarksRequest =
            !this.isTutor && this.authService.hasToken()
                ? this.bookmarkService.getUserBookmarks().pipe(
                      catchError((error) => {
                          console.error('Failed to load bookmarks:', error);
                          return of([]);
                      }),
                  )
                : of([]);

        forkJoin({
            chapters: chaptersRequest,
            bookmarks: bookmarksRequest,
        }).subscribe({
            next: ({ chapters, bookmarks }) => {
                this.chapters = chapters.sort((a, b) => a.order - b.order);
                this.previousChaptersState = [...this.chapters];

                // Store bookmarked exercise IDs for efficient lookup operations
                this.bookmarkedExerciseIds = new Set(
                    bookmarks.map((bookmark) => bookmark.exercise.id),
                );
            },
            error: (error) => {
                console.error('Failed to load data:', error);
                this.showErrorMessage('Daten konnten nicht geladen werden');
                // Graceful fallback: load chapters only if loading fails
                this.loadChapters();
            },
        });
    }

    /**
     * Shows error message to user via snackbar.
     * @private
     */
    private showErrorMessage(message: string): void {
        this.snackBar.open(message, 'Schließen', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
        });
    }

    /**
     * Loads chapter data from the backend API with error handling.
     * Sorts chapters by their order property for consistent display.
     * Creates backup state for potential rollback operations.
     * @private
     */
    private loadChapters(): void {
        this.roadmapService.getChapters().subscribe({
            next: (chapters) => {
                this.chapters = chapters.sort((a, b) => a.order - b.order);
                this.previousChaptersState = [...this.chapters];
            },
            error: (error) => {
                console.error('Failed to load chapters:', error);
                // Consider implementing user-friendly error notification here
            },
        });
    }

    /**
     * Checks if a specific exercise is bookmarked by the current user.
     * Provides efficient O(1) lookup using Set data structure.
     * Used by child components to determine bookmark display state.
     * @param {number} exerciseId - The unique identifier of the exercise to check
     * @returns {boolean} True if the exercise is bookmarked, false otherwise
     */
    isExerciseBookmarked(exerciseId: number): boolean {
        return this.bookmarkedExerciseIds.has(exerciseId);
    }

    /**
     * Handles bookmark toggle events from child exercise card components.
     * Updates the local bookmark state immediately for optimistic UI updates.
     * Maintains synchronization between exercise cards and bookmark state.
     * @param {Object} event - Event object containing exercise ID and new bookmark status
     * @param {number} event.exerciseId - The ID of the exercise being bookmarked/unbookmarked
     * @param {boolean} event.isBookmarked - The new bookmark status of the exercise
     */
    onBookmarkToggled(event: { exerciseId: number; isBookmarked: boolean }): void {
        if (event.isBookmarked) {
            this.bookmarkedExerciseIds.add(event.exerciseId);
        } else {
            this.bookmarkedExerciseIds.delete(event.exerciseId);
        }
    }

    /**
     * Opens the chapter creation dialog for tutors to add new chapters.
     * Sets the initial order based on current chapter count.
     * Handles dialog result and triggers chapter reload on successful creation.
     */
    openNewChapterDialog(): void {
        const dialogRef = this.dialog.open(ChapterDialogComponent, {
            width: '600px',
            data: { order: this.chapters.length },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.roadmapService.createChapter(result).subscribe(() => {
                    this.loadChapters();
                });
            }
        });
    }

    /**
     * Opens the chapter edit dialog with pre-filled chapter data.
     * Allows tutors to modify existing chapter information.
     * Handles dialog result and triggers chapter reload on successful update.
     * @param {Chapter} chapter - The chapter object to be edited
     */
    onChapterEdit(chapter: Chapter): void {
        const dialogRef = this.dialog.open(ChapterDialogComponent, {
            width: '600px',
            data: chapter,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.roadmapService.updateChapter(chapter.id, result).subscribe(() => {
                    this.loadChapters();
                });
            }
        });
    }

    /**
     * Handles chapter deletion with user confirmation dialog.
     * Warns users about cascade deletion of all topics and exercises within the chapter.
     * Triggers chapter reload after successful deletion to update the UI.
     * @param {number} chapterId - The unique identifier of the chapter to be deleted
     */
    onChapterDelete(chapterId: number): void {
        if (confirm('Are you sure you want to delete this chapter and all its contents?')) {
            this.roadmapService.deleteChapter(chapterId).subscribe(() => {
                this.loadChapters();
            });
        }
    }

    /**
     * Handles exercise completion events from child components.
     * Uses unified ProgressService to record completion and trigger automatic refresh.
     * @param {number} exerciseId - The ID of the completed exercise
     */
    onExerciseCompleted(exerciseId: number): void {
        // Use unified progress service for automatic state management
        this.progressService.recordCompletion(exerciseId).subscribe({
            next: () => {
                // Progress is automatically updated via the ProgressService subscription
                console.log('Exercise completion recorded:', exerciseId);
            },
            error: (error) => {
                console.error('Failed to record exercise completion:', error);
                this.showErrorMessage('Fortschritt konnte nicht gespeichert werden');
            },
        });
    }

    /**
     * Checks if a specific exercise is completed by the current user.
     * Uses the unified progress data from ProgressService.
     * @param {number} exerciseId - The unique identifier of the exercise to check
     * @returns {boolean} True if the exercise is completed, false otherwise
     */
    isExerciseCompleted(exerciseId: number): boolean {
        return this.roadmapProgress.completedExerciseIds.includes(exerciseId);
    }

    /**
     * Converts the completed exercise IDs array to a Set for efficient lookups.
     * Used by child components that expect Set<number> for performance reasons.
     * @returns {Set<number>} Set of completed exercise IDs
     */
    get completedExerciseIds(): Set<number> {
        return new Set(this.roadmapProgress.completedExerciseIds);
    }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ProgressService } from '../../services/progress.service';
import { BookmarkService } from '../../services/bookmark.service';
import { UserProgressSummary } from '../../models/progress.model';
import { ProgressDto } from '../../models/progress-dto.model';
import { BookmarkData } from '../../models/bookmark.model';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

/**
 * Component responsible for displaying user progress statistics and managing bookmarks.
 * Provides a comprehensive view of learning progress including overall completion rates,
 * chapter-specific progress, and saved exercise bookmarks for later review.
 */
@Component({
    selector: 'app-progress-view',
    templateUrl: './progress-view.component.html',
    styleUrls: ['./progress-view.component.scss']
})
export class ProgressViewComponent implements OnInit, OnDestroy {
    /** User's comprehensive progress data including completion statistics and chapter breakdown */
    userProgress: UserProgressSummary | null = null;
    
    /** Array of exercises that the user has bookmarked for later review */
    bookmarks: BookmarkData[] = [];
    
    /** Indicates whether data is currently being loaded from the server */
    loading: boolean = true;
    
    /** Error message to display if data loading fails */
    error: string | null = null;

    private bookmarkErrorSub: Subscription | undefined;
    private progressSub: Subscription | undefined;

    constructor(
        private progressService: ProgressService,
        private bookmarkService: BookmarkService,
        private translate: TranslateService
    ) { }

    /**
     * Angular lifecycle hook that initializes the component.
     * Loads user progress data and bookmarks when the component is created.
     * Also subscribes to progress changes for automatic updates.
     */
    ngOnInit(): void {
        this.loadUserProgress();
        this.loadBookmarks();
        this.subscribeToProgressChanges();
        this.bookmarkErrorSub = this.translate.onLangChange.subscribe(() => {
            if (this.error) {
                this.setBookmarkError();
            }
        });
    }

    /**
     * Subscribes to progress changes to automatically refresh detailed progress
     * when exercises are completed through other components.
     * 
     * @private
     */
    private subscribeToProgressChanges(): void {
        this.progressSub = this.progressService.getUserProgress().subscribe({
            next: () => {
                // Reload detailed progress when basic progress changes
                this.loadUserProgress();
            },
            error: (error) => {
                console.error('Error monitoring progress changes:', error);
            }
        });
    }

    /**
     * Fetches the user's detailed progress summary from the backend API.
     * Updates the component state with progress data or error information.
     * 
     * @private
     */
    private loadUserProgress(): void {
        this.progressService.getUserProgressDetailed().subscribe({
            next: (progress) => {
                console.log('📊 PROGRESS VIEW - Detailed progress received:', progress);
                console.log('📊 PROGRESS VIEW - Chapter progress:', progress.chapterProgress);
                this.userProgress = progress;
                this.loading = false;
            },
            error: (error) => {
                console.error('Fehler beim Laden des Fortschritts:', error);
                this.error = this.translate.instant('PROGRESS_LOAD_ERROR');
                this.loading = false;
            }
        });
    }

    /**
     * Retrieves all bookmarks for the authenticated user from the backend API.
     * Updates the bookmarks array or sets error state if the request fails.
     * 
     * @private
     */
    private loadBookmarks(): void {
        this.bookmarkService.getUserBookmarks().subscribe({
            next: (bookmarks) => {
                this.bookmarks = bookmarks;
            },
            error: (error) => {
                console.error('Fehler beim Laden der Lesezeichen:', error);
                this.setBookmarkError();
            }
        });
    }

    /**
     * Removes a bookmark from the user's saved exercises list.
     * Updates the local bookmarks array immediately upon successful deletion.
     * @param {number} bookmarkId - The unique identifier of the bookmark to remove
     * @returns {void}
     */
    removeBookmark(bookmarkId: number): void {
        this.bookmarkService.removeBookmark(bookmarkId).subscribe({
            next: () => {
                this.bookmarks = this.bookmarks.filter(bookmark => bookmark.id !== bookmarkId);
            },
            error: (error) => {
                console.error('Fehler beim Entfernen des Lesezeichens:', error);
            }
        });
    }

    /**
     * Angular lifecycle hook that cleans up subscriptions when the component is destroyed.
     * @returns {void}
     */
    ngOnDestroy(): void {
        if (this.bookmarkErrorSub) {
            this.bookmarkErrorSub.unsubscribe();
        }
        if (this.progressSub) {
            this.progressSub.unsubscribe();
        }
    }

    /**
     * Sets the error message for bookmark loading failures using the translation service.
     * @private
     * @returns {void}
     */
    private setBookmarkError() {
        this.translate.get('BOOKMARKS_LOAD_ERROR').subscribe((msg: string) => {
            this.error = msg;
        });
    }
}

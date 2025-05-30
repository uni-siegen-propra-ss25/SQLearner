import { Component, OnInit } from '@angular/core';
import { ProgressService } from '../../services/progress.service';
import { BookmarkService } from '../../services/bookmark.service';
import { UserProgressSummary } from '../../models/progress.model';
import { BookmarkData } from '../../models/bookmark.model';

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
export class ProgressViewComponent implements OnInit {
    /** User's comprehensive progress data including completion statistics and chapter breakdown */
    userProgress: UserProgressSummary | null = null;
    
    /** Array of exercises that the user has bookmarked for later review */
    bookmarks: BookmarkData[] = [];
    
    /** Indicates whether data is currently being loaded from the server */
    loading: boolean = true;
    
    /** Error message to display if data loading fails */
    error: string | null = null;

    constructor(
        private progressService: ProgressService,
        private bookmarkService: BookmarkService
    ) { }

    /**
     * Angular lifecycle hook that initializes the component.
     * Loads user progress data and bookmarks when the component is created.
     */
    ngOnInit(): void {
        this.loadUserProgress();
        this.loadBookmarks();
    }

    /**
     * Fetches the user's progress summary from the backend API.
     * Updates the component state with progress data or error information.
     * 
     * @private
     */
    private loadUserProgress(): void {
        this.progressService.getUserProgress().subscribe({
            next: (progress) => {
                this.userProgress = progress;
                this.loading = false;
            },
            error: (error) => {
                console.error('Fehler beim Laden des Fortschritts:', error);
                this.error = 'Fortschrittsdaten konnten nicht geladen werden.';
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
                this.error = 'Lesezeichen konnten nicht geladen werden.';
            }
        });
    }

    /**
     * Removes a bookmark from the user's saved exercises list.
     * Updates the local bookmarks array immediately upon successful deletion.
     * 
     * @param {number} bookmarkId - The unique identifier of the bookmark to remove
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
}

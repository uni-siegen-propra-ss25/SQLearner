import { Component, OnInit } from '@angular/core';
import { ProgressService } from '../../services/progress.service';
import { BookmarkService } from '../../services/bookmark.service';
import { UserProgressSummary } from '../../models/progress.model';
import { BookmarkData } from '../../models/bookmark.model';

@Component({
    selector: 'app-progress-view',
    templateUrl: './progress-view.component.html',
    styleUrls: ['./progress-view.component.scss']
})
export class ProgressViewComponent implements OnInit {
    userProgress: UserProgressSummary | null = null;
    bookmarks: BookmarkData[] = [];
    loading: boolean = true;
    error: string | null = null;

    constructor(
        private progressService: ProgressService,
        private bookmarkService: BookmarkService
    ) { }

    ngOnInit(): void {
        this.loadUserProgress();
        this.loadBookmarks();
    }

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

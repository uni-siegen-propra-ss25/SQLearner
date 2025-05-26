import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RoadmapService } from '../../services/roadmap.service';
import { AuthService } from '../../../auth/services/auth.service';
import { Chapter } from '../../models/chapter.model';
import { Role } from '../../../users/models/role.model';
import { ChapterDialogComponent } from '../../dialogs/chapter-dialog/chapter-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-roadmap-view',
  templateUrl: './roadmap-view.component.html',
  styleUrls: ['./roadmap-view.component.scss']
})
export class RoadmapViewComponent implements OnInit, OnDestroy {
  chapters: Chapter[] = [];
  isTutor = false;
  private subscriptions: Subscription[] = [];
  private previousChaptersState: Chapter[] = [];

  constructor(
    private readonly roadmapService: RoadmapService,
    private readonly authService: AuthService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadChapters();
    this.subscriptions.push(
      this.authService.user$.subscribe(user => {
        this.isTutor = user?.role === Role.TUTOR || user?.role === Role.ADMIN;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadChapters(): void {
    this.roadmapService.getChapters().subscribe({
      next: (chapters) => {
        this.chapters = chapters.sort((a, b) => a.order - b.order);
        this.previousChaptersState = [...this.chapters];
      },
      error: (error) => {
        console.error('Failed to load chapters:', error);
        // You might want to show a user-friendly error message here
      }
    });
  }

  openNewChapterDialog(): void {
    const dialogRef = this.dialog.open(ChapterDialogComponent, {
      width: '600px',
      data: { order: this.chapters.length }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.roadmapService.createChapter(result).subscribe(() => {
          this.loadChapters();
        });
      }
    });
  }

  onChapterEdit(chapter: Chapter): void {
    const dialogRef = this.dialog.open(ChapterDialogComponent, {
      width: '600px',
      data: chapter
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.roadmapService.updateChapter(chapter.id, result).subscribe(() => {
          this.loadChapters();
        });
      }
    });
  }

  onChapterDelete(chapterId: number): void {
    if (confirm('Are you sure you want to delete this chapter and all its contents?')) {
      this.roadmapService.deleteChapter(chapterId).subscribe(() => {
        this.loadChapters();
      });
    }
  }
}
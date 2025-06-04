import { Component, Input } from '@angular/core';
import { ChapterProgress } from '../../models/progress.model';

/**
 * Component responsible for displaying chapter-specific progress information.
 * Renders a visual representation of completion status for each chapter including
 * progress bars, completion percentages, and exercise counts.
 */
@Component({
    selector: 'app-chapter-progress',
    templateUrl: './chapter-progress.component.html',
    styleUrls: ['./chapter-progress.component.scss']
})
export class ChapterProgressComponent {
    /**
     * Array of chapter progress data to display.
     * Contains completion statistics, exercise counts, and completion percentages for each chapter.
     * 
     * @type {ChapterProgress[]} Array of chapter progress objects with completion statistics
     */
    @Input() chapterProgress: ChapterProgress[] = [];
}

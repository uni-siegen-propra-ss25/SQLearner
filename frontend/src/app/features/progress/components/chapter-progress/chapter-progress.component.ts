import { Component, Input } from '@angular/core';
import { ChapterProgress } from '../../models/progress.model';

@Component({
    selector: 'app-chapter-progress',
    templateUrl: './chapter-progress.component.html',
    styleUrls: ['./chapter-progress.component.scss']
})
export class ChapterProgressComponent {
    @Input() chapterProgress: ChapterProgress[] = [];
}

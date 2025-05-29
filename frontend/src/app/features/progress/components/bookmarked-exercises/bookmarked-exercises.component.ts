import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BookmarkData } from '../../models/bookmark.model';
import { Router } from '@angular/router';

@Component({
    selector: 'app-bookmarked-exercises',
    templateUrl: './bookmarked-exercises.component.html',
    styleUrls: ['./bookmarked-exercises.component.scss']
})
export class BookmarkedExercisesComponent {
    @Input() bookmarks: BookmarkData[] = [];
    @Output() removeBookmark = new EventEmitter<number>();
    
    constructor(private router: Router) {}
    
    navigateToExercise(topicId: number, exerciseId: number): void {
        this.router.navigate(['/roadmap', 'topics', topicId, 'exercises', exerciseId]);
    }
    
    getExerciseTypeIcon(type: string): string {
        switch (type) {
            case 'QUERY': return 'code';
            case 'SINGLE_CHOICE': return 'radio_button_checked';
            case 'MULTIPLE_CHOICE': return 'check_box';
            case 'FREETEXT': return 'text_fields';
            default: return 'assignment';
        }
    }
    
    getDifficultyColor(difficulty: string): string {
        switch (difficulty) {
            case 'EASY': return 'green';
            case 'MEDIUM': return 'orange';
            case 'HARD': return 'red';
            default: return 'gray';
        }
    }
}

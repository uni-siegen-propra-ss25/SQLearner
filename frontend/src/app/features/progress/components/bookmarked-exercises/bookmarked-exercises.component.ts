import { Component, Input, Output, EventEmitter } from '@angular/core';
import { BookmarkData } from '../../models/bookmark.model';
import { Router } from '@angular/router';

/**
 * Component responsible for displaying and managing user bookmarked exercises.
 * Provides functionality to view saved exercises, navigate to specific exercises,
 * and remove bookmarks with visual indicators for exercise types and difficulty levels.
 */
@Component({
    selector: 'app-bookmarked-exercises',
    templateUrl: './bookmarked-exercises.component.html',
    styleUrls: ['./bookmarked-exercises.component.scss']
})
export class BookmarkedExercisesComponent {
    /**
     * Array of bookmark data containing exercise information to display.
     * Each bookmark includes exercise details, difficulty level, and topic information.
     * 
     * @type {BookmarkData[]} Array of bookmark objects with exercise metadata
     */
    @Input() bookmarks: BookmarkData[] = [];
    
    /**
     * Event emitter that notifies parent component when a bookmark should be removed.
     * Emits the bookmark ID to allow parent component to handle the deletion.
     * 
     * @type {EventEmitter<number>} Emits bookmark ID when removal is requested
     */
    @Output() removeBookmark = new EventEmitter<number>();
    
    constructor(private router: Router) {}
      /**
     * Navigates to the specified exercise detail page.
     * Uses Angular Router to redirect user to the exercise detail component.
     * 
     * @param {number} topicId - The unique identifier of the topic containing the exercise (not used for navigation)
     * @param {number} exerciseId - The unique identifier of the exercise to navigate to
     */
    navigateToExercise(topicId: number, exerciseId: number): void {
        this.router.navigate(['/exercises', exerciseId]);
    }
    
    /**
     * Returns the appropriate Material Design icon name for the given exercise type.
     * Provides visual representation to help users quickly identify exercise types.
     * 
     * @param {string} type - The exercise type (QUERY, SINGLE_CHOICE, MULTIPLE_CHOICE, FREETEXT)
     * @returns {string} Material Design icon name corresponding to the exercise type
     */
    getExerciseTypeIcon(type: string): string {
        switch (type) {
            case 'QUERY': return 'code';
            case 'SINGLE_CHOICE': return 'radio_button_checked';
            case 'MULTIPLE_CHOICE': return 'check_box';
            case 'FREETEXT': return 'text_fields';
            default: return 'assignment';
        }
    }
    
    /**
     * Returns the appropriate color code for the given difficulty level.
     * Provides visual indication of exercise complexity using color coding.
     * 
     * @param {string} difficulty - The difficulty level (EASY, MEDIUM, HARD)
     * @returns {string} CSS color name or hex code representing the difficulty level
     */
    getDifficultyColor(difficulty: string): string {
        switch (difficulty) {
            case 'EASY': return 'green';
            case 'MEDIUM': return 'orange';
            case 'HARD': return 'red';
            default: return 'gray';
        }
    }
}

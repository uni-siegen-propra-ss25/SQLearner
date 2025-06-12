import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Chapter } from '../../models/chapter.model';
import { Topic } from '../../models/topic.model';
import { RoadmapService } from '../../services/roadmap.service';
import { TopicDialogComponent } from '../../dialogs/topic-dialog/topic-dialog.component';

/**
 * Component for displaying and managing individual chapters in the roadmap.
 * Handles chapter expansion, topic loading, and bookmark event propagation.
 * Supports CRUD operations for topics within the chapter and integrates with the bookmark system.
 */
@Component({
    selector: 'app-chapter-card',
    templateUrl: './chapter-card.component.html',
    styleUrls: ['./chapter-card.component.scss'],
})
export class ChapterCardComponent implements OnInit {
    @Input() chapter!: Chapter;
    @Input() isTutor = false;
    
    /**
     * Set of exercise IDs that are currently bookmarked by the user.
     * Used to determine bookmark status for exercises within this chapter.
     * Passed down to child topic components for bookmark state synchronization.
     * @type {Set<number>}
     */
    @Input() bookmarkedExerciseIds: Set<number> = new Set();
    
    /**
     * Set of exercise IDs that are completed by the user.
     * Used to determine completion status for exercises within this chapter.
     * Passed down to child topic components for completion state synchronization.
     * @type {Set<number>}
     */
    @Input() completedExerciseIds: Set<number> = new Set();
    
    @Output() edit = new EventEmitter<Chapter>();
    @Output() delete = new EventEmitter<number>();
    
    /**
     * Emits bookmark toggle events from child topic components to parent roadmap component.
     * Enables real-time bookmark synchronization across the entire roadmap hierarchy.
     * @type {EventEmitter<{exerciseId: number; isBookmarked: boolean}>}
     */
    @Output() bookmarkToggled = new EventEmitter<{ exerciseId: number; isBookmarked: boolean }>();

    @Output() exerciseCompleted = new EventEmitter<number>();

    topics: Topic[] = [];
    isExpanded = false;
    error: string | null = null;

    constructor(
        private readonly roadmapService: RoadmapService,
        private readonly dialog: MatDialog,
    ) {}

    ngOnInit(): void {
        if (!this.chapter) {
            this.error = 'Chapter data is required';
            console.error('ChapterCardComponent: chapter input is required');
        }
    }

    /**
     * Loads topics for the current chapter from the backend.
     * Sorts topics by their order property for consistent display.
     * Only loads when the chapter is expanded to optimize performance.
     */
    loadTopics(): void {
        if (!this.chapter) {
            this.error = 'Cannot load topics: Chapter data is missing';
            return;
        }

        if (this.isExpanded) {
            this.roadmapService.getTopics(this.chapter.id).subscribe({
                next: (topics) => {
                    this.topics = topics.sort((a, b) => a.order - b.order);
                    this.error = null;
                },
                error: (err) => {
                    this.error = 'Failed to load topics';
                    console.error('Failed to load topics:', err);
                },
            });
        }
    }

    /**
     * Handles chapter expansion state changes.
     * Triggers topic loading when the chapter is expanded for the first time.
     * Optimizes performance by lazy-loading topic data.
     */
    onExpand(): void {
        this.isExpanded = !this.isExpanded;
        if (this.isExpanded) {
            this.loadTopics();
        }
    }

    /**
     * Opens dialog for creating a new topic within this chapter.
     * Sets the order based on current topic count and handles dialog result.
     * Refreshes topic list after successful creation.
     */
    openNewTopicDialog(): void {
        const dialogRef = this.dialog.open(TopicDialogComponent, {
            width: '600px',
            data: {
                chapterId: this.chapter!.id,
                order: this.topics.length,
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                result.chapterId = this.chapter!.id;
                this.roadmapService.createTopic(this.chapter!.id, result).subscribe(() => {
                    this.loadTopics();
                });
            }
        });
    }

    /**
     * Opens dialog for editing an existing topic.
     * Pre-fills dialog with current topic data and handles update operations.
     * Refreshes topic list after successful update.
     * @param {Topic} topic - The topic to be edited
     */
    onTopicEdit(topic: Topic): void {
        const dialogRef = this.dialog.open(TopicDialogComponent, {
            width: '600px',
            data: topic,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.roadmapService
                    .updateTopic(this.chapter!.id, topic.id, result)
                    .subscribe(() => {
                        this.loadTopics();
                    });
            }
        });
    }

    /**
     * Handles topic deletion with user confirmation.
     * Warns user about cascade deletion of all exercises within the topic.
     * Refreshes topic list after successful deletion.
     * @param {number} topicId - The ID of the topic to be deleted
     */
    onTopicDelete(topicId: number): void {
        if (confirm('Are you sure you want to delete this topic and all its exercises?')) {
            this.roadmapService.deleteTopic(this.chapter!.id, topicId).subscribe(() => {
                this.loadTopics();
            });
        }
    }

    /**
     * Handles bookmark toggle events from child topic components.
     * Forwards the event to the parent roadmap component for centralized bookmark management.
     * Maintains the event flow for real-time bookmark synchronization across components.
     * @param {Object} event - Object containing exercise ID and new bookmark status
     * @param {number} event.exerciseId - ID of the exercise being bookmarked/unbookmarked
     * @param {boolean} event.isBookmarked - New bookmark status of the exercise
     */
    onBookmarkToggled(event: { exerciseId: number; isBookmarked: boolean }): void {
        this.bookmarkToggled.emit(event);
    }

    onExerciseCompleted(exerciseId: number): void {
        this.exerciseCompleted.emit(exerciseId);
    }
}

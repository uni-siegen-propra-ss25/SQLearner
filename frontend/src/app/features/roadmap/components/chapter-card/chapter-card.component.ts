import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Chapter } from '../../models/chapter.model';
import { Topic } from '../../models/topic.model';
import { RoadmapService } from '../../services/roadmap.service';
import { TopicDialogComponent } from '../../dialogs/topic-dialog/topic-dialog.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-chapter-card',
  templateUrl: './chapter-card.component.html',
  styleUrls: ['./chapter-card.component.scss']
})
export class ChapterCardComponent implements OnInit {
  @Input() chapter!: Chapter;
  @Input() isTutor = false;
  @Output() edit = new EventEmitter<Chapter>();
  @Output() delete = new EventEmitter<number>();

  topics: Topic[] = [];
  isExpanded = false;
  error: string | null = null;

  constructor(
    private readonly roadmapService: RoadmapService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    if (!this.chapter) {
      this.error = 'Chapter data is required';
      console.error('ChapterCardComponent: chapter input is required');
    }
  }

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
        }
      });
    }
  }

  onExpand(): void {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      this.loadTopics();
    }
  }

  onTopicDrop(event: CdkDragDrop<Topic[]>): void {
    if (!this.isTutor) return;
    
    moveItemInArray(this.topics, event.previousIndex, event.currentIndex);
    
    const updatedTopics = this.topics.map((topic, index) => ({
      id: topic.id,
      order: index
    }));
    
    this.roadmapService.reorderTopics(this.chapter!.id, updatedTopics).subscribe();
  }

  openNewTopicDialog(): void {
    const dialogRef = this.dialog.open(TopicDialogComponent, {
      width: '600px',
      data: { 
        chapterId: this.chapter!.id,
        order: this.topics.length
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        result.chapterId = this.chapter!.id;
        this.roadmapService.createTopic(this.chapter!.id, result).subscribe(() => {
          this.loadTopics();
        });
      }
    });
  }

  onTopicEdit(topic: Topic): void {
    const dialogRef = this.dialog.open(TopicDialogComponent, {
      width: '600px',
      data: topic
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.roadmapService.updateTopic(this.chapter!.id, topic.id, result).subscribe(() => {
          this.loadTopics();
        });
      }
    });
  }

  onTopicDelete(topicId: number): void {
    if (confirm('Are you sure you want to delete this topic and all its exercises?')) {
      this.roadmapService.deleteTopic(this.chapter!.id, topicId).subscribe(() => {
        this.loadTopics();
      });
    }
  }
} 
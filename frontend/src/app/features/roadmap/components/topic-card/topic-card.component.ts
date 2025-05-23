import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Topic } from '../../models/topic.model';
import { Exercise } from '../../models/exercise.model';
import { RoadmapService } from '../../services/roadmap.service';
import { ExerciseDialogComponent } from '../../dialogs/exercise-dialog/exercise-dialog.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-topic-card',
  templateUrl: './topic-card.component.html',
  styleUrls: ['./topic-card.component.scss']
})
export class TopicCardComponent {
  @Input() topic!: Topic;
  @Input() isTutor = false;
  @Output() edit = new EventEmitter<Topic>();
  @Output() delete = new EventEmitter<number>();

  exercises: Exercise[] = [];
  isExpanded = false;

  constructor(
    private readonly roadmapService: RoadmapService,
    private readonly dialog: MatDialog
  ) {}

  loadExercises(): void {
    if (this.isExpanded) {
      this.roadmapService.getExercises(this.topic.id).subscribe(exercises => {
        this.exercises = exercises.sort((a, b) => a.order - b.order);
      });
    }
  }

  onExpand(): void {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      this.loadExercises();
    }
  }

  onExerciseDrop(event: CdkDragDrop<Exercise[]>): void {
    if (!this.isTutor) return;
    
    moveItemInArray(this.exercises, event.previousIndex, event.currentIndex);
    
    const updatedExercises = this.exercises.map((exercise, index) => ({
      id: exercise.id,
      order: index
    }));
    
    this.roadmapService.reorderExercises(
      this.topic.id,
      updatedExercises
    ).subscribe();
  }

  openNewExerciseDialog(): void {
    const dialogRef = this.dialog.open(ExerciseDialogComponent, {
      width: '800px',
      data: {
        topicId: this.topic.id,
        order: this.exercises.length
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.roadmapService.createExercise(
          this.topic.id,
          result
        ).subscribe(() => {
          this.loadExercises();
        });
      }
    });
  }

  onExerciseEdit(exercise: Exercise): void {
    const dialogRef = this.dialog.open(ExerciseDialogComponent, {
      width: '800px',
      data: exercise
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.roadmapService.updateExercise(
          exercise.id,
          result
        ).subscribe(() => {
          this.loadExercises();
        });
      }
    });
  }

  onExerciseDelete(exerciseId: number): void {
    if (confirm('Are you sure you want to delete this exercise?')) {
      this.roadmapService.deleteExercise(
        exerciseId
      ).subscribe(() => {
        this.loadExercises();
      });
    }
  }
} 
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Topic } from '../../models/topic.model';
import { Exercise } from '../../models/exercise.model';
import { RoadmapService } from '../../services/roadmap.service';
import { ExerciseDialogComponent } from '../../dialogs/exercise-dialog/exercise-dialog.component';

@Component({
    selector: 'app-topic-card',
    templateUrl: './topic-card.component.html',
    styleUrls: ['./topic-card.component.scss'],
})
export class TopicCardComponent implements OnInit {
    @Input() topic!: Topic;
    @Input() isTutor = false;
    @Output() edit = new EventEmitter<Topic>();
    @Output() delete = new EventEmitter<number>();

    exercises: Exercise[] = [];
    isExpanded = false;
    isLoading = false;

    constructor(
        private readonly roadmapService: RoadmapService,
        private readonly dialog: MatDialog,
        private readonly snackBar: MatSnackBar,
    ) {}

    ngOnInit() {
        this.loadExercises();
    }

    loadExercises() {
        this.isLoading = true;
        this.roadmapService.getExercises(this.topic.id).subscribe({
            next: (exercises) => {
                this.exercises = exercises;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading exercises:', error);
                this.snackBar.open('Failed to load exercises', 'Close', { duration: 3000 });
                this.isLoading = false;
            },
        });
    }

    onExpand(): void {
        this.isExpanded = !this.isExpanded;
        if (this.isExpanded) {
            this.loadExercises();
        }
    }

    openNewExerciseDialog(): void {
        const dialogRef = this.dialog.open(ExerciseDialogComponent, {
            width: '800px',
            data: {
                topicId: this.topic.id,
                order: this.exercises.length,
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.roadmapService.createExercise(this.topic.id, result).subscribe({
                    next: () => {
                        this.loadExercises();
                        this.snackBar.open('Exercise created successfully', 'Close', {
                            duration: 3000,
                        });
                    },
                    error: (error) => {
                        console.error('Error creating exercise:', error);
                        this.snackBar.open('Failed to create exercise', 'Close', {
                            duration: 3000,
                        });
                    },
                });
            }
        });
    }

    onExerciseEdit(exercise: Exercise): void {
        const dialogRef = this.dialog.open(ExerciseDialogComponent, {
            width: '800px',
            data: exercise,
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.roadmapService.updateExercise(this.topic.id, exercise.id, result).subscribe({
                    next: () => {
                        this.loadExercises();
                        this.snackBar.open('Exercise updated successfully', 'Close', {
                            duration: 3000,
                        });
                    },
                    error: (error) => {
                        console.error('Error updating exercise:', error);
                        this.snackBar.open('Failed to update exercise', 'Close', {
                            duration: 3000,
                        });
                    },
                });
            }
        });
    }

    onExerciseDelete(exerciseId: number): void {
        if (confirm('Are you sure you want to delete this exercise?')) {
            this.roadmapService.deleteExercise(this.topic.id, exerciseId).subscribe({
                next: () => {
                    this.loadExercises();
                    this.snackBar.open('Exercise deleted successfully', 'Close', {
                        duration: 3000,
                    });
                },
                error: (error) => {
                    console.error('Error deleting exercise:', error);
                    this.snackBar.open('Failed to delete exercise', 'Close', { duration: 3000 });
                },
            });
        }
    }
}

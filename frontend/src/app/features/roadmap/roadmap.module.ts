import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MaterialModule } from '../../material.module';
import { RoadmapRoutingModule } from './roadmap-routing.module';
import { RoadmapViewComponent } from './components/roadmap-view/roadmap-view.component';
import { ChapterCardComponent } from './components/chapter-card/chapter-card.component';
import { TopicCardComponent } from './components/topic-card/topic-card.component';
import { ExerciseCardComponent } from './components/exercise-card/exercise-card.component';
import { ChapterDialogComponent } from './dialogs/chapter-dialog/chapter-dialog.component';
import { TopicDialogComponent } from './dialogs/topic-dialog/topic-dialog.component';
import { ExerciseDialogComponent } from './dialogs/exercise-dialog/exercise-dialog.component';
import { ExercisesModule } from '../exercises/exercises.module';


@NgModule({
  declarations: [
    RoadmapViewComponent,
    ChapterCardComponent,
    TopicCardComponent,
    ExerciseCardComponent,
    ChapterDialogComponent,
    TopicDialogComponent,
    ExerciseDialogComponent
  ],
  imports: [
    CommonModule,
    RoadmapRoutingModule,
    ReactiveFormsModule,
    DragDropModule,
    MaterialModule,
    ExercisesModule
  ]
})
export class RoadmapModule { }
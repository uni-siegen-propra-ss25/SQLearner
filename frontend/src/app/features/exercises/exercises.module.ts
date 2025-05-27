import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExercisesRoutingModule } from './exercises-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'app/material.module';
import { ChoiceExerciseComponent } from './components/choice-exercise/choice-exercise.component';
import { FreetextExerciseComponent } from './components/freetext-exercise/freetext-exercise.component';
import { QueryExerciseComponent } from './components/query-exercise/query-exercise.component';
import { DynamicExerciseComponent } from './components/dynamic-exercise.component';

@NgModule({
  declarations: [
    ChoiceExerciseComponent,
    QueryExerciseComponent,
    FreetextExerciseComponent,
    DynamicExerciseComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    ReactiveFormsModule,
    ExercisesRoutingModule
  ],
  exports: [
    ChoiceExerciseComponent,
    QueryExerciseComponent,
    FreetextExerciseComponent,
    DynamicExerciseComponent
  ]
})
export class ExercisesModule {}

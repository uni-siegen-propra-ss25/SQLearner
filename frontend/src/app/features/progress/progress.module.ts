import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressRoutingModule } from './progress-routing.module';
import { MaterialModule } from '../../material.module';
import { ProgressViewComponent } from './components/progress-view/progress-view.component';
import { ChapterProgressComponent } from './components/chapter-progress/chapter-progress.component';
import { BookmarkedExercisesComponent } from './components/bookmarked-exercises/bookmarked-exercises.component';

@NgModule({
    declarations: [
        ProgressViewComponent,
        ChapterProgressComponent,
        BookmarkedExercisesComponent
    ],
    imports: [
        CommonModule,
        ProgressRoutingModule,
        MaterialModule
    ]
})
export class ProgressModule { }

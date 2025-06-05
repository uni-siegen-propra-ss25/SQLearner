import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationRailComponent } from './components/navigation-rail/navigation-rail.component';
import { SqlEditorComponent } from './components/sql-editor/sql-editor.component';
import { MonacoEditorService } from './services/monaco-editor.service';
import { MaterialModule } from '../material.module';

@NgModule({
    declarations: [NavigationRailComponent, SqlEditorComponent],
    imports: [CommonModule, MaterialModule, RouterModule],
    exports: [NavigationRailComponent, SqlEditorComponent],
    providers: [MonacoEditorService],
})
export class SharedModule {}

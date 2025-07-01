import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationRailComponent } from './components/navigation-rail/navigation-rail.component';
import { SqlEditorComponent } from './components/sql-editor/sql-editor.component';
import { ErDiagramComponent } from './components/er-diagram/er-diagram.component';
import { MonacoEditorService } from './services/monaco-editor.service';
import { MaterialModule } from '../material.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
    declarations: [NavigationRailComponent, SqlEditorComponent, ErDiagramComponent],
    imports: [CommonModule, MaterialModule, RouterModule, TranslateModule],
    exports: [NavigationRailComponent, SqlEditorComponent, ErDiagramComponent, TranslateModule],
    providers: [MonacoEditorService],
})
export class SharedModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavigationRailComponent } from './components/navigation-rail/navigation-rail.component';
import { SqlEditorComponent } from './components/sql-editor/sql-editor.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TodoWidgetComponent } from './components/todo-widget/todo-widget.component';
import { ChatWidgetComponent } from './components/chat-widget/chat-widget.component';
import { HintsWidgetComponent } from './components/hints-widget/hints-widget.component';
import { MonacoEditorService } from './services/monaco-editor.service';
import { MaterialModule } from '../material.module';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
    declarations: [
        NavigationRailComponent,
        SqlEditorComponent,
        DashboardComponent,
        TodoWidgetComponent,
        ChatWidgetComponent,
        HintsWidgetComponent
    ],
    imports: [
        CommonModule,
        MaterialModule,
        RouterModule,
        TranslateModule,
        FormsModule
    ],
    exports: [
        NavigationRailComponent,
        SqlEditorComponent,
        DashboardComponent,
        TodoWidgetComponent,
        ChatWidgetComponent,
        HintsWidgetComponent,
        TranslateModule
    ],
    providers: [MonacoEditorService],
})
export class SharedModule {}

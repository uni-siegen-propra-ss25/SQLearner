import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DatabaseListComponent } from './components/database-list/database-list.component';
import { DatabaseTableViewerComponent } from './components/database-table-viewer/database-table-viewer.component';

const routes: Routes = [
    {
        path: '',
        component: DatabaseListComponent,
    },
    {
        path: ':id',
        component: DatabaseTableViewerComponent,
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DatabaseRoutingModule { }
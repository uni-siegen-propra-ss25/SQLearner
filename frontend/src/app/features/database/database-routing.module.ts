import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DatabaseListComponent } from './components/database-list/database-list.component';
import { RoleGuard } from '../../core/guards/role.guard';
import { Role } from '../users/models/role.model';

const routes: Routes = [
    {
        path: '',
        component: DatabaseListComponent,
        canActivate: [RoleGuard],
        data: {
            allowedRoles: [Role.TUTOR, Role.ADMIN]
        }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DatabaseRoutingModule { }

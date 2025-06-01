import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NavigationRailComponent } from './shared/components/navigation-rail/navigation-rail.component';
import { Role } from './features/users/models/role.model';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
    { path: '', redirectTo: 'welcome', pathMatch: 'full' },
    {
        path: 'welcome',
        loadChildren: () =>
            import('./features/welcome/welcome.module').then((m) => m.WelcomeModule),
    },
    {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule),
    },
    {
        path: 'roadmap',
        loadChildren: () =>
            import('./features/roadmap/roadmap.module').then((m) => m.RoadmapModule),
        canActivate: [RoleGuard],
        data: {
            allowedRoles: [Role.STUDENT, Role.TUTOR, Role.ADMIN],
        },
    },
    {
        path: 'exercises',
        loadChildren: () =>
            import('./features/exercises/exercises.module').then((m) => m.ExercisesModule),
        canActivate: [RoleGuard],
        data: {
            allowedRoles: [Role.STUDENT, Role.TUTOR, Role.ADMIN],
        },
    },
    {
        path: 'progress',
        loadChildren: () => import('./features/progress/progress.module').then((m) => m.ProgressModule),
        canActivate: [RoleGuard],
        data: {
            allowedRoles: [Role.STUDENT, Role.TUTOR, Role.ADMIN],
        },
    },
    {
        path: 'users',
        loadChildren: () => import('./features/users/users.module').then((m) => m.UsersModule),
        canActivate: [RoleGuard],
        data: {
            allowedRoles: [Role.TUTOR, Role.ADMIN],
        },
    },
    {
        path: 'databases',
        loadChildren: () =>
            import('./features/database/database.module').then((m) => m.DatabaseModule),
        canActivate: [RoleGuard],
        data: {
            allowedRoles: [Role.TUTOR],
        },
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule {}

import { NgModule } from '@angular/core';
import { LoginComponent } from './components/login/login.component';
import { RouterModule, Routes } from '@angular/router';

/**
 * Routes for authentication: login and registration.
 */
const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AuthRoutingModule {}

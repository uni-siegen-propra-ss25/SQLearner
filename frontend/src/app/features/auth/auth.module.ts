import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthRoutingModule } from './auth-routing.module';
import { MaterialModule } from '../../material.module';
@NgModule({
    declarations: [RegisterComponent, LoginComponent],
    imports: [CommonModule, ReactiveFormsModule, AuthRoutingModule, MaterialModule],
})
export class AuthModule {}

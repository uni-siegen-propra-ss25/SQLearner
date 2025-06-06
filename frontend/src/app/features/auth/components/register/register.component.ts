import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterCredentials } from '../../models/register-credentials.model';
import { Role } from '../../../users/models/role.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
    registerForm: FormGroup;
    hidePassword = true;
    hideConfirmPassword = true;
    roles = [Role.STUDENT, Role.TUTOR];
    Role = Role;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService,
        private snackBar: MatSnackBar,
    ) {
        this.registerForm = this.fb.group(
            {
                firstName: ['', [Validators.required]],
                lastName: ['', [Validators.required]],
                email: ['', [Validators.required, Validators.email]],
                password: ['', [Validators.required, Validators.minLength(8)]],
                confirmPassword: ['', [Validators.required]],
                role: [Role.STUDENT, [Validators.required]],
                matriculationNumber: [''],
            },
            {
                validators: [this.passwordMatchValidator, this.matriculationNumberValidator],
            },
        );

        // Update matriculationNumber validators on role change
        this.registerForm.get('role')?.valueChanges.subscribe((role) => {
            const matCtrl = this.registerForm.get('matriculationNumber');
            if (role === Role.STUDENT) {
                matCtrl?.setValidators([Validators.required]);
            } else {
                matCtrl?.clearValidators();
                matCtrl?.setValue('');
            }
            matCtrl?.updateValueAndValidity();
        });
    }

    private passwordMatchValidator(form: AbstractControl) {
        const password = form.get('password');
        const confirmPassword = form.get('confirmPassword');
        if (password && confirmPassword && password.value !== confirmPassword.value) {
            return { passwordMismatch: true };
        }
        return null;
    }

    private matriculationNumberValidator(form: AbstractControl) {
        const role = form.get('role')?.value;
        const matNum = form.get('matriculationNumber')?.value;
        if (role === Role.STUDENT && (!matNum || matNum.trim() === '')) {
            return { matriculationNumberRequired: true };
        }
        return null;
    }

    get isStudent(): boolean {
        return this.registerForm.get('role')?.value === Role.STUDENT;
    }

    onSubmit(): void {
        if (this.registerForm.valid) {
            const credentials: RegisterCredentials = {
                firstName: this.registerForm.value.firstName,
                lastName: this.registerForm.value.lastName,
                email: this.registerForm.value.email,
                password: this.registerForm.value.password,
                role: this.registerForm.value.role,
                matriculationNumber: this.isStudent
                    ? this.registerForm.value.matriculationNumber
                    : '',
            };
            this.authService.register(credentials).subscribe({
                next: (res) => {
                    this.router.navigate(['auth/login']);
                    this.snackBar.open('Registration successful', 'Close', {
                        duration: 3000,
                        panelClass: ['mat-toolbar', 'mat-primary'],
                    });
                },
                error: (err) => {
                    this.snackBar.open('Registration failed', 'Close', {
                        duration: 3000,
                        panelClass: ['mat-toolbar', 'mat-warn'],
                    });
                },
            });
        }
    }
}

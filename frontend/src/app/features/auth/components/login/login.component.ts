import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginCredentials } from '../../models/login-credentials.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
    loginForm: FormGroup;
    hidePassword = true;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService,
        private snackBar: MatSnackBar,
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]],
        });
    }

    onSubmit(): void {
        if (this.loginForm.valid) {
            const credentials: LoginCredentials = {
                email: this.loginForm.value.email,
                password: this.loginForm.value.password,
            };

            this.authService.login(credentials).subscribe({
                next: () => {
                    const role = this.authService.getUserRole();

                    if (role === 'TUTOR') {
                        this.router.navigate(['/welcome/tutor']);
                    } else if (role === 'STUDENT') {
                        this.router.navigate(['/welcome/student']);
                    } else {
                        this.router.navigate(['/welcome']); // Fallback
                    }

                    this.snackBar.open('Login erfolgreich!', 'Schließen', { duration: 2000 });
                },
                error: (err) => {
                    this.snackBar.open('Login fehlgeschlagen', 'Schließen', { duration: 3000 });
                    console.error('Login error:', err);
                },
            });
        }
    }
}


import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../auth/services/auth.service';

@Component({
    selector: 'app-welcome',
    templateUrl: './welcome.component.html',
    styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent implements OnInit {
    isLoggedIn: boolean = false;

    constructor(private authService: AuthService) {}

    ngOnInit(): void {
        this.authService.isLoggedIn$.subscribe((loggedIn) => {
            this.isLoggedIn = loggedIn;
        });
    }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { Role } from '../models/role.model';
import { RegisterCredentials } from '../../auth/models/register-credentials.model';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class UserService {
    private readonly apiUrl = `${environment.apiUrl}/users`;

    private readonly httpOptions = {
        headers: { 'Content-Type': 'application/json' },
    };

    constructor(private http: HttpClient) {}

    getAllUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/getAllUsers`);
    }

    getUsersByRole(role: Role): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/byRole/${role}`);
    }

    createUser(user: RegisterCredentials): Observable<number> {
        return this.http.post<number>(
            `${environment.apiUrl}/auth/register`,
            user,
            this.httpOptions,
        );
    }

    updateUserRole(userId: number, role: Role): Observable<User> {
        return this.http.patch<User>(`${this.apiUrl}/${userId}/role`, { role }, this.httpOptions);
    }

    updateUser(userId: number, updates: Partial<User>): Observable<User> {
        return this.http.patch<User>(`${this.apiUrl}/${userId}`, updates, this.httpOptions);
    }

    updateUserPassword(userId: number, password: string): Observable<User> {
        return this.http.patch<User>(
            `${this.apiUrl}/${userId}/password`,
            { password },
            this.httpOptions,
        );
    }

    deleteUser(userId: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${userId}`);
    }
}

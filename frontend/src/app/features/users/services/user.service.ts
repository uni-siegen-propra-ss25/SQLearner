import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { Role } from '../models/role.model';
import { RegisterCredentials } from '../../auth/models/register-credentials.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/getAllUsers`);
  }

  getUsersByRole(role: Role): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/byRole/${role}`);
  }

  createUser(user: RegisterCredentials): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/create`, user);
  }

  updateUserRole(userId: number, role: Role): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}/role`, { role });
  }

  updateUser(userId: number, updates: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}`, updates);
  }

  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`);
  }
}

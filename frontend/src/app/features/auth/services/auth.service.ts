import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, tap, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { LoginCredentials } from '../models/login-credentials.model';
import { RegisterCredentials } from '../models/register-credentials.model';
import { LoginResponse } from '../models/login-response.model';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = 'http://localhost:3000/auth';
  private readonly tokenKey = 'ACCESS_TOKEN';

  httpOptions = {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    };

  private _isLoggedIn$ = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$ = this._isLoggedIn$.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  /** Registers a new user. */
  register(data: RegisterCredentials): Observable<number> {
    return this.http.post<number>(`${this.baseUrl}/register`, data, this.httpOptions);
  }

  /** Logs in and stores token + updates login status. */
  login(data: LoginCredentials): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/login`, data, this.httpOptions)
      .pipe(
        tap(res => {
          this.saveToken(res.accessToken);
          this._isLoggedIn$.next(true);
        })
      );
  }

  /** Logs out the current user. */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this._isLoggedIn$.next(false);
    this.router.navigate(['/auth/login']);
  }

  /** Saves the JWT to local storage. */
  private saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  /** Returns the raw JWT or null. */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /** Decodes the token payload into an object or null. */
  getUserFromToken(): { sub: number; email: string; role: string; firstName: string; lastName: string; } | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        firstName: payload.firstName,
        lastName: payload.lastName,
      };
    } catch {
      return null;
    }
  }

  /** Helper for your AuthGuard: */
  hasToken(): boolean {
    return !!this.getToken();
  }

  /** Convenience getters: */
  getUserRole(): string | null {
    return this.getUserFromToken()?.role ?? null;
  }

  getUserId(): number | null {
    return this.getUserFromToken()?.sub ?? null;
  }
}
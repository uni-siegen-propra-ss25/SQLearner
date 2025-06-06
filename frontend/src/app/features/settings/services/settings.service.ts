import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Setting {
  name: string;
  value?: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly baseUrl = `${environment.apiUrl}/settings`;

  constructor(private http: HttpClient) {}

  getSetting(name: string): Observable<{ value: string | null }> {
    return this.http.get<{ value: string | null }>(`${this.baseUrl}/${name}`);
  }

  setSetting(name: string, value: string, description?: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.baseUrl}/${name}`, { value, description });
  }

  getAllSettings(): Observable<Setting[]> {
    return this.http.get<Setting[]>(this.baseUrl);
  }

  deleteSetting(name: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${name}`);
  }
}

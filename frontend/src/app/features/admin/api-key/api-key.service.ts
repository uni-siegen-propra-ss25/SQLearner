import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  private readonly baseUrl = '/api/settings/api-key';

  constructor(private http: HttpClient) {}

  getApiKey(): Observable<{ apiKey: string | null }> {
    return this.http.get<{ apiKey: string | null }>(this.baseUrl);
  }

  setApiKey(apiKey: string): Observable<any> {
    return this.http.post(this.baseUrl, { apiKey });
  }
}

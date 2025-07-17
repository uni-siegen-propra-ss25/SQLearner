import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
    private readonly baseUrl =  environment.apiUrl;

    constructor(private http: HttpClient) {}

    getApiKey(): Observable<{ apiKey: string | null }> {
        return this.http.get<{ apiKey: string | null }>(this.baseUrl);
    }

    setApiKey(apiKey: string): Observable<any> {
        return this.http.post(`${this.baseUrl}/settings/api-key`, { apiKey });
    }
}

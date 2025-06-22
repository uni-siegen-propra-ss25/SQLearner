import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DockerService {
  private apiUrl = `${environment.apiUrl}/docker`;

  constructor(private http: HttpClient) { }

  createContainer(exerciseId: number): Observable<{ containerId: string; connectionDetails: any }> {
    return this.http.post<{ containerId: string; connectionDetails: any }>(`${this.apiUrl}/containers/${exerciseId}`, {});
  }

  deleteContainer(containerId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/containers/${containerId}`);
  }
} 
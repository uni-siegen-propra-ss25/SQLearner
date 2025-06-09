import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Hint {
  id: number;
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class HintService {
  private apiUrl = 'http://localhost:3000/api/hints';

  constructor(private http: HttpClient) {}

  getHints(): Observable<Hint[]> {
    return this.http.get<Hint[]>(this.apiUrl);
  }

  addHint(text: string): Observable<Hint> {
    return this.http.post<Hint>(this.apiUrl, { text });
  }

  deleteHint(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

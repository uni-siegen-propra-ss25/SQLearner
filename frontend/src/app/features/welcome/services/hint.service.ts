import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Datenmodell für einen Hinweis
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

  /**
   * Lädt alle vorhandenen Hinweise vom Server
   */
  getHints(): Observable<Hint[]> {
    return this.http.get<Hint[]>(this.apiUrl);
  }

  /**
   * Fügt einen neuen Hinweis auf dem Server hinzu
   */
  addHint(text: string): Observable<Hint> {
    return this.http.post<Hint>(this.apiUrl, { text });
  }

  /**
   * Löscht einen Hinweis anhand der ID
   */
  deleteHint(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

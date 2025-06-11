import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Data model representing a hint.
 */
export interface Hint {
  id: number;
  text: string;
}

@Injectable({
  providedIn: 'root'
})
/**
 * Service for managing hint objects.
 * Handles HTTP requests to retrieve, add, and delete hints.
 */
export class HintService {
  private apiUrl = 'http://localhost:3000/api/hints';

  constructor(private http: HttpClient) {}

  /**
   * Retrieves all hints from the backend.
   * @returns Observable containing an array of Hint objects.
   */
  getHints(): Observable<Hint[]> {
    return this.http.get<Hint[]>(this.apiUrl);
  }

  /**
   * Adds a new hint to the server.
   * @param text The hint text to be added.
   * @returns Observable containing the created Hint.
   */
  addHint(text: string): Observable<Hint> {
    return this.http.post<Hint>(this.apiUrl, { text });
  }

  /**
   * Deletes a specific hint by its ID.
   * @param id The ID of the hint to delete.
   * @returns Observable indicating completion.
   */
  deleteHint(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

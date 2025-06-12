import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Data model representing a question in the forum.
 */
export interface Question {
  id: number;
  student_name: string;
  frage: string;
  antwort?: string;
  ist_archiviert: boolean;
  ist_angepinnt: boolean;
  erstellt_am: string;
  ist_geloescht: boolean;
  ist_beantwortet: boolean;
}

@Injectable({
  providedIn: 'root',
})
/**
 * Service to manage questions in the forum.
 * Provides methods to create, update, archive, pin, delete and retrieve questions.
 */
export class QuestionService {
  private apiUrl = 'http://localhost:3000/api/questions';

  constructor(private http: HttpClient) {}

  /**
   * Retrieves all questions from the server.
   * @returns Observable containing an array of Question objects.
   */
  getAll(): Observable<Question[]> {
    return this.http.get<Question[]>(this.apiUrl);
  }

  /**
   * Creates a new question.
   * @param question Object containing student name and question text.
   * @returns Observable with the created question.
   */
  create(question: { student_name: string; frage: string }): Observable<Question> {
    return this.http.post<Question>(this.apiUrl, question);
  }

  /**
   * Submits an answer to a question.
   * @param id ID of the question.
   * @param antwort Answer text.
   */
  antworten(id: number, antwort: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/antwort`, { antwort });
  }

  /**
   * Archives or unarchives a question.
   * @param id ID of the question.
   * @param ist_archiviert New archive status.
   */
  archivieren(id: number, ist_archiviert: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/archiv`, { ist_archiviert });
  }

  /**
   * Pins or unpins a question.
   * @param id ID of the question.
   * @param ist_angepinnt Pin status.
   */
  pin(id: number, ist_angepinnt: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/pin`, { ist_angepinnt });
  }

  /**
   * Marks a question as soft-deleted (moves to trash).
   * @param id ID of the question.
   */
  löschen(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/delete`, { ist_geloescht: true });
  }

  /**
   * Updates the soft-delete status (delete or restore).
   * @param id ID of the question.
   * @param ist_geloescht Soft-delete flag.
   */
  patchGeloescht(id: number, ist_geloescht: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/delete`, { ist_geloescht });
  }

  /**
   * Updates the answered status of a question.
   * @param id ID of the question.
   * @param ist_beantwortet Boolean indicating if question is answered.
   */
  patchBeantwortet(id: number, ist_beantwortet: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/beantwortet`, { ist_beantwortet });
  }

  /**
   * Permanently deletes a question.
   * @param id ID of the question.
   */
  hardDelete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Retrieves all soft-deleted (trashed) questions.
   * @returns Observable of deleted Question array.
   */
  getGeloeschte(): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/papierkorb`);
  }
}

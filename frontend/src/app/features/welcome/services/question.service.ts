import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
export class QuestionService {
  private apiUrl = 'http://localhost:3000/api/questions';

  constructor(private http: HttpClient) {}

  // Alle Fragen laden
  getAll(): Observable<Question[]> {
    return this.http.get<Question[]>(this.apiUrl);
  }

  // Neue Frage erstellen
  create(question: { student_name: string; frage: string }): Observable<Question> {
    return this.http.post<Question>(this.apiUrl, question);
  }

  // Antwort speichern
  antworten(id: number, antwort: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/antwort`, { antwort });
  }

  // Archivieren oder wiederherstellen
  archivieren(id: number, ist_archiviert: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/archiv`, { ist_archiviert });
  }

  // Frage anpinnen oder entpinnen
  pin(id: number, ist_angepinnt: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/pin`, { ist_angepinnt });
  }

  // Soft-Löschen (in den Papierkorb verschieben)
  löschen(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/delete`, { ist_geloescht: true });
  }

  // Soft-Löschen UND Wiederherstellen über den Papierkorb
  patchGeloescht(id: number, ist_geloescht: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/delete`, { ist_geloescht });
  }

  // Frage als beantwortet markieren oder zurücksetzen
  patchBeantwortet(id: number, ist_beantwortet: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/beantwortet`, { ist_beantwortet });
  }

  // Vollständig löschen (Hard Delete – optional)
  hardDelete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

}

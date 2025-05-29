import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { BookmarkData } from '../models/bookmark.model';

@Injectable({
    providedIn: 'root'
})
export class BookmarkService {
    private readonly baseUrl = environment.apiUrl;

    constructor(private readonly http: HttpClient) { }

    private handleError(error: HttpErrorResponse): Observable<never> {
        let errorMessage = 'Ein Fehler ist aufgetreten';
        if (error.error instanceof ErrorEvent) {
            // Client-side Fehler
            errorMessage = error.error.message;
        } else {
            // Server-side Fehler
            errorMessage = `Fehlercode: ${error.status}\nNachricht: ${error.message}`;
        }
        console.error(errorMessage);
        return throwError(() => new Error(errorMessage));
    }    getUserBookmarks(): Observable<BookmarkData[]> {
        return this.http
            .get<BookmarkData[]>(`${this.baseUrl}/api/bookmarks/user`)
            .pipe(catchError((error) => this.handleError(error)));
    }

    addBookmark(exerciseId: number): Observable<BookmarkData> {
        return this.http
            .post<BookmarkData>(`${this.baseUrl}/api/bookmarks`, { exerciseId })
            .pipe(catchError((error) => this.handleError(error)));
    }

    removeBookmark(id: number): Observable<void> {
        return this.http
            .delete<void>(`${this.baseUrl}/api/bookmarks/${id}`)
            .pipe(catchError((error) => this.handleError(error)));
    }
}

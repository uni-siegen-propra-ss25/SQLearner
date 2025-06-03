import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Database, CreateDatabaseDto, UpdateDatabaseDto } from '../models/database.model';
import { AuthService } from 'app/features/auth/services/auth.service';

export interface QueryResult {
    columns: string[];
    rows: any[];
    rowCount?: number;
    command?: string;
    error?: string;
}

@Injectable({
    providedIn: 'root',
})
export class DatabaseService {
    private readonly baseUrl = `${environment.apiUrl}/databases`;

    constructor(
        private readonly http: HttpClient,
        private readonly authService: AuthService,
    ) {}

    private convertDates(database: Database): Database {
        return {
            ...database,
            createdAt: new Date(database.createdAt),
            updatedAt: new Date(database.updatedAt),
        };
    }

    getAllDatabases(): Observable<Database[]> {
        return this.http
            .get<Database[]>(this.baseUrl)
            .pipe(map((databases) => databases.map((db) => this.convertDates(db))));
    }

    getDatabase(id: number): Observable<Database> {
        return this.http
            .get<Database>(`${this.baseUrl}/${id}`)
            .pipe(map((database) => this.convertDates(database)));
    }

    createDatabase(database: CreateDatabaseDto): Observable<Database> {
        console.log('DatabaseService - Creating database with data:', database);
        console.log('DatabaseService - Current user role:', this.authService.getUserRole());
        console.log('DatabaseService - Is user a tutor?', this.authService.isTutor());
        console.log('DatabaseService - Auth token:', this.authService.getToken());

        return this.http.post<Database>(this.baseUrl, database).pipe(
            map((database) => {
                console.log('DatabaseService - Database created successfully:', database);
                return this.convertDates(database);
            }),
            catchError((error) => {
                console.error('DatabaseService - Error creating database:', error);
                console.error('DatabaseService - Error details:', error.error);
                throw error;
            }),
        );
    }

    updateDatabase(id: number, database: UpdateDatabaseDto): Observable<Database> {
        return this.http
            .put<Database>(`${this.baseUrl}/${id}`, database)
            .pipe(map((database) => this.convertDates(database)));
    }

    deleteDatabase(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    uploadSqlFile(file: File): Observable<Database> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http
            .post<Database>(`${this.baseUrl}/upload`, formData)
            .pipe(map((database) => this.convertDates(database)));
    }

    runQuery(databaseId: number, query: string): Observable<QueryResult> {
        return this.http.post<QueryResult>(`${this.baseUrl}/${databaseId}/query`, { query });
    }
}

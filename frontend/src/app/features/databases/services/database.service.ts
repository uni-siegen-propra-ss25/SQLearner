import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
    Database, 
    CreateDatabaseDto, 
    UpdateDatabaseDto
} from '../models/database.model';
import { environment } from '../../../../environments/environment';

export interface QueryResult {
    columns: string[];
    rows: Record<string, any>[];
    rowCount?: number;
    executionTimeMs?: number;
}

@Injectable({
    providedIn: 'root'
})
export class DatabaseService {
    private apiUrl = `${environment.apiUrl}/databases`;

    constructor(private http: HttpClient) {}

    // Database operations
    getAllDatabases(): Observable<Database[]> {
        return this.http.get<Database[]>(this.apiUrl);
    }

    getDatabaseById(id: number): Observable<Database> {
        return this.http.get<Database>(`${this.apiUrl}/${id}`);
    }

    createDatabase(dto: CreateDatabaseDto): Observable<Database> {
        return this.http.post<Database>(this.apiUrl, dto);
    }

    updateDatabase(id: number, dto: UpdateDatabaseDto): Observable<Database> {
        return this.http.put<Database>(`${this.apiUrl}/${id}`, dto);
    }

    deleteDatabase(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    uploadDatabase(file: File): Observable<Database> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<Database>(`${this.apiUrl}/upload`, formData);
    }

    // Query operations
    runQuery(databaseId: number, query: string): Observable<QueryResult> {
        return this.http.post<QueryResult>(
            `${this.apiUrl}/${databaseId}/query`,
            { query }
        );
    }
}
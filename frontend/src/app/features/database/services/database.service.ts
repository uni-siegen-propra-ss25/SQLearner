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
    executionTime?: number;
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
        console.log('Creating database:', database);

        return this.http.post<Database>(this.baseUrl, database).pipe(
            map((database) => {
                console.log('Database created successfully:', database);
                return this.convertDates(database);
            }),
            catchError((error) => {
                console.error('Error creating database:', error);
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

    truncateTable(databaseId: number, tableId: number): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/${databaseId}/tables/${tableId}/truncate`, {});
    }

    deleteTable(databaseId: number, tableId: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${databaseId}/tables/${tableId}`);
    }

    deleteTableRow(databaseId: number, tableId: number, rowId: any): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${databaseId}/tables/${tableId}/rows/${rowId}`);
    }

    uploadDatabase(file: File): Observable<Database> {
        const formData = new FormData();
        formData.append('file', file);
        const headers = new HttpHeaders({ 'enctype': 'multipart/form-data' });
        return this.http.post<Database>(`${this.baseUrl}/upload`, formData, { headers });
    }

    /**
     * Inserts a new row into a table
     * @param databaseId - The ID of the database
     * @param tableName - The name of the table
     * @param data - The data to insert
     * @returns Observable of the inserted row
     */
    insertRow(databaseId: number, tableName: string, data: Record<string, any>): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/${databaseId}/tables/${tableName}/rows`, { data });
    }

    /**
     * Updates a row in a table
     * @param databaseId - The ID of the database
     * @param tableName - The name of the table
     * @param data - The data to update
     * @param whereClause - The WHERE clause for the update
     * @returns Observable of the updated row
     */
    updateRow(databaseId: number, tableName: string, data: Record<string, any>, whereClause: string): Observable<any> {
        return this.http.put<any>(`${this.baseUrl}/${databaseId}/tables/${tableName}/rows`, { 
            data, 
            whereClause 
        });
    }

    /**
     * Deletes a row from a table
     * @param databaseId - The ID of the database
     * @param tableName - The name of the table
     * @param whereClause - The WHERE clause for the delete
     * @returns Observable of the deletion result
     */
    deleteRow(databaseId: number, tableName: string, whereClause: string): Observable<any> {
        return this.http.delete<any>(`${this.baseUrl}/${databaseId}/tables/${tableName}/rows`, { 
            body: { whereClause } 
        });
    }
}

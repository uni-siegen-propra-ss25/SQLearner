import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
    Database, 
    CreateDatabaseDto, 
    UpdateDatabaseDto, 
    DatabaseTable,
    CreateTableDto,
    UpdateTableDto,
    TableDataDto 
} from '../models/database.model';
import { environment } from '../../../../environments/environment';

export interface QueryResult {
rowCount: any;
    columns: string[];
    rows: any[];
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
        return this.http.patch<Database>(`${this.apiUrl}/${id}`, dto);
    }

    deleteDatabase(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    uploadSqlFile(file: File): Observable<Database> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<Database>(`${this.apiUrl}/upload`, formData);
    }

    // Table operations
    getTables(databaseId: number): Observable<DatabaseTable[]> {
        return this.http.get<DatabaseTable[]>(`${this.apiUrl}/${databaseId}/tables`);
    }

    getTable(databaseId: number, tableId: number): Observable<DatabaseTable> {
        return this.http.get<DatabaseTable>(
            `${this.apiUrl}/${databaseId}/tables/${tableId}`
        );
    }

    createTable(databaseId: number, dto: CreateTableDto): Observable<DatabaseTable> {
        return this.http.post<DatabaseTable>(
            `${this.apiUrl}/${databaseId}/tables`,
            dto
        );
    }

    updateTable(databaseId: number, tableId: number, dto: UpdateTableDto): Observable<DatabaseTable> {
        return this.http.patch<DatabaseTable>(
            `${this.apiUrl}/${databaseId}/tables/${tableId}`,
            dto
        );
    }

    deleteTable(databaseId: number, tableId: number): Observable<void> {
        return this.http.delete<void>(
            `${this.apiUrl}/${databaseId}/tables/${tableId}`
        );
    }

    // Table data operations
    getTableData(databaseId: number, tableId: number): Observable<any[]> {
        return this.http.get<any[]>(
            `${this.apiUrl}/${databaseId}/tables/${tableId}/data`
        );
    }

    insertTableData(databaseId: number, tableId: number, dto: TableDataDto): Observable<void> {
        return this.http.post<void>(
            `${this.apiUrl}/${databaseId}/tables/${tableId}/data`,
            dto
        );
    }

    truncateTable(databaseId: number, tableId: number): Observable<void> {
        return this.http.delete<void>(
            `${this.apiUrl}/${databaseId}/tables/${tableId}/data`
        );
    }

    // Query operations
    runQuery(databaseId: number, query: string): Observable<QueryResult> {
        return this.http.post<QueryResult>(
            `${this.apiUrl}/${databaseId}/query`,
            { query }
        );
    }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { 
    DatabaseTable,
    CreateTableDto,
    UpdateTableDto,
    TableDataDto 
} from '../models/database.model';

@Injectable({
    providedIn: 'root'
})
export class TableService {
    private apiUrl = `${environment.apiUrl}/databases`;

    constructor(private http: HttpClient) {}

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
}
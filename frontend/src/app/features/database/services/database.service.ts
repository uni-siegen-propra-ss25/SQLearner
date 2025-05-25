import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Database, CreateDatabaseDto, UpdateDatabaseDto } from '../models/database.model';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private readonly baseUrl = `${environment.apiUrl}/databases`;

  constructor(private readonly http: HttpClient) {}

  private convertDates(database: Database): Database {
    return {
      ...database,
      createdAt: new Date(database.createdAt),
      updatedAt: new Date(database.updatedAt)
    };
  }

  getDatabases(): Observable<Database[]> {
    return this.http.get<Database[]>(this.baseUrl).pipe(
      map(databases => databases.map(db => this.convertDates(db)))
    );
  }

  getDatabase(id: number): Observable<Database> {
    return this.http.get<Database>(`${this.baseUrl}/${id}`).pipe(
      map(database => this.convertDates(database))
    );
  }

  createDatabase(database: CreateDatabaseDto): Observable<Database> {
    return this.http.post<Database>(this.baseUrl, database).pipe(
      map(database => this.convertDates(database))
    );
  }

  updateDatabase(id: number, database: UpdateDatabaseDto): Observable<Database> {
    return this.http.put<Database>(`${this.baseUrl}/${id}`, database).pipe(
      map(database => this.convertDates(database))
    );
  }

  deleteDatabase(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
} 
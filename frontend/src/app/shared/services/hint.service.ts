import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export enum Role {
    STUDENT = 'STUDENT',
    TUTOR = 'TUTOR',
    ADMIN = 'ADMIN'
}

/**
 * Data model representing a Hint item.
 */
export interface Hint {
    id?: number;
    authorId: number;
    title: string;
    content: string;
    isActive: boolean;
    targetRole: Role | null;
    createdAt?: Date;
    updatedAt?: Date;
    author?: {
        id: number;
        firstName: string;
        lastName: string;
        role: Role;
    };
}

export interface CreateHintDto {
    title: string;
    content: string;
    targetRole?: Role;
}

export interface UpdateHintDto {
    title?: string;
    content?: string;
    isActive?: boolean;
    targetRole?: Role;
}

@Injectable({
    providedIn: 'root',
})
/**
 * Service to manage Hint items.
 * Handles retrieving, creating, updating, and deleting hints.
 */
export class HintService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    /**
     * Retrieves all active hints for the current user's role.
     * @returns Observable of an array of Hint items.
     */
    getHints(): Observable<Hint[]> {
        return this.http.get<Hint[]>(`${this.apiUrl}/hints`);
    }

    /**
     * Retrieves all hints for management (tutors/admins only).
     * @returns Observable of an array of Hint items.
     */
    getHintsForManagement(): Observable<Hint[]> {
        return this.http.get<Hint[]>(`${this.apiUrl}/manage`);
    }

    /**
     * Gets a specific hint by ID.
     * @param id Hint ID
     * @returns Observable of the Hint.
     */
    getHint(id: number): Observable<Hint> {
        return this.http.get<Hint>(`${this.apiUrl}/${id}`);
    }

    /**
     * Creates a new hint (tutors/admins only).
     * @param hint CreateHintDto object.
     * @returns Observable of the created Hint.
     */
    createHint(hint: CreateHintDto): Observable<Hint> {
        return this.http.post<Hint>(`${this.apiUrl}/hints`, hint);
    }

    /**
     * Updates a hint (only author can update).
     * @param id Hint ID
     * @param hint UpdateHintDto object with updated fields.
     * @returns Observable of the updated Hint.
     */
    updateHint(id: number, hint: UpdateHintDto): Observable<Hint> {
        return this.http.patch<Hint>(`${this.apiUrl}/${id}`, hint);
    }

    /**
     * Deletes a hint (only author can delete).
     * @param id ID of the hint to delete.
     * @returns Observable<void>
     */
    deleteHint(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}

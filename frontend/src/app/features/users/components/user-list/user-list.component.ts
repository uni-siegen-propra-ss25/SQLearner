import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin, catchError, of, EMPTY } from 'rxjs';
import { Role } from '../../models/role.model';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../../auth/services/auth.service';
import { ProgressService } from '../../../progress/services/progress.service';
import { UserCreateDialogComponent } from '../../dialogs/user-create-dialog/user-create-dialog.component';
import { UserUpdateDialogComponent } from '../../dialogs/user-update-dialog/user-update-dialog.component';
import { User } from '../../models/user.model';

/**
 * Component that displays and manages a list of users.
 * For students, shows their learning progress as a percentage.
 * Allows admins and tutors to manage users and view their progress.
 */
@Component({
    selector: 'app-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements OnInit {
    /** List of users with their associated progress data */
    @Input() users: User[] = [];
    
    /** Whether users with appropriate roles can edit other users' roles */
    @Input() canEditRoles = false;
    
    /** Event emitted when a user's role is changed */
    @Output() roleChange = new EventEmitter<{ userId: number; newRole: Role }>();

    /** Columns to display in the users table */
    displayedColumns: string[] = ['name', 'email', 'role', 'matriculationNumber', 'progress', 'actions'];
    
    /** Available role options for user management */
    roleOptions = Object.values(Role);
    
    /** Whether the current user has admin privileges */
    isAdmin = false;
    
    /** Whether the current user has tutor or admin privileges */
    isTutorOrAdmin = false;

    constructor(
        private dialog: MatDialog,
        private userService: UserService,
        private authService: AuthService,
        private progressService: ProgressService,
        private snackBar: MatSnackBar,
    ) {}

    /**
     * Initializes the component by loading users and setting up role-based permissions
     */
    ngOnInit() {
        this.loadUsers();
        this.authService.user$.subscribe((user) => {
            this.isAdmin = user?.role === Role.ADMIN;
            this.isTutorOrAdmin = user?.role === Role.ADMIN || user?.role === Role.TUTOR;
        });
    }

    /**
     * Loads all users and their progress information if the current user is a tutor or admin.
     * For regular users, only loads the user list without progress data.
     */
    async loadUsers() {
        forkJoin({
            users: this.userService.getAllUsers(),
            progress: this.progressService.getAllUsersProgress()
        }).pipe(
            catchError(error => {
                console.error('Error loading data:', error);
                this.snackBar.open(
                    'Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.',
                    'Schließen',
                    { duration: 5000 }
                );
                return EMPTY;
            })
        ).subscribe({
            next: ({ users, progress }) => {
                // Create a Map for O(1) lookup of progress data
                const progressMap = new Map(
                    progress.map(p => [p.userId, p.completionPercentage])
                );
                
                // Map users with their progress data
                this.users = users.map(user => ({
                    ...user,
                    completionPercentage: progressMap.get(user.id) ?? 0
                }));
            },
            error: (error) => {
                console.error('Error in data processing:', error);
                this.snackBar.open(
                    'Fehler bei der Datenverarbeitung',
                    'Schließen',
                    { duration: 3000 }
                );
            },
        });
        
    }

    /**
     * Opens a dialog to create a new user
     */
    openCreateDialog() {
        const dialogRef = this.dialog.open(UserCreateDialogComponent, {
            width: '500px',
            data: { availableRoles: this.getAvailableRoles() },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.userService.createUser(result).subscribe({
                    next: (newUserId) => {
                        // Add new user with default progress
                        const newUser: User = {
                            id: newUserId,
                            ...result,
                        };
                        this.users = [...this.users, newUser];
                        this.snackBar.open('Nutzer erfolgreich erstellt', 'Schließen', {
                            duration: 3000,
                        });
                    },
                    error: (error) => {
                        console.error('Error creating user:', error);
                        this.snackBar.open('Fehler beim Erstellen des Nutzers', 'Schließen', {
                            duration: 3000,
                        });
                    },
                });
            }
        });
    }

    /**
     * Opens a dialog to update an existing user's information
     * @param user The user to update
     */
    openUpdateDialog(user: User) {
        const dialogRef = this.dialog.open(UserUpdateDialogComponent, {
            width: '500px',
            data: {
                user,
                availableRoles: this.getAvailableRoles(),
            },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.userService.updateUser(result.id, result).subscribe({
                    next: (updatedUser) => {
                        // Preserve existing progress when updating user
                        this.users = this.users.map((u) =>
                            u.id === updatedUser.id ? { ...updatedUser } : u
                        );
                        this.snackBar.open('Nutzer erfolgreich aktualisiert', 'Schließen', {
                            duration: 3000,
                        });
                    },
                    error: (error) => {
                        console.error('Error updating user:', error);
                        this.snackBar.open('Fehler beim Aktualisieren des Nutzers', 'Schließen', {
                            duration: 3000,
                        });
                    },
                });
            }
        });
    }

    /**
     * Gets the list of roles that can be assigned based on current user's permissions
     * @returns Array of available roles
     */
    getAvailableRoles(): Role[] {
        if (this.isAdmin) {
            return [Role.ADMIN, Role.TUTOR, Role.STUDENT];
        } else if (this.isTutorOrAdmin) {
            return [Role.STUDENT];
        }
        return [];
    }

    /**
     * Handles role changes for a user
     * @param userId ID of the user whose role is changing
     * @param newRole The new role to assign
     */
    onRoleChange(userId: number, newRole: Role) {
        if (!this.isAdmin) return;

        this.userService.updateUserRole(userId, newRole).subscribe({
            next: (updatedUser) => {
                // Preserve existing progress when updating role
                this.users = this.users.map((u) =>
                    u.id === updatedUser.id ? { ...updatedUser } : u
                );
                this.snackBar.open('Rolle erfolgreich geändert', 'Schließen', {
                    duration: 3000,
                });
            },
            error: (error) => {
                console.error('Error updating user role:', error);
                this.snackBar.open('Fehler beim Ändern der Rolle', 'Schließen', {
                    duration: 3000,
                });
            },
        });
    }

    /**
     * Deletes a user from the system
     * @param userId ID of the user to delete
     */
    deleteUser(userId: number) {
        if (!this.isAdmin) return;

        this.userService.deleteUser(userId).subscribe({
            next: () => {
                this.users = this.users.filter((u) => u.id !== userId);
                this.snackBar.open('Nutzer erfolgreich gelöscht', 'Schließen', {
                    duration: 3000,
                });
            },
            error: (error) => {
                console.error('Error deleting user:', error);
                this.snackBar.open('Fehler beim Löschen des Nutzers', 'Schließen', {
                    duration: 3000,
                });
            },
        });
    }
}

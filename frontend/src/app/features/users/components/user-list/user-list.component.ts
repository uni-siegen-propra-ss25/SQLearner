import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../models/user.model';
import { Role } from '../../models/role.model';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../../auth/services/auth.service';
import { UserCreateDialogComponent } from '../../dialogs/user-create-dialog/user-create-dialog.component';
import { UserUpdateDialogComponent } from '../../dialogs/user-update-dialog/user-update-dialog.component';
import { ProgressService } from '../../../progress/services/progress.service';

@Component({
    selector: 'app-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements OnInit {
    @Input() users: User[] = [];
    @Input() canEditRoles = false;
    @Output() roleChange = new EventEmitter<{ userId: number; newRole: Role }>();

    displayedColumns: string[] = ['name', 'email', 'role', 'matriculationNumber', 'progress', 'actions'];
    roleOptions = Object.values(Role);
    isAdmin = false;

    constructor(
        private dialog: MatDialog,
        private userService: UserService,
        private authService: AuthService,
        private progressService: ProgressService,
        private snackBar: MatSnackBar,
    ) {}

    isTutorOrAdmin = false;

    ngOnInit() {
        this.loadUsers();
        this.authService.user$.subscribe((user) => {
            this.isAdmin = user?.role === Role.ADMIN;
            this.isTutorOrAdmin = user?.role === Role.ADMIN || user?.role === Role.TUTOR;
        });
    }

    async loadUsers() {
        this.userService.getAllUsers().subscribe({
            next: async (users) => {
                // Load progress for students
                const updatedUsers = await Promise.all(users.map(async (user) => {
                    if (user.role === Role.STUDENT) {
                        try {
                            const progress = await this.progressService.getUserProgress().toPromise();
                            return { ...user, progress: progress?.completionPercentage || 0 };
                        } catch (error) {
                            console.error(`Fehler beim Laden des Fortschritts für Benutzer ${user.id}:`, error);
                            return { ...user, progress: 0 };
                        }
                    }
                    return user;
                }));
                this.users = updatedUsers;
            },
            error: (error) => {
                this.snackBar.open('Fehler beim Laden der Nutzer', 'Schließen', {
                    duration: 3000,
                });
            },
        });
    }

    openCreateDialog() {
        const dialogRef = this.dialog.open(UserCreateDialogComponent, {
            width: '500px',
            data: { availableRoles: this.getAvailableRoles() },
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.userService.createUser(result).subscribe({
                    next: (newUserId) => {
                        this.users = [...this.users, { id: newUserId, ...result }];
                        this.snackBar.open('Nutzer erfolgreich erstellt', 'Schließen', {
                            duration: 3000,
                        });
                    },
                    error: (error) => {
                        this.snackBar.open('Fehler beim Erstellen des Nutzers', 'Schließen', {
                            duration: 3000,
                        });
                    },
                });
            }
        });
    }

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
                        this.users = this.users.map((u) =>
                            u.id === updatedUser.id ? updatedUser : u,
                        );
                        this.snackBar.open('Nutzer erfolgreich aktualisiert', 'Schließen', {
                            duration: 3000,
                        });
                    },
                    error: (error) => {
                        this.snackBar.open('Fehler beim Aktualisieren des Nutzers', 'Schließen', {
                            duration: 3000,
                        });
                    },
                });
            }
        });
    }

    getAvailableRoles(): Role[] {
        if (this.isAdmin) {
            return [Role.ADMIN, Role.TUTOR, Role.STUDENT];
        } else if (this.isTutorOrAdmin) {
            return [Role.STUDENT];
        }
        return [];
    }

    onRoleChange(userId: number, newRole: Role) {
        if (!this.isAdmin) return;

        this.userService.updateUserRole(userId, newRole).subscribe({
            next: (updatedUser) => {
                this.users = this.users.map((user) =>
                    user.id === updatedUser.id ? updatedUser : user,
                );
                this.snackBar.open('Rolle erfolgreich geändert', 'Schließen', {
                    duration: 3000,
                });
            },
            error: (error) => {
                this.snackBar.open('Fehler beim Ändern der Rolle', 'Schließen', {
                    duration: 3000,
                });
            },
        });
    }

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
                this.snackBar.open('Fehler beim Löschen des Nutzers', 'Schließen', {
                    duration: 3000,
                });
            },
        });
    }
}

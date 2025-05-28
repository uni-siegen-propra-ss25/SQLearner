import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { User } from '../../models/user.model';
import { Role } from '../../models/role.model';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../../auth/services/auth.service';
import { UserCreateDialogComponent } from '../../dialogs/user-create-dialog/user-create-dialog.component';
import { UserUpdateDialogComponent } from '../../dialogs/user-update-dialog/user-update-dialog.component';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  @Input() users: User[] = [];
  @Input() canEditRoles = false;
  @Output() roleChange = new EventEmitter<{userId: number, newRole: Role}>();

  displayedColumns: string[] = ['name', 'email', 'role', 'matriculationNumber', 'actions'];
  roleOptions = Object.values(Role);
  isAdmin = false;
  
  constructor(
    private dialog: MatDialog,
    private userService: UserService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.authService.user$.subscribe(user => {
      this.isAdmin = user?.role === Role.ADMIN;
    });
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: (error) => {
        this.snackBar.open('Fehler beim Laden der Nutzer', 'Schließen', {
          duration: 3000
        });
      }
    });
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(UserCreateDialogComponent, {
      width: '500px',
      data: { availableRoles: this.getAvailableRoles() }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.createUser(result).subscribe({
          next: (newUser) => {
            this.users = [...this.users, newUser];
            this.snackBar.open('Nutzer erfolgreich erstellt', 'Schließen', {
              duration: 3000
            });
          },
          error: (error) => {
            this.snackBar.open('Fehler beim Erstellen des Nutzers', 'Schließen', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  openUpdateDialog(user: User) {
    const dialogRef = this.dialog.open(UserUpdateDialogComponent, {
      width: '500px',
      data: { 
        user,
        availableRoles: this.getAvailableRoles() 
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.updateUser(result.id, result).subscribe({
          next: (updatedUser) => {
            this.users = this.users.map(u => 
              u.id === updatedUser.id ? updatedUser : u
            );
            this.snackBar.open('Nutzer erfolgreich aktualisiert', 'Schließen', {
              duration: 3000
            });
          },
          error: (error) => {
            this.snackBar.open('Fehler beim Aktualisieren des Nutzers', 'Schließen', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  getAvailableRoles(): Role[] {
    return this.isAdmin ? 
      [Role.ADMIN, Role.TUTOR, Role.STUDENT] : 
      [Role.TUTOR, Role.STUDENT];
  }

  onRoleChange(userId: number, newRole: Role) {
    if (!this.isAdmin) return;
    
    this.userService.updateUserRole(userId, newRole).subscribe({
      next: (updatedUser) => {
        this.users = this.users.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        );
        this.snackBar.open('Rolle erfolgreich geändert', 'Schließen', {
          duration: 3000
        });
      },
      error: (error) => {
        this.snackBar.open('Fehler beim Ändern der Rolle', 'Schließen', {
          duration: 3000
        });
      }
    });
  }

  deleteUser(userId: number) {
    if (!this.isAdmin) return;

    this.userService.deleteUser(userId).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== userId);
        this.snackBar.open('Nutzer erfolgreich gelöscht', 'Schließen', {
          duration: 3000
        });
      },
      error: (error) => {
        this.snackBar.open('Fehler beim Löschen des Nutzers', 'Schließen', {
          duration: 3000
        });
      }
    });
  }
}

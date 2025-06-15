import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Database, DatabaseTable, TableColumn } from '../../models/database.model';
import { TableService } from '../../services/table.service';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';
import { TableCreateDialogComponent } from '../../dialogs/table-create-dialog/table-create-dialog.component';
import { TableEditDialogComponent } from '../../dialogs/table-edit-dialog/table-edit-dialog.component';
import { DataCreateDialogComponent } from '../../dialogs/data-create-dialog/data-create-dialog.component';
import { DataEditDialogComponent } from '../../dialogs/data-edit-dialog/data-edit-dialog.component';

@Component({
  selector: 'app-database-table-viewer',
  templateUrl: './database-table-viewer.component.html',
  styleUrls: ['./database-table-viewer.component.scss']
})
export class DatabaseTableViewerComponent implements OnInit {
  @Input() database!: Database;
  @Input() tables: DatabaseTable[] = [];
  @Input() isTutor: boolean = false;
  
  selectedTable?: DatabaseTable;
  displayedColumns: string[] = [];
  filteredData: any[] = [];
  searchQuery = '';
  selectedFilter: string = 'all';
  isLoading = false;

  // Pagination
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50, 100];
  totalRows = 0;
  tableData: any[] = [];
  
  constructor(
    private tableService: TableService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    if (this.tables.length > 0) {
      this.selectTable(this.tables[0]);
    }
  }

  selectTable(table: DatabaseTable) {
    this.selectedTable = table;
    this.displayedColumns = table.columns.map(col => col.name);
    this.loadTableData();
  }

  loadTableData() {
    if (!this.selectedTable || !this.database) return;
    this.isLoading = true;
    
    this.tableService.getTableData(this.database.id, this.selectedTable.id)
      .subscribe({
        next: (data: any[]) => {
          this.tableData = data;
          this.totalRows = data.length;
          this.filterData();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading table data:', error);
          this.snackBar.open('Failed to load table data', 'OK', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  filterData() {
    if (!this.tableData) return;

    let filtered = [...this.tableData];
    
    // Search filter
    if (this.searchQuery) {
      const searchLower = this.searchQuery.toLowerCase();
      filtered = filtered.filter(row => {
        return Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchLower)
        );
      });
    }

    // NULL filters
    switch (this.selectedFilter) {
      case 'null':
        filtered = filtered.filter(row => 
          Object.values(row).some(value => value === null)
        );
        break;
      case 'not_null':
        filtered = filtered.filter(row => 
          Object.values(row).every(value => value !== null)
        );
        break;
    }

    this.totalRows = filtered.length;
    // Apply pagination
    const startIndex = this.currentPage * this.pageSize;
    this.filteredData = filtered.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.filterData();
  }

  openCreateTableDialog() {
    const dialogRef = this.dialog.open(TableCreateDialogComponent, {
      width: '600px',
      data: { databaseId: this.database.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.tableService.createTable(this.database.id, result).subscribe({
          next: (newTable) => {
            this.tables.push(newTable);
            this.snackBar.open('Tabelle erfolgreich erstellt', 'OK', { duration: 3000 });
            this.selectTable(newTable);
          },
          error: (error) => {
            console.error('Error creating table:', error);
            this.snackBar.open('Fehler beim Erstellen der Tabelle', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  openEditTableDialog() {
    if (!this.selectedTable) return;

    const dialogRef = this.dialog.open(TableEditDialogComponent, {
      width: '600px',
      data: { table: this.selectedTable }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.tableService.updateTable(this.database.id, result.id, result).subscribe({
          next: (updatedTable) => {
            const index = this.tables.findIndex(t => t.id === updatedTable.id);
            if (index !== -1) {
              this.tables[index] = updatedTable;
              this.selectedTable = updatedTable;
            }
            this.snackBar.open('Tabelle erfolgreich aktualisiert', 'OK', { duration: 3000 });
            this.loadTableData();
          },
          error: (error) => {
            console.error('Error updating table:', error);
            this.snackBar.open('Fehler beim Aktualisieren der Tabelle', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  openAddDataDialog(): void {
    if (!this.selectedTable || !this.database) return;
    
    const dialogRef = this.dialog.open(DataCreateDialogComponent, {
      width: '800px',
      data: {
        databaseId: this.database.id,
        table: this.selectedTable
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTableData();
      }
    });
  }

  openEditDataDialog(rowData: any): void {
    if (!this.selectedTable || !this.database) return;
    
    const dialogRef = this.dialog.open(DataEditDialogComponent, {
      width: '800px',
      data: {
        databaseId: this.database.id,
        table: this.selectedTable,
        rowData: rowData
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTableData();
      }
    });
  }

  async truncateTable() {
    if (!this.selectedTable) return;
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Tabelle leeren',
        message: `Möchten Sie wirklich alle Daten aus der Tabelle "${this.selectedTable.name}" löschen?`,
        confirmText: 'Leeren'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.tableService.truncateTable(this.database.id, this.selectedTable!.id).subscribe({
          next: () => {
            this.loadTableData();
            this.snackBar.open('Tabelle wurde geleert', 'OK', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error truncating table:', error);
            this.snackBar.open('Fehler beim Leeren der Tabelle', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  async deleteTable(table: DatabaseTable) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Tabelle löschen',
        message: `Möchten Sie wirklich die Tabelle "${table.name}" löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
        confirmText: 'Löschen'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.tableService.deleteTable(this.database.id, table.id).subscribe({
          next: () => {
            const index = this.tables.findIndex(t => t.id === table.id);
            if (index > -1) {
              this.tables.splice(index, 1);
            }
            
            // If we deleted the currently selected table, select a new one
            if (this.selectedTable?.id === table.id) {
              this.selectedTable = this.tables[0];
              if (this.selectedTable) {
                this.loadTableData();
              }
            }

            this.snackBar.open('Tabelle wurde gelöscht', 'Schließen', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error deleting table:', error);
            this.snackBar.open(
              'Fehler beim Löschen der Tabelle: ' + 
              (error.error?.message || error.message || 'Unbekannter Fehler'), 
              'Schließen', 
              { duration: 5000 }
            );
          }
        });
      }
    });
  }

  deleteRow(rowData: any): void {
    if (!this.selectedTable || !this.database) return;

    const pkColumn = this.selectedTable.columns.find(col => col.isPrimaryKey);
    if (!pkColumn) {
      this.snackBar.open('Keine Primärschlüsselspalte gefunden', 'OK', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Datensatz löschen',
        message: 'Möchten Sie diesen Datensatz wirklich löschen?',
        confirmButtonText: 'Löschen',
        cancelButtonText: 'Abbrechen'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const pkValue = rowData[pkColumn.name];
        
        this.tableService.deleteTableRow(
          this.database.id,
          this.selectedTable!.id,
          pkColumn.name,
          pkValue
        ).subscribe({
          next: () => {
            this.snackBar.open('Datensatz erfolgreich gelöscht', 'OK', { duration: 3000 });
            this.loadTableData();
          },
          error: (error: unknown) => {
            console.error('Error deleting row:', error);
            this.snackBar.open('Fehler beim Löschen des Datensatzes', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  deleteSelectedRows(rows: any[]): void {
    if (!this.selectedTable || !this.database || rows.length === 0) return;

    const pkColumn = this.selectedTable.columns.find(col => col.isPrimaryKey);
    if (!pkColumn) {
      this.snackBar.open('Keine Primärschlüsselspalte gefunden', 'OK', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Mehrere Datensätze löschen',
        message: `Möchten Sie die ausgewählten ${rows.length} Datensätze wirklich löschen?`,
        confirmButtonText: 'Löschen',
        cancelButtonText: 'Abbrechen'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const deletePromises = rows.map(row => {
          const pkValue = row[pkColumn.name];
          return this.tableService.deleteTableRow(
            this.database.id,
            this.selectedTable!.id,
            pkColumn.name,
            pkValue
          ).toPromise();
        });

        Promise.all(deletePromises)
          .then(() => {
            this.snackBar.open(`${rows.length} Datensätze erfolgreich gelöscht`, 'OK', { duration: 3000 });
            this.loadTableData();
          })
          .catch(error => {
            console.error('Error deleting rows:', error);
            this.snackBar.open('Fehler beim Löschen der Datensätze', 'OK', { duration: 3000 });
          });
      }
    });
  }
}
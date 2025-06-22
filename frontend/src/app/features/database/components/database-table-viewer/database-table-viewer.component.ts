import { Component, Input, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { Database } from '../../models/database.model';
import { DatabaseTable } from '../../models/table.model';
import { ConfirmDialogComponent } from '../../dialogs/confirm-dialog/confirm-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { DatabaseService, QueryResult } from '../../services/database.service';
import { CreateTableDialogComponent } from '../../dialogs/create-table-dialog/create-table-dialog.component';

@Component({
  selector: 'app-database-table-viewer',
  templateUrl: './database-table-viewer.component.html',
  styleUrls: []
})
export class DatabaseTableViewerComponent implements OnInit, AfterViewInit {
  @Input() database!: Database;
  @Input() tables: DatabaseTable[] = [];
  @Input() isTutor: boolean = false;
  
  selectedTable: DatabaseTable | null = null;
  displayedColumns: string[] = [];
  filteredData: any[] = [];
  searchQuery = '';
  selectedFilter: string = 'all';
  isLoading = true;

  // Pagination
  pageSize = 10;
  currentPage = 0;
  pageSizeOptions = [5, 10, 25, 50, 100];
  totalRows = 0;
  tableData: any[] = [];
  
  columns: string[] = [];
  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  databaseId: number | null = null;
  tableId: number | null = null;
  tableName = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private databaseService: DatabaseService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    const dbId = Number(this.route.snapshot.paramMap.get('id'));
    this.route.params.subscribe(params => {
        const tableId = +params['tableId'];
        if(tableId) {
            this.selectedTable = this.tables.find(t => t.id === tableId) ?? null;
            if(this.selectedTable) {
                this.loadTableData(this.selectedTable.name);
            }
        }
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  selectTable(table: DatabaseTable) {
    this.selectedTable = table;
    this.loadTableData(table.name);
    if(this.database) {
        this.router.navigate(['/databases', this.database.id, 'tables', table.id]);
    }
  }

  loadTableData(tableName: string) {
    if (!this.databaseId || !this.tableId) return;

    this.isLoading = true;
    this.tableName = tableName;

    this.databaseService.runQuery(this.databaseId, `SELECT * FROM "${this.tableName}"`).subscribe({
      next: (result: QueryResult) => {
        this.columns = result.columns;
        this.dataSource.data = result.rows;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading table data:', error);
        this.snackBar.open(`Error loading data for table ${this.tableName}.`, 'OK', { duration: 3000 });
        this.isLoading = false;
      },
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
    const dialogRef = this.dialog.open(CreateTableDialogComponent, {
      width: '600px',
      data: { databaseId: this.database.id }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && this.database) {
        this.route.params.subscribe(params => {
          const tableId = +params['tableId'];
          if(tableId) {
            this.selectedTable = this.tables.find(t => t.id === tableId) ?? null;
            if(this.selectedTable) {
              this.loadTableData(this.selectedTable.name);
            }
          }
        });
        this.snackBar.open('Tabelle erfolgreich erstellt', 'OK', { duration: 3000 });
      }
    });
  }

  openEditTableDialog(table: DatabaseTable) {
    /* const dialogRef = this.dialog.open(TableEditDialogComponent, {
      width: '600px',
      data: { table: table }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.database) {
        this.route.params.subscribe(params => {
          const tableId = +params['tableId'];
          if(tableId) {
            this.selectedTable = this.tables.find(t => t.id === tableId) ?? null;
            if(this.selectedTable) {
              this.loadTableData(this.selectedTable.name);
            }
          }
        });
        this.snackBar.open('Tabelle erfolgreich aktualisiert', 'OK', { duration: 3000 });
      }
    }); */
  }

  openAddDataDialog(): void {
    if (!this.selectedTable || !this.database) return;
    
    /* const dialogRef = this.dialog.open(DataCreateDialogComponent, {
      width: '800px',
      data: {
        databaseId: this.database.id,
        table: this.selectedTable
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTableData(this.selectedTable!.name);
      }
    }); */
  }

  openEditDataDialog(rowData: any): void {
    if (!this.selectedTable || !this.database) return;
    
    /* const dialogRef = this.dialog.open(DataEditDialogComponent, {
      width: '800px',
      data: {
        databaseId: this.database.id,
        table: this.selectedTable,
        rowData: rowData
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTableData(this.selectedTable!.name);
      }
    }); */
  }

  truncateTable() {
    if (!this.selectedTable) return;
    const table = this.selectedTable;
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Tabelle leeren',
        message: `Möchten Sie wirklich alle Daten aus der Tabelle "${table.name}" löschen?`,
        confirmText: 'Leeren'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.database) {
        this.databaseService.truncateTable(this.database.id, table.id).subscribe({
          next: () => {
            this.loadTableData(table.name);
            this.snackBar.open('Tabelle erfolgreich geleert', 'OK', { duration: 3000 });
          },
          error: (error: any) => {
            console.error('Error truncating table', error);
            this.snackBar.open('Fehler beim Leeren der Tabelle', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  deleteTable(table: DatabaseTable) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Tabelle löschen',
        message: `Möchten Sie wirklich die Tabelle "${table.name}" löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
        confirmText: 'Löschen'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.database) {
        this.databaseService.deleteTable(this.database.id, table.id).subscribe({
          next: () => {
            this.tables = this.tables.filter(t => t.id !== table.id);
            if (this.selectedTable?.id === table.id) {
              this.selectedTable = null;
              this.dataSource.data = [];
              this.displayedColumns = [];
            }
            this.snackBar.open('Tabelle erfolgreich gelöscht', 'OK', { duration: 3000 });
          },
          error: (error: any) => {
            console.error('Error deleting table', error);
            this.snackBar.open('Fehler beim Löschen der Tabelle', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  deleteRow(row: any) {
    if (!this.selectedTable || !this.database) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        data: {
            title: 'Zeile löschen',
            message: `Möchten Sie diese Zeile wirklich löschen?`
        }
    });

    dialogRef.afterClosed().subscribe(result => {
        if (result && this.database && this.selectedTable) {
            const primaryKeyCol = this.selectedTable.columns.find(c => c.isPrimaryKey);
            if (!primaryKeyCol) {
                this.snackBar.open('Kein Primärschlüssel für diese Tabelle definiert.', 'OK', { duration: 3000});
                return;
            }
            const rowId = row[primaryKeyCol.name];

            this.databaseService.deleteTableRow(this.database.id, this.selectedTable.id, rowId).subscribe({
                next: () => {
                    this.loadTableData(this.selectedTable!.name);
                    this.snackBar.open('Zeile erfolgreich gelöscht', 'OK', { duration: 3000 });
                },
                error: (error: any) => {
                    console.error('Error deleting row:', error);
                    this.snackBar.open('Fehler beim Löschen der Zeile', 'OK', { duration: 3000 });
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
          return this.databaseService.deleteTableRow(
            this.database!.id,
            this.selectedTable!.id,
            pkValue
          ).toPromise();
        });

        Promise.all(deletePromises)
          .then(() => {
            this.snackBar.open(`${rows.length} Datensätze erfolgreich gelöscht`, 'OK', { duration: 3000 });
            this.loadTableData(this.selectedTable!.name);
          })
          .catch(error => {
            console.error('Error deleting rows:', error);
            this.snackBar.open('Fehler beim Löschen der Datensätze', 'OK', { duration: 3000 });
          });
      }
    });
  }

  loadDatabase(id: number) {
    // implementation
  }
}
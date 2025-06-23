import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
import { AuthService } from 'app/features/auth/services/auth.service';
import { Role } from 'app/features/users/models/role.model';

@Component({
  selector: 'app-database-table-viewer',
  templateUrl: './database-table-viewer.component.html',
  styleUrls: ['./database-table-viewer.component.scss']
})
export class DatabaseTableViewerComponent implements OnInit, AfterViewInit {
  database: Database | null = null;
  tables: DatabaseTable[] = [];
  isTutor: boolean = false;
  
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private databaseService: DatabaseService,
    private authService: AuthService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Получаем ID базы данных из маршрута
    this.route.params.subscribe(params => {
      this.databaseId = +params['id'];
      if (this.databaseId) {
        this.loadDatabase(this.databaseId);
      }
    });

    // Проверяем роль пользователя
    this.authService.user$.subscribe(user => {
      this.isTutor = user?.role === Role.TUTOR;
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadDatabase(id: number) {
    this.isLoading = true;
    
    this.databaseService.getDatabase(id).subscribe({
      next: (database: Database) => {
        this.database = database;
        this.databaseId = database.id;
        this.loadTables();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading database:', error);
        this.snackBar.open('Fehler beim Laden der Datenbank.', 'OK', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  loadTables() {
    if (!this.databaseId) return;

    // Laden einer Liste von Tabellen mit Spalteninformationen
    this.databaseService.runQuery(this.databaseId, `
      SELECT 
        t.table_name as name,
        json_agg(
          json_build_object(
            'name', c.column_name,
            'type', c.data_type,
            'isPrimaryKey', CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END,
            'isForeignKey', CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END,
            'isNullable', c.is_nullable = 'YES',
            'defaultValue', c.column_default
          ) ORDER BY c.ordinal_position
        ) as columns
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND c.table_schema = 'public'
      LEFT JOIN (
        SELECT kcu.column_name, kcu.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
      ) pk ON c.column_name = pk.column_name AND t.table_name = pk.table_name
      LEFT JOIN (
        SELECT kcu.column_name, kcu.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
      ) fk ON c.column_name = fk.column_name AND t.table_name = fk.table_name
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      GROUP BY t.table_name
      ORDER BY t.table_name
    `).subscribe({
      next: (result: QueryResult) => {
        this.tables = result.rows.map((row: any, index: number) => ({
          id: index + 1,
          name: row.name,
          databaseId: this.databaseId!,
          columns: row.columns || [] // Use the obtained columns or an empty array
        }));
        
        // Load row counts for each table
        this.loadTableRowCounts();
        
        // If there are tables, select the first one  
        if (this.tables.length > 0 && !this.selectedTable) {
          this.selectTable(this.tables[0]);
        }
      },
      error: (error: any) => {
        console.error('Error loading tables:', error);
        // If a complex query doesn't work, we use a simple one
        this.loadTablesSimple();
      }
    });
  }

  loadTableRowCounts() {
    if (!this.databaseId || this.tables.length === 0) return;

    // Query each table separately to get row counts
    const promises = this.tables.map(table => 
      this.databaseService.runQuery(this.databaseId!, `SELECT COUNT(*) as row_count FROM "${table.name}"`).toPromise()
    );

    Promise.all(promises).then(results => {
      this.tables = this.tables.map((table, index) => {
        const result = results[index];
        return {
          ...table,
          rowCount: result?.rows?.[0]?.row_count || 0
        };
      });
    }).catch(error => {
      console.error('Error loading table row counts:', error);
      // If row count query fails, set all to 0
      this.tables = this.tables.map(table => ({
        ...table,
        rowCount: 0
      }));
    });
  }

  loadTablesSimple() {
    if (!this.databaseId) return;

    // Простой запрос только для названий таблиц
    this.databaseService.runQuery(this.databaseId, `
      SELECT table_name as name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `).subscribe({
      next: (result: QueryResult) => {
        this.tables = result.rows.map((row: any, index: number) => ({
          id: index + 1,
          name: row.name,
          databaseId: this.databaseId!,
          columns: [] // Empty array of columns for a simple query
        }));
        
        // Load row counts for each table
        this.loadTableRowCounts();
        
        // If there are tables, select the first one
        if (this.tables.length > 0 && !this.selectedTable) {
          this.selectTable(this.tables[0]);
        }
      },
      error: (error: any) => {
        console.error('Error loading tables:', error);
        this.snackBar.open('Fehler beim Laden der Tabellen.', 'OK', { duration: 3000 });
      }
    });
  }

  selectTable(table: DatabaseTable) {
    this.selectedTable = table;
    this.loadTableData(table.name);
  }

  loadTableData(tableName: string) {
    if (!this.databaseId) return;

    this.isLoading = true;
    this.displayedColumns = [];

    this.databaseService.runQuery(this.databaseId, `SELECT * FROM "${tableName}" LIMIT 100`).subscribe({
      next: (result: QueryResult) => {
        this.columns = result.columns;
        this.displayedColumns = result.columns;
        this.tableData = result.rows;
        this.filteredData = result.rows;
        this.totalRows = result.rows.length;
        this.dataSource.data = result.rows;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading table data:', error);
        this.snackBar.open(`Fehler beim Laden der Tabellendaten für ${tableName}.`, 'OK', { duration: 3000 });
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
    this.filteredData = filtered;
    this.dataSource.data = filtered;
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.filterData();
  }

  openCreateTableDialog() {
    if (!this.database) return;

    const dialogRef = this.dialog.open(CreateTableDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: { 
        databaseId: this.database.id,
        databaseName: this.database.name
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result && result.success) {
        this.loadTables(); // Reload tables and row counts
        this.snackBar.open('Tabelle erfolgreich erstellt!', 'OK', { duration: 3000 });
      }
    });
  }

  openEditTableDialog(table: DatabaseTable) {
    // TODO: Tabellenbearbeitung implementieren
    this.snackBar.open('Funktion noch nicht implementiert', 'OK', { duration: 3000 });
  }

  openAddDataDialog(): void {
    if (!this.selectedTable || !this.database) return;
    
    // TODO: Hinzufügen von Daten
    this.snackBar.open('Funktion noch nicht implementiert', 'OK', { duration: 3000 });
  }

  openEditDataDialog(rowData: any): void {
    if (!this.selectedTable || !this.database) return;
    
    // TODO: Datenbearbeitung implementieren
    this.snackBar.open('Funktion noch nicht implementiert', 'OK', { duration: 3000 });
  }

  truncateTable() {
    if (!this.selectedTable || !this.databaseId) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Tabelle leeren',
        message: `Möchten Sie wirklich alle Daten aus der Tabelle "${this.selectedTable.name}" löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.databaseService.runQuery(this.databaseId!, `TRUNCATE TABLE "${this.selectedTable!.name}"`).subscribe({
          next: () => {
            this.snackBar.open('Tabelle erfolgreich geleert.', 'OK', { duration: 3000 });
            this.loadTableData(this.selectedTable!.name);
          },
          error: (error: any) => {
            console.error('Error truncating table:', error);
            this.snackBar.open('Fehler beim Leeren der Tabelle.', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  deleteTable(table: DatabaseTable) {
    if (!this.databaseId) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Tabelle löschen',
        message: `Möchten Sie wirklich die Tabelle "${table.name}" löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        this.databaseService.runQuery(this.databaseId!, `DROP TABLE "${table.name}"`).subscribe({
          next: () => {
            this.snackBar.open('Tabelle erfolgreich gelöscht.', 'OK', { duration: 3000 });
            this.loadTables();
            this.selectedTable = null;
          },
          error: (error: any) => {
            console.error('Error deleting table:', error);
            this.snackBar.open('Fehler beim Löschen der Tabelle.', 'OK', { duration: 3000 });
          }
        });
      }
    });
  }

  deleteRow(row: any) {
    if (!this.selectedTable || !this.databaseId) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Zeile löschen',
        message: 'Möchten Sie wirklich diese Zeile löschen?'
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        // TODO: Löschung einer Zeichenkette implementieren
        this.snackBar.open('Funktion noch nicht implementiert', 'OK', { duration: 3000 });
      }
    });
  }

  goBack() {
    this.router.navigate(['/databases']);
  }
}
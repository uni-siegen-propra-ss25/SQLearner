import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Database, DatabaseTable, TableColumn } from '../../models/database.model';
import { TableService } from '../../services/table.service';

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
    // TODO: Implement dialog
  }

  openEditTableDialog() {
    // TODO: Implement dialog
  }

  openAddDataDialog() {
    // TODO: Implement dialog
  }

  async truncateTable() {
    if (!this.selectedTable) return;
    
    // TODO: Add confirmation dialog
    
    this.tableService.truncateTable(this.database.id, this.selectedTable.id)
      .subscribe({
        next: () => {
          this.loadTableData();
        },
        error: (error) => {
          console.error('Error truncating table:', error);
          // TODO: Show error message
        }
      });
  }

  async deleteTable() {
    if (!this.selectedTable) return;
    
    // TODO: Add confirmation dialog
    
    this.tableService.deleteTable(this.database.id, this.selectedTable.id)
      .subscribe({
        next: () => {
          const index = this.tables.findIndex(t => t.id === this.selectedTable?.id);
          if (index > -1) {
            this.tables.splice(index, 1);
          }
          this.selectedTable = this.tables[0];
          if (this.selectedTable) {
            this.loadTableData();
          }
        },
        error: (error) => {
          console.error('Error deleting table:', error);
          // TODO: Show error message
        }
      });
  }

  getColumnType(column: TableColumn): string {
    let type = column.type;
    if (column.isPrimaryKey) type += ' (PK)';
    if (column.isForeignKey) type += ' (FK)';
    return type;
  }
}

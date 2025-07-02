import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { ErDiagramComponent } from './er-diagram.component';
import { MaterialModule } from '../../../../material.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ErDiagramComponent', () => {
  let component: ErDiagramComponent;
  let fixture: ComponentFixture<ErDiagramComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ErDiagramComponent>>;
  let mockSanitizer: jasmine.SpyObj<DomSanitizer>;

  const mockDialogData = {
    dbmlCode: `
      Table users {
        id integer [primary key]
        name varchar
        email varchar [unique]
      }
      
      Table posts {
        id integer [primary key]
        user_id integer [ref: > users.id]
        title varchar
        content text
      }
    `,
    databaseName: 'Test Database'
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSanitizer = jasmine.createSpyObj('DomSanitizer', ['bypassSecurityTrustHtml']);
    mockSanitizer.bypassSecurityTrustHtml.and.returnValue('<svg>Test SVG</svg>' as any);

    await TestBed.configureTestingModule({
      declarations: [ErDiagramComponent],
      imports: [MaterialModule, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: DomSanitizer, useValue: mockSanitizer }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ErDiagramComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have the correct dialog data', () => {
    expect(component.data.dbmlCode).toBe(mockDialogData.dbmlCode);
    expect(component.data.databaseName).toBe(mockDialogData.databaseName);
  });

  it('should handle empty DBML code gracefully', () => {
    component.data.dbmlCode = '';
    component.ngOnInit();
    expect(component.diagramHtml).toBeNull();
  });

  it('should parse DBML and create parsedTables with PK/FK indicators', () => {
    component.ngOnInit();
    fixture.detectChanges();
    
    expect(component.parsedTables).toBeDefined();
    expect(component.parsedTables.length).toBe(2);
    
    // Test users table
    const usersTable = component.parsedTables.find(table => table.name === 'users');
    expect(usersTable).toBeDefined();
    expect(usersTable!.columns.length).toBe(3);
    
    // Test primary key
    const idColumn = usersTable!.columns.find(col => col.name === 'id');
    expect(idColumn!.isPrimaryKey).toBe(true);
    expect(idColumn!.isForeignKey).toBe(false);
    
    // Test unique constraint
    const emailColumn = usersTable!.columns.find(col => col.name === 'email');
    expect(emailColumn!.isUnique).toBe(true);
    
    // Test posts table
    const postsTable = component.parsedTables.find(table => table.name === 'posts');
    expect(postsTable).toBeDefined();
    
    // Test foreign key
    const userIdColumn = postsTable!.columns.find(col => col.name === 'user_id');
    expect(userIdColumn!.isForeignKey).toBe(true);
    expect(userIdColumn!.isPrimaryKey).toBe(false);
  });

  it('should render template-based diagram when parsedTables exist', () => {
    component.ngOnInit();
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const dbmlVisualization = compiled.querySelector('.dbml-visualization');
    expect(dbmlVisualization).toBeTruthy();
    
    const tableBoxes = compiled.querySelectorAll('.table-box');
    expect(tableBoxes.length).toBe(2); // Should have users and posts tables
  });

  it('should render PK icon when column.isPrimaryKey is true', () => {
    component.ngOnInit();
    fixture.detectChanges();
    
    // First verify that parsedTables is populated correctly
    expect(component.parsedTables).toBeDefined();
    expect(component.parsedTables.length).toBe(2);
    
    // Check that PK columns are marked correctly
    const usersTable = component.parsedTables.find(table => table.name === 'users');
    expect(usersTable).toBeDefined();
    const idColumn = usersTable!.columns.find(col => col.name === 'id');
    expect(idColumn!.isPrimaryKey).toBe(true);
    
    // Check DOM for PK icons
    const compiled = fixture.nativeElement as HTMLElement;
    const pkIcons = compiled.querySelectorAll('.pk-icon');
    expect(pkIcons.length).toBeGreaterThan(0);
  });

  it('should render FK icon when column.isForeignKey is true', () => {
    component.ngOnInit();
    fixture.detectChanges();
    
    // Check that FK columns are marked correctly
    const postsTable = component.parsedTables.find(table => table.name === 'posts');
    expect(postsTable).toBeDefined();
    const userIdColumn = postsTable!.columns.find(col => col.name === 'user_id');
    expect(userIdColumn!.isForeignKey).toBe(true);
    
    // Check DOM for FK icons
    const compiled = fixture.nativeElement as HTMLElement;
    const fkIcons = compiled.querySelectorAll('.fk-icon');
    expect(fkIcons.length).toBeGreaterThan(0);
  });
});

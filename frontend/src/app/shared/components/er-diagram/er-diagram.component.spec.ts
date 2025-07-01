import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { ErDiagramComponent } from './er-diagram.component';
import { MaterialModule } from '../../../material.module';
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

  it('should call downloadSvg method', () => {
    spyOn(component, 'downloadSvg');
    component.downloadSvg();
    expect(component.downloadSvg).toHaveBeenCalled();
  });
});

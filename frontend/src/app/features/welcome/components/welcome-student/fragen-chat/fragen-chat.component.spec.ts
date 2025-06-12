import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FragenChatComponent } from './fragen-chat.component';

describe('FragenChatComponent', () => {
  let component: FragenChatComponent;
  let fixture: ComponentFixture<FragenChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FragenChatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FragenChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

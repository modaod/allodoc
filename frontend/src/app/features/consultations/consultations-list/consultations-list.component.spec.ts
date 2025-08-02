import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultationsListComponent } from './consultations-list.component';

describe('ConsultationsListComponent', () => {
  let component: ConsultationsListComponent;
  let fixture: ComponentFixture<ConsultationsListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConsultationsListComponent]
    });
    fixture = TestBed.createComponent(ConsultationsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

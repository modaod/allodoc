import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultationDetailComponent } from './consultation-detail.component';

describe('ConsultationDetailComponent', () => {
  let component: ConsultationDetailComponent;
  let fixture: ComponentFixture<ConsultationDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConsultationDetailComponent]
    });
    fixture = TestBed.createComponent(ConsultationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrescriptionsListComponent } from './prescriptions-list.component';

describe('PrescriptionsListComponent', () => {
  let component: PrescriptionsListComponent;
  let fixture: ComponentFixture<PrescriptionsListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PrescriptionsListComponent]
    });
    fixture = TestBed.createComponent(PrescriptionsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

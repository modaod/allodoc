import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PrescriptionsService } from './prescriptions.service';

describe('PrescriptionsService', () => {
  let service: PrescriptionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PrescriptionsService]
    });
    service = TestBed.inject(PrescriptionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { JwtInterceptor } from './jwt.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

describe('JwtInterceptor', () => {
  let interceptor: JwtInterceptor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        JwtInterceptor,
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
      ]
    });
    interceptor = TestBed.inject(JwtInterceptor);
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});

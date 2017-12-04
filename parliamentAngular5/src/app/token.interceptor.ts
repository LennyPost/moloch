// import { HttpInterceptor } from '@angular/common/http';

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
// import { AuthService } from './auth/auth.service';
import { Observable } from 'rxjs/Observable';


@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    request = request.clone({
      setHeaders: { 'x-access-token': localStorage.token }
    });
    return next.handle(request);
  }
  // TODO responseError handler
}

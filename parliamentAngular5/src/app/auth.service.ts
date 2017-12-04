import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';

import { Auth, Login } from './auth';


@Injectable()
export class AuthService {

  private loggedIn:boolean = false;

  constructor(private http: HttpClient) {
    if (localStorage.getItem('token')) {
      this.loggedIn = true;
    }
  }

  login (password):Observable<Login> {
    return this.http.post<Login>('api/auth', { password:password });
  }

  saveToken (token):boolean {
    if (token)  { this.loggedIn = true; }
    else        { this.loggedIn = false; }

    localStorage.setItem('token', token);

    return this.loggedIn;
  }

  isLoggedIn ():boolean {
    return this.loggedIn;
  }

  hasAuth ():Observable<Auth> {
    return this.http.get<Auth>('/api/auth');
  }

}

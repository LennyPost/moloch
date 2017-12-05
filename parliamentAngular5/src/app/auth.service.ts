import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

import { Auth, Login } from './auth';


@Injectable()
export class AuthService {

  private _loggedIn = new BehaviorSubject<boolean>(false);
  loggedIn$ = this._loggedIn.asObservable();

  // TODO need this or use _loggedIn?
  private loggedIn:boolean = false;

  constructor(private http:HttpClient) {
    if (localStorage.getItem('token')) {
      this.loggedIn = true;
    }
  }

  login (password):Observable<Login> {
    return this.http.post<Login>('api/auth', { password:password });
  }

  saveToken (token):boolean {
    if (!token) { token = ''; }

    if (token)  { this.loggedIn = true; }
    else        { this.loggedIn = false; }

    localStorage.setItem('token', token);

    // notify page whether the user is logged in
    this._loggedIn.next(this.loggedIn);

    return this.loggedIn;
  }

  getToken ():string {
    return localStorage.getItem('token') || '';
  }

  isLoggedIn ():boolean {
    return this.loggedIn;
  }

  hasAuth ():Observable<Auth> {
    return this.http.get<Auth>('/api/auth');
  }

}

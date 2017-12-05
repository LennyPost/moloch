import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ParliamentComponent } from './parliament.component';
import { CommaStringPipe } from './app.pipes';
import { TokenInterceptor } from './token.interceptor';
import { AuthService } from './auth.service';


@NgModule({
  declarations: [ ParliamentComponent, CommaStringPipe ],
  imports     : [ BrowserModule, HttpClientModule, FormsModule ],
  bootstrap   : [ ParliamentComponent ],
  providers   : [ AuthService, {
    provide   : HTTP_INTERCEPTORS,
    useClass  : TokenInterceptor,
    multi     : true
  }]
})
export class AppModule { }

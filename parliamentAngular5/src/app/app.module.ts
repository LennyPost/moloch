import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ParliamentComponent } from './parliament.component';
import { TokenInterceptor } from './token.interceptor';


@NgModule({
  declarations: [ ParliamentComponent ],
  imports     : [ BrowserModule, HttpClientModule, FormsModule ],
  bootstrap   : [ ParliamentComponent ],
  providers   : [{
    provide   : HTTP_INTERCEPTORS,
    useClass  : TokenInterceptor,
    multi     : true
  }]
})
export class AppModule { }

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { AppComponent } from './app.component';
import { EstudiantesComponent } from './estudiantes/estudiantesPage.component';
import { pageComponent } from './admin/pageAdmin.component';


@NgModule({
  declarations: [
    AppComponent,
    EstudiantesComponent,
    pageComponent,
    
  ],
  imports: [
    BrowserModule,
    MatCardModule,
    MatButtonModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}

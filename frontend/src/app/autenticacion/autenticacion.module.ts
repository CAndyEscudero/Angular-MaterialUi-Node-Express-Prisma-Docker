import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { InicioSesionComponent } from './inicio-sesion.component';

const routes: Routes = [
  { path: '', component: InicioSesionComponent },
];

@NgModule({
  declarations: [InicioSesionComponent],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
  ],
})
export class ModuloAutenticacion {}

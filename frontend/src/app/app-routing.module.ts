import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GuardiaAutenticacion } from './autenticacion/guardia-autenticacion';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./autenticacion/autenticacion.module').then(m => m.ModuloAutenticacion),
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module').then(m => m.ModuloAdmin),
    canActivate: [GuardiaAutenticacion],
  },
  {
    path: 'docentes',
    loadChildren: () => import('./docentes/docentes.module').then(m => m.ModuloDocentes),
    canActivate: [GuardiaAutenticacion],
  },
  {
    path: 'estudiantes',
    loadChildren: () => import('./estudiantes/estudiantes.module').then(m => m.ModuloEstudiantes),
    canActivate: [GuardiaAutenticacion],
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { UsuariosService, Usuario } from '../../servicios/usuarios.service';
import {
  UsuarioFormModel,
  crearUsuarioFormModel,
} from './modelos/usuario-admin.model';

/**
 * Container / orchestrator component for the user management feature.
 *
 * Responsibilities:
 * - Owns all API calls (via UsuariosService)
 * - Holds application-level state (list, filter, form model, messages)
 * - Delegates presentation to child components via @Input / @Output
 *
 * Child components (under ./componentes/) are stateless presentational
 * wrappers that know nothing about the service layer.
 */
@Component({
  selector: 'app-lista-usuarios',
  templateUrl: './lista-usuarios.component.html',
  styleUrls: ['./lista-usuarios.component.css'],
})
export class ListaUsuariosComponent implements OnInit, OnChanges {
  // ── Parent input ──
  @Input() filtroRol: 'todos' | 'admin' | 'profesor' | 'alumno' = 'todos';

  // ── List state ──
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];

  // ── Form state ──
  mostrarFormulario = false;
  modeloFormulario: UsuarioFormModel = crearUsuarioFormModel();

  // ── Feedback messages ──
  mensajeError = '';
  mensajeExito = '';

  constructor(private usuariosService: UsuariosService) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['filtroRol']) {
      this.aplicarFiltro();
    }
  }

  // ──────────────────────────────────────────────
  //  Data fetching
  // ──────────────────────────────────────────────

  cargarUsuarios(): void {
    this.usuariosService.obtenerTodos().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.aplicarFiltro();
      },
      error: (err) => console.error('Error al cargar usuarios', err),
    });
  }

  aplicarFiltro(): void {
    this.usuariosFiltrados =
      this.filtroRol === 'todos'
        ? this.usuarios
        : this.usuarios.filter((usuario) => usuario.rol === this.filtroRol);
  }

  get tituloListado(): string {
    const titulos: Record<string, string> = {
      todos: 'Usuarios',
      admin: 'Administradores',
      profesor: 'Profesores',
      alumno: 'Alumnos',
    };
    return titulos[this.filtroRol];
  }

  // ──────────────────────────────────────────────
  //  Form toggle / reset
  // ──────────────────────────────────────────────

  toggleForm(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    this.mensajeError = '';
    this.mensajeExito = '';
    if (!this.mostrarFormulario) {
      this.modeloFormulario = crearUsuarioFormModel();
    }
  }

  // ──────────────────────────────────────────────
  //  Create user
  // ──────────────────────────────────────────────

  crearUsuario(): void {
    if (
      !this.modeloFormulario.nombre ||
      !this.modeloFormulario.email ||
      !this.modeloFormulario.contrasena
    ) {
      this.mensajeError = 'Nombre, email y contraseña son obligatorios';
      return;
    }

    this.usuariosService
      .crear({
        nombre: this.modeloFormulario.nombre,
        email: this.modeloFormulario.email,
        password: this.modeloFormulario.contrasena,
        rol: this.modeloFormulario.rol,
      })
      .subscribe({
        next: () => {
          this.mostrarFormulario = false;
          this.modeloFormulario = crearUsuarioFormModel();
          this.mensajeError = '';
          this.mensajeExito = 'Usuario creado correctamente';
          this.cargarUsuarios();
          setTimeout(() => (this.mensajeExito = ''), 3000);
        },
        error: (err) => {
          console.error('Error al crear usuario', err);
          this.mensajeError = err.error?.error || 'Error al crear usuario';
        },
      });
  }

  // ──────────────────────────────────────────────
  //  Delete
  // ──────────────────────────────────────────────

  confirmarEliminar(usuario: Usuario): void {
    if (
      confirm(
        `¿Eliminar usuario "${usuario.nombre}"? Esta acción no se puede deshacer.`
      )
    ) {
      this.eliminarUsuario(usuario.id);
    }
  }

  private eliminarUsuario(id: number): void {
    this.usuariosService.eliminar(id).subscribe({
      next: () => {
        this.mensajeExito = 'Usuario eliminado correctamente';
        this.cargarUsuarios();
        setTimeout(() => (this.mensajeExito = ''), 3000);
      },
      error: (err) => console.error('Error al eliminar usuario', err),
    });
  }
}

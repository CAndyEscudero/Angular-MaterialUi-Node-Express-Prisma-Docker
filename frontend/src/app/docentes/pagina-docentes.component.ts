import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ServicioAutenticacion } from '../autenticacion/autenticacion.service';
import { MateriasProfesorService, ProfesorResumen } from '../servicios/materias-profesor.service';
import { ExamenesService, Examen } from '../servicios/examenes.service';
import { MateriasService, Materia } from '../servicios/materias.service';
import { ThemeService } from '../servicios/theme.service';
import { NotificacionesService, Notificacion } from '../servicios/notificaciones.service';
import { AnunciosService, Anuncio } from '../servicios/anuncios.service';

@Component({
  selector: 'app-docentes',
  templateUrl: './pagina-docentes.component.html',
  styleUrls: ['./pagina-docentes.component.css'],
})
export class DocentesComponent implements OnInit, OnDestroy {
  seccionActiva: string = 'dashboard';
  materiaSeleccionadaId: number | null = null;
  menuOpen = false;
  notifsNoLeidas = 0;
  panelNotifsAbierto = false;
  anuncioHighlightId: number | null = null;
  private destroy$ = new Subject<void>();

  // Dashboard data
  totalMaterias: number = 0;
  totalEstudiantes: number = 0;
  notasPendientes: number = 0;
  materiasLista: any[] = [];

  // Exams
  misExamenes: Examen[] = [];
  materiasParaExamen: Materia[] = [];
  mostrarFormularioExamen = false;
  examenEditar: Examen | null = null;

  // Announcements (profesor)
  docenteAnuncios: Anuncio[] = [];
  docenteMaterias: any[] = [];
  mostrarFormAnuncio = false;
  formAnuncio = { titulo: '', contenido: '', materia_id: null as number | null, publicar: false };
  mensajeExito = '';
  mensajeError = '';

  get stats() {
    return [
      { icon: 'book', value: this.totalMaterias, label: 'Materias', variant: 'blue' as const, action: () => this.seccionActiva = 'materias' },
      { icon: 'group', value: this.totalEstudiantes, label: 'Estudiantes', variant: 'green' as const, action: () => this.seccionActiva = 'estudiantes' },
      { icon: 'menu_book', value: this.materiasLista.length, label: 'Activas', variant: 'yellow' as const, action: undefined },
      { icon: 'grading', value: this.notasPendientes, label: 'Pendientes', variant: 'pink' as const, action: () => this.seccionActiva = 'estudiantes' },
    ];
  }

  constructor(
    private servicioAutenticacion: ServicioAutenticacion,
    private materiasProfesorService: MateriasProfesorService,
    private examenesService: ExamenesService,
    private materiasService: MateriasService,
    private themeService: ThemeService,
    private notificacionesService: NotificacionesService,
    private anunciosService: AnunciosService,
  ) {}

  ngOnInit(): void {
    this.cargarDashboardData();
    this.iniciarNotificaciones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private iniciarNotificaciones(): void {
    this.notificacionesService.contarNoLeidas().subscribe({
      next: (res) => (this.notifsNoLeidas = res.cantidad),
    });
    this.notificacionesService.pollingNoLeidas$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => (this.notifsNoLeidas = res.cantidad),
      });
  }

  togglePanelNotifs(): void {
    this.panelNotifsAbierto = !this.panelNotifsAbierto;
    if (this.panelNotifsAbierto) {
      this.notificacionesService.contarNoLeidas().subscribe({
        next: (res) => (this.notifsNoLeidas = res.cantidad),
      });
    }
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.panelNotifsAbierto = false;
  }

  private cargarDashboardData(): void {
    this.materiasProfesorService.obtenerMiResumen().subscribe({
      next: (data) => {
        this.totalMaterias = data.totalMaterias;
        this.totalEstudiantes = data.totalEstudiantes;
        this.notasPendientes = data.notasPendientes;
        this.materiasLista = data.materias;
      },
      error: () => {
        console.error('Error loading professor summary');
      },
    });
    this.cargarExamenes();
  }

  private cargarExamenes(): void {
    this.examenesService.obtenerTodos().subscribe({
      next: (data) => { this.misExamenes = data; },
    });
    this.materiasService.obtenerTodas().subscribe({
      next: (data) => { this.materiasParaExamen = data; },
    });
  }

  get isDark(): boolean {
    return this.themeService.isDark();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  cerrarSesion(): void {
    this.servicioAutenticacion.cerrarSesion();
  }

  alSeleccionarMateria(materiaId: number): void {
    this.materiaSeleccionadaId = materiaId;
  }

  abrirNuevoExamen(): void {
    this.examenEditar = null;
    this.mostrarFormularioExamen = true;
  }

  abrirEditarExamen(examen: Examen): void {
    this.examenEditar = { ...examen };
    this.mostrarFormularioExamen = true;
  }

  cancelarFormularioExamen(): void {
    this.mostrarFormularioExamen = false;
    this.examenEditar = null;
  }

  guardarExamen(data: any): void {
    if (this.examenEditar) {
      this.examenesService.actualizar(this.examenEditar.id, data).subscribe({
        next: () => {
          this.cancelarFormularioExamen();
          this.cargarExamenes();
        },
      });
    } else {
      this.examenesService.crear(data as any).subscribe({
        next: () => {
          this.cancelarFormularioExamen();
          this.cargarExamenes();
        },
      });
    }
  }

  eliminarExamen(id: number): void {
    if (!confirm('¿Eliminar este examen?')) return;
    this.examenesService.eliminar(id).subscribe({
      next: () => this.cargarExamenes(),
    });
  }

  // ── Anuncios ────────────────────────────────────────────

  irAAnuncios(): void {
    this.seccionActiva = 'anuncios';
    this.cargarDocenteAnuncios();
  }

  cargarDocenteAnuncios(): void {
    this.anunciosService.obtenerDocente().subscribe({
      next: (data) => { this.docenteAnuncios = data; },
      error: (err) => console.error('Error al cargar anuncios docente', err),
    });
    this.materiasProfesorService.obtenerMiResumen().subscribe({
      next: (data) => { this.docenteMaterias = data.materias; },
    });
  }

  toggleFormAnuncio(): void {
    this.mostrarFormAnuncio = !this.mostrarFormAnuncio;
    this.mensajeError = '';
    this.mensajeExito = '';
    if (this.mostrarFormAnuncio) {
      this.formAnuncio = { titulo: '', contenido: '', materia_id: null, publicar: false };
    }
  }

  guardarAnuncioMateria(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (!this.formAnuncio.titulo || !this.formAnuncio.titulo.trim()) {
      this.mensajeError = 'El título es obligatorio';
      return;
    }
    if (!this.formAnuncio.contenido || !this.formAnuncio.contenido.trim()) {
      this.mensajeError = 'El contenido es obligatorio';
      return;
    }
    if (!this.formAnuncio.materia_id) {
      this.mensajeError = 'Seleccioná una materia';
      return;
    }

    this.anunciosService.crearMateria({
      titulo: this.formAnuncio.titulo.trim(),
      contenido: this.formAnuncio.contenido.trim(),
      materia_id: this.formAnuncio.materia_id,
      estado: this.formAnuncio.publicar ? 'publicado' : 'borrador',
    }).subscribe({
      next: (res) => {
        this.mostrarFormAnuncio = false;
        this.mensajeExito = this.formAnuncio.publicar
          ? 'Anuncio creado y publicado. Los alumnos recibirán una notificación.'
          : 'Anuncio guardado como borrador.';
        this.cargarDocenteAnuncios();
        setTimeout(() => (this.mensajeExito = ''), 4000);
      },
      error: (err) => {
        this.mensajeError = err.error?.error || 'Error al crear anuncio';
      },
    });
  }

  /** Publicar un anuncio existente (borrador → publicado) */
  publicarAnuncio(id: number): void {
    if (!confirm('¿Publicar este anuncio? Los alumnos recibirán una notificación.')) return;
    this.anunciosService.publicar(id).subscribe({
      next: () => {
        this.mensajeExito = 'Anuncio publicado correctamente';
        this.cargarDocenteAnuncios();
        setTimeout(() => (this.mensajeExito = ''), 4000);
      },
      error: (err) => {
        this.mensajeError = err.error?.error || 'Error al publicar anuncio';
      },
    });
  }

  /** Archivar un anuncio publicado */
  archivarAnuncio(id: number): void {
    if (!confirm('¿Archivar este anuncio?')) return;
    this.anunciosService.archivar(id).subscribe({
      next: () => {
        this.mensajeExito = 'Anuncio archivado correctamente';
        this.cargarDocenteAnuncios();
        setTimeout(() => (this.mensajeExito = ''), 4000);
      },
      error: (err) => {
        this.mensajeError = err.error?.error || 'Error al archivar anuncio';
      },
    });
  }

  /** Eliminar un anuncio */
  eliminarAnuncio(id: number): void {
    if (!confirm('¿Eliminar este anuncio definitivamente? Esta acción no se puede deshacer.')) return;
    this.anunciosService.eliminar(id).subscribe({
      next: () => {
        this.mensajeExito = 'Anuncio eliminado correctamente';
        this.cargarDocenteAnuncios();
        setTimeout(() => (this.mensajeExito = ''), 4000);
      },
      error: (err) => {
        this.mensajeError = err.error?.error || 'Error al eliminar anuncio';
      },
    });
  }

  /** Obtener badge class según estado del anuncio */
  badgeClass(estado: string): string {
    switch (estado) {
      case 'publicado': return 'badge badge--success';
      case 'borrador': return 'badge badge--warning';
      case 'archivado': return 'badge badge--secondary';
      default: return 'badge';
    }
  }

  /** Obtener label en español según estado */
  estadoLabel(estado: string): string {
    switch (estado) {
      case 'publicado': return 'Publicado';
      case 'borrador': return 'Borrador';
      case 'archivado': return 'Archivado';
      default: return estado;
    }
  }

  /** Verificar si se puede publicar (borrador, no archivado) */
  puedePublicar(anuncio: Anuncio): boolean {
    return anuncio.estado === 'borrador' || anuncio.estado === 'publicado';
  }

  /** Verificar si se puede archivar (solo publicado) */
  puedeArchivar(anuncio: Anuncio): boolean {
    return anuncio.estado === 'publicado';
  }

  // ── Navegación desde notificación ───────────────────────

  onNotificacionSeleccionada(notif: Notificacion): void {
    this.panelNotifsAbierto = false;

    if (notif.tipo === 'anuncio') {
      this.anuncioHighlightId = notif.referencia_id;
      this.irAAnuncios();
    }
  }
}

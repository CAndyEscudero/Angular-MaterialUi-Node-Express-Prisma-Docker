import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ServicioAutenticacion } from '../autenticacion/autenticacion.service';
import { InscripcionesService, Inscripcion } from '../servicios/inscripciones.service';
import { MateriasService, Materia } from '../servicios/materias.service';
import { AlumnosService, PerfilAlumno } from '../servicios/alumnos.service';
import { ExamenesService, Examen } from '../servicios/examenes.service';
import { ThemeService } from '../servicios/theme.service';
import { NotificacionesService, Notificacion } from '../servicios/notificaciones.service';

@Component({
  selector: 'app-estudiantes',
  templateUrl: './pagina-estudiantes.component.html',
  styleUrls: ['./pagina-estudiantes.component.css'],
})
export class EstudiantesComponent implements OnInit, OnDestroy {
  seccionActiva: string = 'dashboard';
  menuOpen = false;
  notifsNoLeidas = 0;
  panelNotifsAbierto = false;
  anuncioHighlightId: number | null = null;
  private destroy$ = new Subject<void>();

  // Profile data
  perfil: PerfilAlumno | null = null;

  // Exams
  misExamenes: Examen[] = [];

  // Dashboard data
  totalInscripto: number = 0;
  totalDisponibles: number = 0;
  materiasConNota: number = 0;
  promedioGeneral: string = '—';
  inscripcionesRecientes: Inscripcion[] = [];
  disponiblesRecientes: Materia[] = [];
  todasMaterias: Materia[] = [];

  get stats() {
    return [
      { icon: 'assignment', value: this.totalInscripto, label: 'Inscripto', variant: 'green' as const, action: () => this.seccionActiva = 'inscripciones' },
      { icon: 'book', value: this.totalDisponibles, label: 'Disponibles', variant: 'blue' as const, action: () => this.seccionActiva = 'disponibles' },
      { icon: 'star', value: this.materiasConNota, label: 'Con Nota', variant: 'yellow' as const, action: undefined },
      { icon: 'grade', value: this.promedioGeneral, label: 'Promedio', variant: 'pink' as const, action: undefined },
    ];
  }

  constructor(
    private servicioAutenticacion: ServicioAutenticacion,
    private inscripcionesService: InscripcionesService,
    private materiasService: MateriasService,
    private alumnosService: AlumnosService,
    private examenesService: ExamenesService,
    private themeService: ThemeService,
    private notificacionesService: NotificacionesService,
  ) {}

  ngOnInit(): void {
    this.cargarDashboardData();
    this.cargarPerfil();
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

  private cargarPerfil(): void {
    this.alumnosService.obtenerMiPerfil().subscribe({
      next: (data: PerfilAlumno) => {
        this.perfil = data;
      },
      error: () => console.error('Error loading profile'),
    });
  }

  private cargarDashboardData(): void {
    const usuarioId = this.servicioAutenticacion.obtenerUsuarioId();
    let materiasInscriptasId = new Set<number>();

    // Inscripciones del alumno
    if (usuarioId) {
      this.inscripcionesService.obtenerPorAlumno(usuarioId).subscribe({
        next: (data: Inscripcion[]) => {
          this.totalInscripto = data.length;
          this.materiasConNota = data.filter(i => i.nota !== null).length;
          this.inscripcionesRecientes = data.slice(-5).reverse();
          materiasInscriptasId = new Set(data.map(i => i.materia_id));

          // Recalculate disponibles now that we know which are taken
          this.disponiblesRecientes = this.todasMaterias.filter(m => !materiasInscriptasId.has(m.id));
          this.totalDisponibles = this.disponiblesRecientes.length;

          // Calculate average
          const notas = data.filter(i => i.nota !== null).map(i => i.nota as number);
          if (notas.length > 0) {
            const avg = notas.reduce((a, b) => a + b, 0) / notas.length;
            this.promedioGeneral = avg.toFixed(1);
          }
        },
        error: () => console.error('Error loading inscripciones'),
      });
    }

    // Todas las materias
    this.materiasService.obtenerTodas().subscribe({
      next: (data: Materia[]) => {
        this.todasMaterias = data;
        this.disponiblesRecientes = data.filter(m => !materiasInscriptasId.has(m.id));
        this.totalDisponibles = this.disponiblesRecientes.length;
      },
      error: (err: any) => console.error('Error loading materias', err),
    });

    this.cargarExamenes();
  }

  private cargarExamenes(): void {
    this.examenesService.obtenerTodos().subscribe({
      next: (data) => { this.misExamenes = data; },
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

  // ── Navegación desde notificación ───────────────────────

  onNotificacionSeleccionada(notif: Notificacion): void {
    this.panelNotifsAbierto = false;

    if (notif.tipo === 'anuncio') {
      this.anuncioHighlightId = notif.referencia_id;
      this.seccionActiva = 'anuncios';
    }
  }
}

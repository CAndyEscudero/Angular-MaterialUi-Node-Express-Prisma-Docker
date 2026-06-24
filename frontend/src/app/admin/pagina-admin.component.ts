import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ServicioAutenticacion } from '../autenticacion/autenticacion.service';
import { UsuariosService, Usuario } from '../servicios/usuarios.service';
import { MateriasService, Materia } from '../servicios/materias.service';
import { CarrerasService } from '../servicios/carreras.service';
import { InscripcionesService, PeriodoStatus } from '../servicios/inscripciones.service';
import {
  InscripcionesCarreraService,
  InscripcionCarrera,
} from '../servicios/inscripciones-carrera.service';
import { ExamenesService, Examen } from '../servicios/examenes.service';
import { ThemeService } from '../servicios/theme.service';
import { NotificacionesService } from '../servicios/notificaciones.service';

interface DiaCalendario {
  numero: number;
  esHoy: boolean;
  esOtroMes: boolean;
}

@Component({
  selector: 'app-pagina-admin',
  templateUrl: './pagina-admin.component.html',
  styleUrls: ['./pagina-admin.component.css'],
})
export class PaginaAdminComponent implements OnInit, OnDestroy {
  seccionActiva: string = 'dashboard';
  filtroUsuarios: 'todos' | 'admin' | 'profesor' | 'alumno' = 'todos';
  menuOpen = false;
  notifsNoLeidas = 0;
  panelNotifsAbierto = false;
  private destroy$ = new Subject<void>();

  // Dashboard data
  totalUsuarios: number = 0;
  totalMaterias: number = 0;
  totalProfesores: number = 0;
  totalAlumnos: number = 0;
  totalCarreras: number = 0;
  usuariosRecientes: Usuario[] = [];
  materiasRecientes: Materia[] = [];
  // New dashboard data
  solicitudesPendientes: InscripcionCarrera[] = [];
  totalSolicitudesPendientes: number = 0;
  totalInscripcionesMaterias: number = 0;
  periodoStatus: PeriodoStatus | null = null;

  // Exams
  todosExamenes: Examen[] = [];

  // Calendar
  mesActual: string = '';
  anioActual: number = 0;
  mesIndex: number = 0;
  anioCalendario: number = 0;
  diasCalendario: DiaCalendario[] = [];

  private readonly NOMBRES_MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  get stats() {
    return [
      { icon: 'group', value: this.totalUsuarios, label: 'Usuarios', variant: 'lavender' as const, action: () => this.irAUsuarios('todos') },
      { icon: 'book', value: this.totalMaterias, label: 'Materias', variant: 'yellow' as const, action: () => this.seccionActiva = 'materias' },
      { icon: 'school', value: this.totalProfesores, label: 'Profesores', variant: 'blue' as const, action: () => this.irAUsuarios('profesor') },
      { icon: 'person', value: this.totalAlumnos, label: 'Alumnos', variant: 'pink' as const, action: () => this.irAUsuarios('alumno') },
      { icon: 'how_to_reg', value: this.totalSolicitudesPendientes, label: 'Solicitudes', variant: 'orange' as const, action: () => this.seccionActiva = 'inscripciones-carrera' },
      { icon: 'assignment', value: this.totalInscripcionesMaterias, label: 'Inscripciones', variant: 'teal' as const, action: undefined },
    ];
  }

  constructor(
    private servicioAutenticacion: ServicioAutenticacion,
    private usuariosService: UsuariosService,
    private materiasService: MateriasService,
    private carrerasService: CarrerasService,
    private inscripcionesService: InscripcionesService,
    private inscripcionesCarreraService: InscripcionesCarreraService,
    private examenesService: ExamenesService,
    private themeService: ThemeService,
    private notificacionesService: NotificacionesService,
  ) {}

  ngOnInit(): void {
    this.inicializarCalendario();
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
    this.usuariosService.obtenerTodos().subscribe({
      next: (data) => {
        this.usuariosRecientes = data.slice(-5).reverse();
        this.totalUsuarios = data.length;
        this.totalProfesores = data.filter(u => u.rol === 'profesor').length;
        this.totalAlumnos = data.filter(u => u.rol === 'alumno').length;
      },
    });

    this.materiasService.obtenerTodas().subscribe({
      next: (data) => {
        this.materiasRecientes = data.slice(-5).reverse();
        this.totalMaterias = data.length;
        this.totalInscripcionesMaterias = data.reduce(
          (sum, m) => sum + (m.inscriptos_count || 0),
          0
        );
      },
    });

    this.carrerasService.obtenerTodas().subscribe({
      next: (data) => {
        this.totalCarreras = data.length;
      },
    });

    // Get pending career applications
    this.inscripcionesCarreraService.obtenerTodas('pendiente').subscribe({
      next: (data) => {
        this.solicitudesPendientes = data.slice(0, 5);
        this.totalSolicitudesPendientes = data.length;
      },
    });

    // Get current enrollment period status
    this.inscripcionesService.obtenerPeriodoActual().subscribe({
      next: (data) => {
        this.periodoStatus = data;
      },
    });

    this.cargarExamenes();
  }

  private cargarExamenes(): void {
    this.examenesService.obtenerTodos().subscribe({
      next: (data) => { this.todosExamenes = data; },
    });
  }

  private inicializarCalendario(): void {
    const ahora = new Date();
    this.mesIndex = ahora.getMonth();
    this.anioCalendario = ahora.getFullYear();
    this.generarCalendario();
  }

  private generarCalendario(): void {
    this.mesActual = this.NOMBRES_MESES[this.mesIndex];
    this.anioActual = this.anioCalendario;

    const primerDia = new Date(this.anioCalendario, this.mesIndex, 1);
    const ultimoDia = new Date(this.anioCalendario, this.mesIndex + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaSemInicio = primerDia.getDay(); // 0=Dom

    const hoy = new Date();
    const hoyStr = `${hoy.getFullYear()}-${hoy.getMonth()}-${hoy.getDate()}`;

    this.diasCalendario = [];

    // Días del mes anterior
    const mesAnterior = new Date(this.anioCalendario, this.mesIndex, 0);
    const diasMesAnterior = mesAnterior.getDate();
    for (let i = diaSemInicio - 1; i >= 0; i--) {
      this.diasCalendario.push({
        numero: diasMesAnterior - i,
        esHoy: false,
        esOtroMes: true,
      });
    }

    // Días del mes actual
    for (let d = 1; d <= diasEnMes; d++) {
      const fechaStr = `${this.anioCalendario}-${this.mesIndex}-${d}`;
      this.diasCalendario.push({
        numero: d,
        esHoy: fechaStr === hoyStr,
        esOtroMes: false,
      });
    }

    // Completar para que tenga 42 celdas (6 semanas)
    while (this.diasCalendario.length < 42) {
      const dia = this.diasCalendario.length - diaSemInicio - diasEnMes + 1;
      this.diasCalendario.push({
        numero: dia,
        esHoy: false,
        esOtroMes: true,
      });
    }
  }

  mesAnterior(): void {
    this.mesIndex--;
    if (this.mesIndex < 0) {
      this.mesIndex = 11;
      this.anioCalendario--;
    }
    this.generarCalendario();
  }

  mesSiguiente(): void {
    this.mesIndex++;
    if (this.mesIndex > 11) {
      this.mesIndex = 0;
      this.anioCalendario++;
    }
    this.generarCalendario();
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

  irAUsuarios(filtro: 'todos' | 'admin' | 'profesor' | 'alumno' = 'todos'): void {
    this.filtroUsuarios = filtro;
    this.seccionActiva = 'usuarios';
  }
}

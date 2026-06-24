# Checklist — Campus Virtual UTN

> Estado actual del sistema con módulos implementados y plan de desarrollo futuro.
> Basado en el análisis del código existente (backend Express + MySQL, frontend Angular 17).

## Convenciones

- `[x]` = implementado y funcional en el código actual
- `[~]` = implementación parcial / estructura existente pero incompleta
- `[ ]` = pendiente, no implementado
- Las notas al pie detallan el alcance de lo implementado

---

## 1. Autenticación y Usuarios

### 1.1 Registro y Login
- [x] **Login con JWT** — `POST /api/usuarios/login` retorna token + rol
- [x] **Registro de usuarios** — `POST /api/usuarios` con nombre, email, password, rol
- [x] **Hash de contraseñas** — bcrypt con 10 salt rounds
- [x] **Interceptor HTTP** — Frontend agrega `Authorization: Bearer <token>` automáticamente
- [x] **Guard de rutas** — `GuardiaAutenticacion` protege rutas lazy (admin, docentes, estudiantes)
- [x] **Roles: admin, profesor, alumno** — ENUM en DB, validación en middleware
- [x] **Cierre de sesión** — Borra token de localStorage
- [ ] **Registro con confirmación email** — Pendiente
- [ ] **Recuperación de contraseña** — Pendiente (hay `cambiarPassword` en modelo pero sin ruta pública)
- [ ] **Login con redes sociales** — Pendiente
- [ ] **2FA / MFA** — Pendiente

### 1.2 Perfiles
- [x] **Perfil de alumno** — Tabla `alumnos` con `usuario_id`, `carrera`
- [x] **Perfil de profesor** — Tabla `profesores` con `usuario_id`, `especialidad`
- [ ] **Perfil de administrador** — Solo existe como `usuarios.rol = 'admin'`
- [ ] **Editar perfil propio** — Pendiente (solo hay CRUD de admin)
- [ ] **Foto de perfil / avatar** — Pendiente (interfaz usa `/avatar.png` fijo)
- [ ] **Preferencias de usuario** — Pendiente

### 1.3 Gestión de Usuarios (Admin)
- [x] **Listar usuarios** — `GET /api/usuarios` (público)
- [x] **Crear usuario** — `POST /api/usuarios`
- [x] **Actualizar usuario** — `PUT /api/usuarios/:id`
- [x] **Eliminar usuario** — `DELETE /api/usuarios/:id` (cascade)
- [x] **Lista de usuarios en frontend** — Componente `lista-usuarios` en admin
- [ ] **Filtros y búsqueda** — Pendiente (solo hay buscador visual sin implementar)
- [ ] **Paginación** — Pendiente
- [ ] **Exportar usuarios** — Pendiente
- [ ] **Desactivar/activar usuarios** — Pendiente (no hay columna `activo`)

---

## 2. Carreras y Plan de Estudios

### 2.1 Carreras
- [x] **CRUD de carreras** — `GET /api/carreras`, `POST`, `PUT`, `DELETE` con soft-delete
- [x] **Lista de carreras en frontend** — Componente `lista-carreras` con listado, creación, edición, desactivación
- [x] **Asignar carrera a alumno** — Se asigna automáticamente al aprobar `inscripciones_carrera` (alumnos.carrera_id FK)
- [ ] **Plan de estudios por carrera** — Pendiente

### 2.2 Materias
- [x] **Listar materias** — `GET /api/materias`
- [x] **Obtener materia por ID** — `GET /api/materias/:id`
- [x] **Crear materia** — `POST /api/materias` (profesor/admin)
- [x] **Actualizar materia** — `PUT /api/materias/:id` (profesor/admin)
- [x] **Eliminar materia** — `DELETE /api/materias/:id` (profesor/admin)
- [x] **Materias por profesor** — `GET /api/materias?profesor_id=X`
- [x] **Lista de materias en frontend** — Admin y profesor tienen listas
- [x] **Campos extendidos de materia** — Columnas ya existen en `001_init.sql`. Backend y frontend actualizados con todos los campos: descripcion, cuatrimestre, anio, carrera, carrera_id, dia_horario, cupo_maximo, aula, modalidad, estado, creditos, anio_carrera. JOIN con carreras para obtener carrera_nombre.
- [x] **Modalidad (presencial/virtual/híbrida)** — Implementado en backend y frontend
- [x] **Créditos por materia** — Implementado en backend y frontend
- [x] **Aula asignada** — Implementado en backend y frontend
- [x] **Selector de carrera en formulario de materias** — Frontend carga carreras activas como selector

### 2.3 Correlatividades
- [x] **Tabla de correlatividades** — `correlatividades` con `materia_id`, `correlativa_id`, `tipo (regular/analitica)`, UNIQUE(materia_id, correlativa_id). Creada en `001_init.sql` para bases fresh y migration `007_correlatividades_seed.sql` idempotente para bases existentes.
- [x] **Validación al inscribirse** — `POST /api/inscripciones` valida correlativas después del cupo máximo y antes de crear la inscripción. Retorna 409 con `correlativas_faltantes[]` si no cumple. Sin correlativas configuradas, funciona igual que antes.
- [x] **Visualización de correlatividades** — `GET /api/materias` incluye `correlativas[]` con id, nombre, código y tipo. Frontend `materias-disponibles` muestra columna "Correlativas" con badges de tipo (R=Regular, A=Analítica).
- [x] **Seed demo** — Migration 007 agrega Programación II (PROG-201). PROG-101 requiere Álgebra Lineal (regular). PROG-201 requiere PROG-101 (analítica). Inscripción seed en ALG-101 actualizada a nota=85 aprobada.

### 2.4 Inscripción a Carrera (Primer Nivel)
- [x] **Tabla `inscripciones_carrera`** — Creada con estados: pendiente, aprobada, rechazada, cancelada
- [x] **Tabla `documentos_inscripcion`** — Metadatos de documentos adjuntos por tipo (dni_frente, dni_dorso, titulo_secundario, foto_carnet, otro)
- [x] **Migration 004** — Script idempotente para DBs existentes
- [x] **Updated 001_init.sql** — Incluye nuevas tablas para bases fresh
- [x] **POST /api/inscripciones-carrera/solicitar** — Alumno solicita inscripción con documentos (multipart)
- [x] **GET /api/inscripciones-carrera/mi-solicitud** — Alumno ve su solicitud y estado
- [x] **GET /api/inscripciones-carrera** — Admin lista todas las solicitudes (con filtro por estado)
- [x] **GET /api/inscripciones-carrera/:id** — Admin ve detalle de solicitud
- [x] **PUT /api/inscripciones-carrera/:id/revisar** — Admin aprueba/rechaza con motivo
- [x] **GET /api/inscripciones-carrera/documentos/:docId** — Descarga/visualización de documentos (protegido)
- [x] **Subida de archivos con multer** — 5MB max, solo JPG/PNG/PDF
- [x] **Al aprobar: actualiza alumno.carrera_id** — Vinculación automática
- [x] **Al aprobar: genera legajo automático** — Usa prefijo del código de carrera + secuencia numérica (LI-00001, etc.). Se omite si el alumno ya tiene legajo. Migration 005 agrega UNIQUE INDEX en `alumnos.legajo`.
- [x] **Frontend alumno: Inscripción a Carrera** — Formulario con selección de carrera y carga de docs
- [x] **Frontend alumno: estado de solicitud** — Vista de pendiente/aprobada/rechazada con documentos subidos
- [x] **Frontend admin: Solicitudes de Carrera** — Lista con filtros + modal de revisión con aprobar/rechazar
- [x] **Documentos visibles/descargables** — Desde modal de admin como enlace

---

## 3. Inscripciones

### 3.1 Inscripción a Materias
- [x] **Inscribir alumno** — `POST /api/inscripciones`
- [x] **Validación de duplicados** — Unique key (alumno_id, materia_id) + manejo `ER_DUP_ENTRY`
- [x] **Listar inscripciones por alumno** — `GET /api/inscripciones/alumno/:id`
- [x] **Listar inscripciones por materia** — `GET /api/inscripciones/materia/:id` (profesor/admin)
- [x] **Eliminar inscripción** — `DELETE /api/inscripciones/:id`
- [x] **Verificación de pertenencia** — Alumno solo ve sus propias inscripciones
- [x] **Frontend: materias disponibles** — Componente `materias-disponibles` (excluye ya inscritas)
- [x] **Frontend: mis inscripciones** — Componente `mis-inscripciones`
- [x] **Validación de cupo máximo** — Implementado: backend valida `cupo_maximo` en `POST /api/inscripciones` (retorna 409 si completo); frontend muestra cupos disponibles, deshabilita botón y marca "(completo)" cuando se agota el cupo
- [x] **Validación de correlatividades** — Implementado: backend valida en `POST /api/inscripciones` después del cupo y antes de insertar. Retorna 409 con detalle de correlativas faltantes. Acepta 'regular' (cursada activa/aprobada) y 'analítica' (nota >= 60).
- [x] **Períodos de inscripción** — Implementado con tabla `periodos_inscripcion`, migration 008, validación backend en `POST /api/inscripciones` (retorna 403 si no hay período abierto), endpoint `GET /api/inscripciones/periodo-actual`, y frontend `materias-disponibles` con banner verde/rojo y botones deshabilitados fuera del período. Regla de negocio: los alumnos solo pueden inscribirse cuando existe un período activo con CURDATE() entre fecha_inicio y fecha_fin.
- [ ] **Estado de inscripción (pendiente/aceptada/rechazada)** — Pendiente
- [ ] **Inscripción a comisiones** — Pendiente

### 3.2 Notas y Calificaciones
- [x] **Cargar nota** — `PUT /api/inscripciones/:id/nota` (profesor/admin)
- [x] **Rango de notas 0-100** — Validación en controlador
- [x] **Visualización en frontend** — Alumno ve notas en sus inscripciones
- [x] **Estadísticas en dashboard** — Promedio, materias con nota
- [ ] **Promedio general calculado** — Solo visual, no tiene endpoint dedicado
- [ ] **Historial de notas por período** — Pendiente
- [ ] **Nota de examen vs nota final** — Pendiente (solo hay `inscripciones.nota`)
- [ ] **Escala de notas (1-10, 1-100, concepto)** — Pendiente
- [ ] **Acta de notas / libro digital** — Pendiente

---

## 4. Dashboard y UX

### 4.0 General (todos los roles)
- [x] **Dark mode / Theme toggle** — Implementado en los 3 headers con toggle visual (dark/light), persistencia en localStorage, variables CSS custom (`.dark-mode`), colores Consistentes para cards, tablas, formularios, badges, sidebar y panel de notificaciones
- [x] **Material Symbols** — Migración completa de Font Awesome a Material Symbols (iconos filled/outlined/sharp según contexto) en los 3 dashboards, headers, tablas, formularios y componentes
- [x] **Dashboard stat-card reutilizable** — Componente standalone `app-dashboard-stat-card` con inputs (icon, value, label, variant, ariaLabel, clickable). Se usa en admin dashboard con data-driven array; extensible a otros dashboards. Path: `componentes/dashboard-stat-card/`
- [~] **Diseño responsive** — Layout adaptativo base implementado para mobile/tablet/desktop en los 3 dashboards: sidebar colapsable, headers con menú hamburguesa, tablas con scroll horizontal y cards en grid flexible. Auditoría responsive con correcciones aplicadas:
  - [x] **Notificaciones y mensajes en mobile** — Se eliminó el `display:none` de los botones de notificaciones/mensajes en mobile. Ahora son accesibles en todas las vistas.
  - [x] **Panel de notificaciones mobile** — Ancho cambiado a `width: min(380px, calc(100vw - 32px))` para evitar desbordes en pantallas <400px.
  - [x] **Formularios en mobile** — `.form-row` colapsa a 1 columna en <=600px mediante media query global.
  - [x] **Usuario del header en mobile** — Nombre y badge se ocultan en <=1023px; se conserva avatar y botones de acción.
  - [x] **Touch targets del header** — Botones aumentados a 40x40px en mobile (mejora significativa vs 34x34, balance práctico para el layout).
  - [x] **Horario semanal responsive** — `.schedule-grid` con `overflow-x: auto` y `min-width: 520px` en <=768px para scroll horizontal.
  - [x] **Subida de documentos mobile** — `.doc-upload-row` colapsa a column layout en <=600px, evitando desbordes.
  - [x] **Banner de período mobile** — Se agregó `flex-wrap` al banner para evitar desbordes con textos largos.
- [ ] **Gráficos y métricas visuales** — Pendiente
- [ ] **Personalización de dashboard** — Pendiente
- [ ] **Exportar reportes** — Pendiente

### 4.1 Admin
- [x] **Dashboard con cards de resumen (usuarios, materias, profesores, alumnos)**
- [x] **Lista de usuarios recientes**
- [x] **Lista de materias recientes**
- [x] **Calendario mensual**
- [x] **Sección de anuncios**
- [x] **Navegación lateral con secciones**

### 4.2 Profesor
- [x] **Dashboard con KPI cards**
- [x] **Horario semanal simulado**
- [x] **Lista de materias asignadas**
- [x] **Sección de carga de notas**
- [x] **Acceso a estudiantes por materia**
- [x] **Dashboard con datos reales desde API** — Cards con KPIs reales (materias, alumnos, inscripciones), horario semanal desde `GET /api/materias?profesor_id=X`, estudiantes por materia con carga de notas
- [x] **Sección de anuncios con creación de anuncios por materia** — Sidebar "Anuncios" con lista completa visible + formulario de creación con selector de materia, publicación directa con notificación a alumnos
- [ ] **Calendario de eventos académicos** — Pendiente

### 4.3 Alumno
- [x] **Dashboard con materias inscriptas, disponibles, notas, promedio**
- [x] **Lista de materias disponibles para inscribirse**
- [x] **Lista de inscripciones con notas**
- [x] **Sección de anuncios** — Sidebar "Anuncios" con lista completa de anuncios generales + de materias inscriptas, con filtros y expandir/colapsar
- [ ] **Historial académico completo** — Pendiente
- [ ] **Progreso de carrera** — Pendiente

---

## 5. Anuncios y Comunicación

- [x] **CRUD de anuncios** — Implementado con tabla `anuncios` (migración 011), modelo, controlador, rutas protegidas, y frontend admin con formulario y tabla. Backend: GET /api/anuncios/admin, POST, PUT, DELETE, PUT /:id/publicar, PUT /:id/archivar. Frontend: `lista-anuncios` con creación, edición, publicación, archivado y eliminación.
- [x] **Anuncios generales** — Implementado. Soporte completo con tipo ENUM('general','materia'), preparado para materia-specific en el futuro. La UI actual solo expone anuncios generales.
- [x] **Anuncios por materia** — Implementado. Profesores pueden crear anuncios vinculados a sus materias desde la sección "Anuncios" del sidebar. Al publicar, se notifica automáticamente a los alumnos inscriptos en esa materia. Backend: GET /api/anuncios/publicados con filtrado por materia según inscripción (alumno) o propiedad (profesor), GET /api/anuncios/docente (lista del profesor), POST /api/anuncios/materia (creación con validación de pertenencia). PUT /:id/publicar notifica alumnos de la materia si tipo='materia'. Frontend: `lista-anuncios-publicos` standalone con filtros Todos/Generales/Por Materia, expandir/colapsar, badges, y highlight por ID de notificación.
- [x] **Sección completa de anuncios (alumno/profesor)** — Implementado. Sidebar con entrada "Anuncios" para ambos roles. Alumnos ven anuncios generales + de materias donde están inscriptos. Profesores ven anuncios generales + de materias que dictan, y pueden crear nuevos anuncios por materia con selector de materia, título, contenido, y opción de publicación directa con notificación.
- [x] **Navegación desde notificación** — Implementado. Panel de notificaciones emite evento `notificacionSeleccionada` al hacer click. Las páginas de docente/estudiante reciben el evento, cierran el panel, cambian a sección 'anuncios', y resaltan el anuncio correspondiente mediante `highlightId`.
- [ ] **Notificaciones push/email** — Pendiente
- [x] **Notificaciones in-app** — Tabla `notificaciones` con tipos (inscripcion_aprobada, inscripcion_rechazada, nota_cargada, examen_creado, periodo_inscripcion, anuncio). Backend: CRUD + helpers broadcast. Al publicar un anuncio general, se notifica a todos los usuarios según rol_destino. Al publicar un anuncio de materia, se notifica solo a los alumnos inscriptos en esa materia. Frontend: servicio con polling 30s, panel dropdown con badge de no leídas, marcar leídas, fechas relativas, navegación al hacer click.
- [ ] **Mensajería interna** — Pendiente

---

## 6. Materiales de Estudio

- [ ] **Módulos/Unidades por materia** — Pendiente (tabla `unidades` con orden, CRUD profesor)
- [ ] **Subir archivos por unidad** — Pendiente (tabla `materiales` con `unidad_id`, multer)
- [ ] **Visualización alumno por unidad** — Pendiente (materiales agrupados readonly)
- [ ] **Soporte de tipos: PDF, video, imagen, enlace** — Pendiente
- [ ] **Biblioteca digital global** — Pendiente

---

## 7. Trabajos Prácticos y Entregas

- [ ] **Crear trabajos prácticos** — Pendiente
- [ ] **Fecha de entrega** — Pendiente
- [ ] **Subir entregas (alumno)** — Pendiente
- [ ] **Corregir y calificar entregas (profesor)** — Pendiente
- [ ] **Estado de entrega (pendiente/entregado/corregido)** — Pendiente

---

## 8. Asistencia

- [ ] **Registro de asistencia por clase** — Pendiente
- [ ] **Visualización para alumno** — Pendiente
- [ ] **Reporte de asistencia** — Pendiente
- [ ] **QR para registro** — Pendiente

---

## 9. Evaluaciones y Exámenes

- [x] **Tabla `examenes`** — Migration 009 con columnas: materia_id, tipo (parcial/final/recuperatorio), fecha, hora, aula, observaciones
- [x] **CRUD de exámenes (backend)** — `GET /api/examenes` (filtro por materia/profesor), `POST`, `PUT`, `DELETE`. Validación de pertenencia (profesor solo edita exámenes de sus materias)
- [x] **Frontend admin: gestión de exámenes** — Lista global con filtros, creación/edición, eliminación
- [x] **Frontend profesor: exámenes de sus materias** — Crear, editar, eliminar exámenes
- [x] **Frontend alumno: calendario de exámenes** — Lista de exámenes de materias en las que está inscripto
- [x] **Notificaciones automáticas** — Al crear examen, notifica a todos los alumnos inscriptos en esa materia
- [~] **Notas separadas por evaluación** — Pendiente (la nota sigue siendo general en `inscripciones.nota`)
- [ ] **Acta de examen digital** — Pendiente
- [ ] **Firma digital de actas** — Pendiente

---

## 10. Calendario Académico

- [x] **Calendario mensual visual** — En dashboard admin
- [ ] **Eventos del calendario desde DB** — Pendiente
- [ ] **Calendario por materia** — Pendiente
- [ ] **Fechas de exámenes** — Pendiente
- [ ] **Feriados y recesos** — Pendiente
- [ ] **Integración con Google Calendar / iCal** — Pendiente

---

## 11. Reportes y Métricas

- [ ] **Reporte de alumnos por materia** — Pendiente
- [ ] **Estadísticas de rendimiento académico** — Pendiente
- [ ] **Exportar a PDF/Excel** — Pendiente
- [ ] **Dashboard de analytics** — Pendiente
- [ ] **Trazabilidad de cambios (auditoría)** — Pendiente

---

## 12. Certificados y Créditos

- [ ] **Generación de certificados (alumno regular, analítico)** — Pendiente
- [ ] **Registro de créditos académicos** — Pendiente
- [ ] **Verificación de certificados** — Pendiente
- [x] **Sistema de correlatividades (materia-correlativa)** — Implementado con tabla, validación backend y visualización frontend. Ver sección 2.3.

---

## 13. Encuestas y Evaluación Docente

- [ ] **Crear encuestas** — Pendiente
- [ ] **Responder encuestas (alumno)** — Pendiente
- [ ] **Resultados y reportes** — Pendiente

---

## 14. Biblioteca

- [ ] **Catálogo de recursos bibliográficos** — Pendiente
- [ ] **Préstamo digital** — Pendiente
- [ ] **Asociación a materia** — Pendiente

---

## 15. Automatizaciones

- [ ] **Recordatorios automáticos (fechas de entrega, exámenes)** — Pendiente
- [ ] **Actas automáticas al cerrar período** — Pendiente
- [x] **Bloqueo de inscripciones fuera de período** — Implementado con tabla `periodos_inscripcion`, validación en `POST /api/inscripciones` (retorna 403 si no hay período activo)
- [ ] **Cálculo de promedios automático** — Pendiente

---

## 16. Seguridad

- [x] **JWT con expiración (1h)** — Implementado
- [x] **Middleware de verificación de token** — `verificarToken`
- [x] **Middleware de roles** — `esProfesorOAdmin`
- [x] **Contraseñas hasheadas (bcrypt)** — Implementado en backend
- [ ] **Helmet / seguridad de headers** — Pendiente
- [ ] **Rate limiting** — Pendiente
- [ ] **Sanitización de inputs** — Pendiente (solo validación básica)
- [ ] **Logs de actividad / auditoría** — Pendiente
- [ ] **Refresh tokens** — Pendiente
- [ ] **CORS configurado** — Implementado pero sin lista blanca dinámica

---

## 17. Integraciones Futuras

- [ ] **API REST para consumidores externos** — Pendiente
- [ ] **Webhook de pagos (aranceles)** — Pendiente
- [ ] **Integración con SIU Guaraní** — Pendiente
- [ ] **SIU Kolla (encuestas)** — Pendiente
- [ ] **Notificaciones WhatsApp / Telegram** — Pendiente
- [ ] **Single Sign-On (SSO)** — Pendiente

---

## Resumen de Implementación

| Módulo | Estado | Prioridad |
|--------|--------|-----------|
| Autenticación y usuarios | ✅ 70% | Crítica |
| Materias | ✅ 90% (campos extendidos implementados) | Crítica |
| Inscripciones / Notas | ✅ 75% | Crítica |
| Dashboards y UX | ⚠️ 75% (datos reales + dark mode + responsive base + Material Symbols; auditoría responsive con gaps mobile) | Alta |
| Carreras / Plan Estudios | ✅ 55% (CRUD + frontend + correlatividades) | Alta |
| Notificaciones in-app | ✅ 100% (con navegación a anuncio) | Media |
| Anuncios | ✅ 90% (generales + materia-specific con notificación automática) | Media |
| Materiales de Estudio | ❌ 0% | Media |
| Trabajos Prácticos | ❌ 0% | Media |
| Asistencia | ❌ 0% | Media |
| Evaluaciones / Exámenes | ✅ 60% (CRUD + frontend 3 roles) | Media |
| Calendario | ❌ 0% | Media |
| Reportes | ❌ 0% | Media |
| Certificados | ❌ 0% | Baja |
| Encuestas | ❌ 0% | Baja |
| Biblioteca | ❌ 0% | Baja |
| Automatizaciones | ⚠️ 10% (bloqueo de inscripciones fuera de período) | Baja |
| Seguridad | ⚠️ 30% | Alta |
| Integraciones | ❌ 0% | Futura |

---

## Leyenda

- ✅ = Funcional y operativo
- ⚠️ = Parcial o con bugs conocidos
- ❌ = No implementado
- `[~]` = Implementación parcial

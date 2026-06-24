# 🎓 University Administration System — Thesis Demo

A full-stack university administration platform built as a thesis demo. Three role-based dashboards (admin, professor, student) with enrollment workflow, grade entry, and subject management.

## Architecture

```
Browser ──HTTP──→ nginx(:80) ──proxy──→ Angular SPA (static)
                    │
                    └──/api/*──→ Express Backend(:3000) ──mysql2──→ MySQL 8
                                                                      │
                                                                  volume: mysql-data
```

- **Frontend**: Angular 17 SPA served via nginx (production) or `ng serve` (development)
- **Backend**: Express 5 REST API with TypeScript, raw `mysql2/promise` queries
- **Database**: MySQL 8 with `educacion` schema (5 tables: usuarios, profesores, alumnos, materias, inscripciones)
- **Auth**: JWT stored in localStorage, Bearer token on every API call

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 17, TypeScript, modular CSS (no UI framework) |
| Backend | Express 5, TypeScript, mysql2, JWT (jsonwebtoken) |
| Database | MySQL 8 |
| Auth | bcrypt + JWT (localStorage) |
| Container | Docker + Docker Compose |
| Runtime | Node.js 18+ |

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (local development)
- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/install/) (containerized setup)
- [MySQL](https://dev.mysql.com/downloads/) 8 (optional — only needed for dev without Docker)
- npm (ships with Node.js)

## Quick Start — Docker (recommended)

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd Angular-MaterialUi-Node-Express-Prisma-Docker

# 2. Create .env from template
cp .env.example .env
# Edit .env to set JWT_SECRET (any random string)

# 3. Build and start all services
docker-compose up --build

# 4. Open in browser
open http://localhost
```

The first startup:
1. MySQL initializes with `001_init.sql` (schema + FK fix)
2. Seed data loads via `002_seed.sql` (3 users, 2 subjects, 1 enrollment)
3. Backend connects to MySQL and serves API on `:3000`
4. Frontend SPA is served by nginx on `:80`
5. nginx proxies `/api/*` requests to the backend

**Note**: MySQL initialization runs only on first volume creation. To re-seed, run:
```bash
docker-compose down -v    # deletes volume (destroys all data)
docker-compose up --build  # rebuilds fresh
```

## Quick Start — Development (without Docker)

### 1. Database setup
```bash
# Start MySQL (adjust for your system)
mysql -u root -p < backend/sql/001_init.sql
mysql -u root -p < backend/sql/002_seed.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env   # or symlink from root: cp ../.env.example .env
npm install
npm run dev            # starts with nodemon on :3000
```

### 3. Frontend
```bash
cd frontend
npm install
npm start              # ng serve on :4200, proxies /api to :3000
```

Then open [http://localhost:4200](http://localhost:4200).

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@test.com` | `123456` |
| Professor | `profesor@test.com` | `123456` |
| Student | `alumno@test.com` | `123456` |

## User Roles & Capabilities

### Admin
- Full user management: create and delete users (admin, professor, student)
- Subject CRUD: create, edit, delete subjects, assign professors
- Access to all system data

### Professor
- View assigned subjects
- See enrolled students per subject
- Enter and update grades (nota) for each student

### Student
- Browse available subjects (excluding already enrolled)
- Enroll in subjects
- View enrolled subjects and grades

## API Reference

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/usuarios/login` | Public | Login — returns JWT + rol |

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/usuarios` | Public | List all users |
| POST | `/api/usuarios` | Public | Create a new user |
| PUT | `/api/usuarios/:id` | Public | Update user |
| DELETE | `/api/usuarios/:id` | Public | Delete user (CASCADE) |

### Subjects (Materias)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/materias` | Public | List subjects |
| GET | `/api/materias/:id` | Public | Get subject by ID |
| POST | `/api/materias` | Token + Prof/Admin | Create subject |
| PUT | `/api/materias/:id` | Token + Prof/Admin | Update subject |
| DELETE | `/api/materias/:id` | Token + Prof/Admin | Delete subject |

### Professors

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/profesores` | Public | List all professors (with user info) |

### Students

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/alumnos` | Public | List all students (with user info) |

### Enrollments (Inscripciones)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/inscripciones` | Token | Enroll student in subject |
| GET | `/api/inscripciones/alumno/:id` | Token | Get student's enrollments (ownership check) |
| GET | `/api/inscripciones/materia/:id` | Token + Prof/Admin | Get enrolled students for a subject |
| DELETE | `/api/inscripciones/:id` | Token | Unenroll (ownership check) |
| PUT | `/api/inscripciones/:id/nota` | Token + Prof/Admin | Set/update grade |

### Example: Login

```bash
curl -X POST http://localhost:3000/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "123456"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "rol": "admin",
  "usuario": { "id": 1, "nombre": "Admin", "email": "admin@test.com", "rol": "admin" }
}
```

### Example: Authenticated Request

```bash
curl -X GET http://localhost:3000/api/materias \
  -H "Authorization: Bearer <token>"
```

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # DB pool, env config
│   │   ├── controladores/   # Route handlers (express req/res)
│   │   ├── middlewares/     # verifyToken, esProfesorOAdmin
│   │   ├── modelos/         # Raw SQL queries via mysql2
│   │   ├── rutas/           # Express Router definitions
│   │   └── index.ts         # App entry point
│   ├── sql/                 # Database init + seed scripts
│   ├── Dockerfile           # Multi-stage Node build
│   └── .dockerignore
│
├── frontend/
│   ├── src/app/
│   │   ├── admin/           # Admin dashboard (lazy module)
│   │   │   ├── lista-usuarios/   # User list component
│   │   │   └── lista-materias/   # Subject list component
│   │   ├── autenticacion/   # Login, ServicioAutenticacion, guardia, interceptor
│   │   ├── docentes/        # Professor dashboard (lazy module)
│   │   │   ├── materias-asignadas/  # Assigned subjects
│   │   │   └── carga-notas/        # Grade entry
│   │   ├── estudiantes/     # Student dashboard (lazy module)
│   │   │   ├── materias-disponibles/  # Available subjects
│   │   │   └── mis-inscripciones/     # My enrollments
│   │   ├── servicios/       # Shared API services
│   │   ├── app.module.ts    # Root module
│   │   └── app-routing.module.ts  # Lazy routes
│   ├── Dockerfile           # Multi-stage Angular build + nginx
│   ├── nginx.conf           # nginx config (API proxy + SPA fallback)
│   └── .dockerignore
│
├── docker-compose.yml       # MySQL + Backend + Frontend
├── .env.example             # Environment variable template
└── README.md
```

## VPS Deployment

### Prerequisites (on VPS)

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose plugin
sudo apt-get install docker-compose-plugin

# Add your user to docker group
sudo usermod -aG docker $USER
# Log out and back in
```

### Deploy

```bash
# 1. Clone the repo on VPS
git clone <repo-url>
cd Angular-MaterialUi-Node-Express-Prisma-Docker

# 2. Create .env with production values
cp .env.example .env
# Edit .env:
#   - JWT_SECRET=<long-random-string>
#   - FRONTEND_URL=http://your-vps-ip

# 3. Start the stack
docker compose up --build -d

# 4. Verify
curl http://localhost:80
# Should return the Angular index.html

curl -X POST http://localhost:3000/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456"}'
# Should return a JWT token
```

### Managing the Stack

```bash
# View logs
docker compose logs -f

# Stop
docker compose down

# Stop + remove volumes (destroys database)
docker compose down -v

# Rebuild after code changes
docker compose up --build -d

# Restart a single service
docker compose restart backend
```

### Production Considerations

- **JWT_SECRET**: Use a strong random value (60+ characters). Never commit to git.
- **MySQL root password**: Change `DB_PASS` in `.env` and ensure `001_init.sql` doesn't use default `root/root`.
- **SSL**: For production, add a reverse proxy (Traefik, Caddy, or nginx) with Let's Encrypt.
- **Backup**: Regularly back up the `mysql-data` Docker volume or use `mysqldump`.
- **Firewall**: Open only ports 80 (HTTP) and 22 (SSH). Do NOT expose port 3000 or 3306.

## Verification Checklist

Run these commands to verify the setup:

### Docker Build
```bash
# Backend image
docker build -t thesis-backend ./backend

# Frontend image
docker build -t thesis-frontend ./frontend
```

### TypeScript Compilation
```bash
cd backend && npx tsc --noEmit

cd frontend && npx ng build --configuration production
```

### Full Stack
```bash
docker-compose up --build
# Visit http://localhost — login page should load
```

### API Smoke Test
```bash
# Login as admin
curl -s -X POST http://localhost:3000/api/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"123456"}' | jq .

# List subjects (public)
curl -s http://localhost:3000/api/materias | jq .
```

### All Three Logins
1. Open http://localhost in browser
2. Log in as `admin@test.com` / `123456` → admin dashboard
3. Log out, log in as `profesor@test.com` / `123456` → professor dashboard
4. Log out, log in as `alumno@test.com` / `123456` → student dashboard

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Backend server port |
| `JWT_SECRET` | (required) | Secret key for JWT signing |
| `DB_HOST` | `localhost` | MySQL host |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `root` | MySQL user |
| `DB_PASS` | `root` | MySQL password |
| `DB_NAME` | `educacion` | MySQL database |
| `FRONTEND_URL` | `http://localhost:4200` | Allowed CORS origin |

Copy `.env.example` to `.env` and fill in your values. The `.env` file is gitignored.

## License

MIT — thesis project.

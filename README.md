# catalog-service

Materias y perfiles de tutores; calificación promedio y búsqueda.

Parte de **EduConecta** (plataforma de tutorías, arquitectura de microservicios). Stack: NestJS · TypeORM · PostgreSQL · RabbitMQ.

## Requisitos
- Node.js 20+
- PostgreSQL 14+ (local o Neon)
- RabbitMQ (CloudAMQP o local)

## Puesta en marcha
```bash
cd catalog-service
cp .env.example .env   # completar valores
npm install
npm run start:dev      # desarrollo
npm run build && npm start   # producción
```
El servicio escucha en `PORT` (por defecto 5434). Salud: `GET /health` y `GET /ready`; métricas: `GET /metrics`.

## Variables de entorno
Ver `.env.example`. Todos los servicios que validan JWT deben usar el **mismo** `JWT_SECRET` (y el gateway también).

## Endpoints
| Método | Ruta |
|---|---|
| POST | `/api/v1/tutors/:tutorId/ratings` |
| GET | `/api/v1/tutors/:tutorId/ratings` |
| GET | `/api/v1/subjects` |
| POST | `/api/v1/subjects` |
| DELETE | `/api/v1/subjects/:id` |
| GET | `/api/v1/tutors` |
| GET | `/api/v1/tutors/:id/profile` |
| PATCH | `/api/v1/tutors/:id/profile` |
| POST | `/api/v1/tutors/:id/subjects` |
| DELETE | `/api/v1/tutors/:id/subjects/:subjectId` |

## Mensajería (RabbitMQ)
- Colas: `feedback_rating_events_queue`, `user_events_queue`
- Consume: `feedback.rating.updated`, `tutor.verification.updated`, `user.created`, `user.deleted`


## Pruebas
```bash
npm run test:unit
npm run test:integration   # requiere PostgreSQL (TEST_DB_PASSWORD)
```
CI/CD: GitHub Actions (`.github/workflows/ci.yml` y `deploy.yml`, despliegue a Render por Deploy Hook).

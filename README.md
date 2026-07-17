# Common Admin Platform

A standalone, reusable administration platform with four modules:

- Account management
- Role and page-permission management
- Usage and quota management
- API registry

The project was extracted into a fresh repository so it does not carry product
data, deployment configuration, credentials, or Git history from any host
application.

## Architecture

```text
frontend/  React + TypeScript + Vite administration UI
backend/   Django + Django REST Framework API
```

The platform is intentionally product-neutral. Host applications integrate
through the documented REST contracts instead of importing product-specific
models or API clients.

## Security model

- No built-in application users or production credentials. Values in
  `.env.example` are explicit placeholders for local setup.
- Authentication uses Django REST Framework tokens.
- Every administration endpoint requires an authenticated staff user.
- The backend refuses to start with the development secret when
  `ADMIN_PLATFORM_DEBUG=false`.
- API registry URLs are stored and displayed only. The server does not fetch
  arbitrary registered URLs, avoiding an SSRF surface.
- Secrets belong in environment variables or a secrets manager, never in Git.

See [SECURITY.md](SECURITY.md) before deploying publicly.

## Local development

Requirements:

- Node.js 22+
- Python 3.12+
- [uv](https://docs.astral.sh/uv/)

Backend:

```bash
cd backend
uv sync
uv run python manage.py migrate
uv run python manage.py createsuperuser
uv run python manage.py runserver
```

Frontend:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173` and sign in with the superuser you created.

## Environment

Copy `.env.example` values into your local environment and replace placeholder
values. The frontend reads:

```text
VITE_ADMIN_API_BASE_URL
```

The backend reads:

```text
ADMIN_PLATFORM_DEBUG
ADMIN_PLATFORM_SECRET_KEY
ADMIN_PLATFORM_ALLOWED_HOSTS
ADMIN_PLATFORM_CORS_ORIGINS
DATABASE_URL
```

SQLite is the local default. Set `DATABASE_URL` to PostgreSQL in deployed
environments.

## Verification

```bash
cd backend
uv run ruff check .
uv run python manage.py check
uv run python manage.py test

cd ../frontend
npm ci
npm run lint
npm run build
```

## Integration contracts

All API routes live under `/api/`.

```text
POST   /api/auth/login/
GET    /api/auth/me/
POST   /api/auth/logout/

GET    /api/admin/accounts/
POST   /api/admin/accounts/
PATCH  /api/admin/accounts/{id}/

GET    /api/admin/permissions/
POST   /api/admin/permissions/
PATCH  /api/admin/permissions/{id}/

GET    /api/admin/usage/
POST   /api/admin/usage/
PATCH  /api/admin/usage/{id}/

GET    /api/admin/apis/
POST   /api/admin/apis/
PATCH  /api/admin/apis/{id}/
```

Swagger UI is available at `/api/schema/swagger-ui/`.

## License

No open-source license has been granted yet. Public visibility allows the code
to be viewed, but does not grant reuse rights. Add a license only after the
repository owner chooses one.

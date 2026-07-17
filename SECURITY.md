# Security Policy

## Reporting a vulnerability

Please use GitHub private vulnerability reporting for this repository. Do not
open a public issue containing exploit details, credentials, personal data, or
production URLs.

## Deployment checklist

- Set `ADMIN_PLATFORM_DEBUG=false`.
- Generate a unique, high-entropy `ADMIN_PLATFORM_SECRET_KEY`.
- Use PostgreSQL with encrypted connections and encrypted storage.
- Restrict `ADMIN_PLATFORM_ALLOWED_HOSTS` and
  `ADMIN_PLATFORM_CORS_ORIGINS` to the deployed domains.
- Terminate TLS at the load balancer or reverse proxy.
- Store secrets in a managed secrets service.
- Rotate credentials if they ever appear in logs or Git history.
- Add rate limiting and centralized audit logging for internet-facing use.
- Review staff access and registered APIs regularly.

## Repository hygiene

Before publishing changes, scan the full Git history for secrets and inspect
all generated assets. Do not commit:

- `.env` files
- database files or exports
- private keys and certificates
- cloud credentials
- production hostnames or account identifiers
- customer names, emails, screenshots, or source data

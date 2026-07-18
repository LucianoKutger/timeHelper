# API-Übersicht

Basis: `/v1`

- `GET /health`
- `POST /v1/commands/preview`
- `POST /v1/commands/{request_id}/confirm`
- `GET /v1/work-days?year=&month=`
- `PATCH /v1/work-days/{id}`
- `DELETE /v1/work-days/{id}`
- `POST /v1/monthly-reports`
- `GET /v1/monthly-reports/{id}`
- `POST /v1/artifacts/{id}/signed-url`
- `POST /v1/email-drafts`
- `POST /v1/email-drafts/{id}/save-to-mailbox`
- `POST /v1/email-drafts/{id}/send`
- `POST /v1/transcriptions` (Phase 2)

Alle fachlichen Endpunkte erwarten ein Supabase-JWT. Schreibende Requests müssen eine stabile `request_id` verwenden.

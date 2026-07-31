# API-Übersicht

Der aktuelle FastAPI-Stand stellt drei Endpunkte bereit:

| Methode | Pfad | Auth | Zweck |
| --- | --- | --- | --- |
| `GET` | `/health` | nein | einfacher Health Check (`{"status":"ok"}`) |
| `POST` | `/v1/workday/` | Supabase Bearer-JWT | natürliche Nachricht interpretieren, validieren und als Arbeitstag speichern |
| `POST` | `/v1/monthly_close/` | Supabase Bearer-JWT | Monatsdaten laden, Excel aktualisieren, speichern und E-Mail-Entwurf ablegen |

## Arbeitstag anlegen

```json
{
  "message": "Am 30. Juli von 8 bis 12 und von 13 bis 16 Uhr gearbeitet"
}
```

Die API speichert derzeit direkt nach erfolgreicher Interpretation und Validierung. Eine Preview-/Confirm-API ist im aktuellen Code nicht vorhanden.

## Monatsabschluss

```json
{
  "year": 2026,
  "month": 7
}
```

Beide fachlichen Endpunkte verwenden das Supabase-JWT des Nutzers für den nachgelagerten Zugriff. Die interaktive OpenAPI-Dokumentation ist bei lokal laufendem Backend unter `/docs` verfügbar.

# Deployment

## Aktueller Status

Dieses Repository enthält Deployment-Konfigurationen, aber keinen Beleg für ein aktuell erreichbares Backend. `render.yaml` deaktiviert automatische Deployments. Ohne eine dokumentierte Live-URL und einen erfolgreichen Smoke-Test ist der korrekte Status daher: **deploymentfähig konfiguriert, nicht nachweislich deployed**.

## Abhängigkeitsmodell

Für das Backend sind `backend/pyproject.toml` und `backend/uv.lock` maßgeblich. Lokale Entwicklung, CI, Docker und Render verwenden `uv`. Die Dateien `requirements.txt` und `requirements-dev.txt` sind exportierte Kompatibilitätsartefakte und nicht der primäre Installationsweg.

Render stellt `uv` für Python-Services bereit, wenn das Service-Root ein `uv.lock` enthält; hier ist das durch `rootDir: backend` gegeben. Siehe [Render: Setting Your uv Version](https://render.com/docs/uv-version).

| Umgebung | Installation | Start |
| --- | --- | --- |
| Lokal | `uv sync --dev --locked` | `uv run uvicorn app.main:app --reload` |
| CI | `uv sync --dev --frozen` | Tests über `uv run ...` |
| Render | `uv sync --locked --no-dev` | `uv run --no-sync uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Docker | `uv sync --locked --no-dev` im Image | `uvicorn` aus `/opt/venv` |

Die unterstützte Python-Version ist über `pyproject.toml` auf `>=3.12,<3.14` begrenzt; `.python-version` setzt für Entwicklung und Hosting Python 3.13.5.

## Render-Blueprint

`render.yaml` legt Folgendes fest:

- Service-Typ `web`, Runtime `python`, Root-Verzeichnis `backend`
- Installation aus dem gesperrten uv-Lockfile ohne Dev-Abhängigkeiten
- Health Check auf `GET /health`
- manuelle Deployments durch `autoDeployTrigger: off`
- Secrets als nicht synchronisierte Render Environment Variables

Erforderliche Laufzeitwerte:

- `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL`
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
- `WEBDE_USERNAME`, `WEBDE_APP_PASSWORD`
- optional bzw. vorbereitet: `SUPABASE_JWKS_URL`, `ALLOWED_ORIGINS`

Vor einem ersten Deployment:

1. Render-Blueprint mit dem privaten Repository verbinden und Secrets im Dashboard setzen.
2. Supabase-Migrationen kontrolliert auf das Zielprojekt anwenden.
3. Deployment manuell auslösen und Build-/Start-Logs prüfen.
4. `GET /health` gegen die entstandene Render-URL prüfen.
5. Einen authentifizierten Arbeitstag in einer Testumgebung anlegen und den Monatsabschluss mit einer nicht produktiven Excel-Datei testen.
6. Erst nach erfolgreicher Prüfung die mobile `EXPO_PUBLIC_API_URL` auf diese URL setzen.

Dieser Ablauf wurde durch den Repository-Stand nicht als durchgeführt belegt.

## Docker lokal

```bash
cd backend
cp .env.example .env
docker compose up --build
```

Das Compose-Setup bindet das Backend nach `http://localhost:8000` ein und startet Uvicorn im Reload-Modus. Der Dockerfile selbst nutzt Port 8080 als Fallback für Cloud-Umgebungen.

## Android mit Expo/EAS

Die Profile in `mobile/eas.json` sind:

- `development` – Development Client zur internen Verteilung
- `preview` – intern verteilte APK
- `production` – Android App Bundle (AAB)

Beispiel:

```bash
cd mobile
npx eas build --platform android --profile preview
```

Nur die öffentlichen Werte `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL` und `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dürfen in den App-Build gelangen. Private Supabase-, OpenAI- und Mail-Zugangsdaten gehören ausschließlich ins Backend.

Ein EAS-Profil ist ebenfalls kein Nachweis, dass ein Build veröffentlicht oder im Play Store verfügbar ist.

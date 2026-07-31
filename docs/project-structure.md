# Projektstruktur

```text
timeHelper/
├── .github/workflows/ci.yml       # Mobile- und Backend-Prüfungen
├── backend/
│   ├── app/
│   │   ├── adapters/inbound/api   # FastAPI-Endpunkte und Auth-Kontext
│   │   ├── adapters/outbound      # PydanticAI, Supabase, Excel, WEB.DE
│   │   ├── config                 # Backend-Einstellungen
│   │   ├── core/models            # Fachliche Pydantic-Modelle
│   │   ├── core/ports             # Schnittstellen der Use Cases
│   │   └── core/use_cases         # Arbeitstag und Monatsabschluss
│   ├── templates/excel            # Arbeitszeit-Vorlage
│   ├── tests                      # Unit-, Integrations- und manuelle Tests
│   ├── pyproject.toml             # maßgebliche Abhängigkeiten und Tool-Konfig
│   └── uv.lock                    # gesperrte Python-Abhängigkeiten
├── mobile/
│   ├── src/features               # Auth, Commands, Verlauf, Reports, Settings
│   ├── src/api                    # API-Client und Query-Konfiguration
│   ├── assets                     # Expo-/Android-App-Assets
│   ├── package.json               # npm-Skripte und Abhängigkeiten
│   └── eas.json                   # Android-Buildprofile
├── supabase/                      # SQL-Migrationen, Seed und lokale Config
├── docs/                          # Architektur, API, Deployment, Screenshots
├── render.yaml                    # Render-Blueprint; Auto-Deploy deaktiviert
└── Makefile                       # lokale Kurzbefehle
```

Die ältere abstrakte Schichtbezeichnung wurde hier bewusst durch die tatsächlich vorhandenen Verzeichnisse ersetzt.

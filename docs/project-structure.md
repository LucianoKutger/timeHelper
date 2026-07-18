# Projektstruktur

```text
timeHelper/
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── command_agent.py
│   │   │   ├── dependencies.py
│   │   │   └── instructions.py
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── __init__.py
│   │   │   │   │   ├── artifacts.py
│   │   │   │   │   ├── commands.py
│   │   │   │   │   ├── email_drafts.py
│   │   │   │   │   ├── health.py
│   │   │   │   │   ├── monthly_reports.py
│   │   │   │   │   ├── transcriptions.py
│   │   │   │   │   └── work_days.py
│   │   │   │   ├── __init__.py
│   │   │   │   └── router.py
│   │   │   ├── __init__.py
│   │   │   ├── dependencies.py
│   │   │   └── schemas.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   ├── exceptions.py
│   │   │   └── logging.py
│   │   ├── domain/
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── commands.py
│   │   │   │   ├── day_code.py
│   │   │   │   ├── email.py
│   │   │   │   ├── report.py
│   │   │   │   └── work_day.py
│   │   │   └── __init__.py
│   │   ├── infrastructure/
│   │   │   ├── __init__.py
│   │   │   └── supabase_client.py
│   │   ├── repositories/
│   │   │   ├── __init__.py
│   │   │   ├── protocols.py
│   │   │   └── supabase_work_days.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── artifact_service.py
│   │   │   ├── command_service.py
│   │   │   ├── email_service.py
│   │   │   ├── excel_service.py
│   │   │   ├── report_service.py
│   │   │   └── work_day_service.py
│   │   ├── __init__.py
│   │   └── main.py
│   ├── config/
│   │   └── excel_mapping.json
│   ├── tests/
│   │   ├── agents/
│   │   ├── api/
│   │   │   └── test_health.py
│   │   ├── excel/
│   │   ├── integration/
│   │   ├── unit/
│   │   │   └── test_commands.py
│   │   └── conftest.py
│   ├── .dockerignore
│   ├── .env.example
│   ├── .python-version
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── requirements-dev.txt
│   ├── requirements.txt
│   └── uv.lock
├── docs/
│   ├── api.md
│   ├── architecture.md
│   └── deployment.md
├── mobile/
│   ├── assets/
│   │   ├── android-icon-background.png
│   │   ├── android-icon-foreground.png
│   │   ├── android-icon-monochrome.png
│   │   ├── favicon.png
│   │   ├── icon.png
│   │   └── splash-icon.png
│   ├── src/
│   │   ├── api/
│   │   │   ├── httpClient.ts
│   │   │   └── queryClient.ts
│   │   ├── components/
│   │   │   └── Screen.tsx
│   │   ├── config/
│   │   │   └── env.ts
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   └── screens/
│   │   │   │       └── LoginScreen.tsx
│   │   │   ├── commands/
│   │   │   │   └── screens/
│   │   │   │       ├── CommandScreen.test.tsx
│   │   │   │       └── CommandScreen.tsx
│   │   │   ├── reports/
│   │   │   │   └── screens/
│   │   │   │       └── ReportsScreen.tsx
│   │   │   ├── settings/
│   │   │   │   └── screens/
│   │   │   │       └── SettingsScreen.tsx
│   │   │   └── workDays/
│   │   │       └── screens/
│   │   │           └── WorkDaysScreen.tsx
│   │   ├── hooks/
│   │   │   └── useAuthSession.ts
│   │   ├── lib/
│   │   │   └── supabase.ts
│   │   ├── navigation/
│   │   │   └── RootNavigator.tsx
│   │   ├── providers/
│   │   │   └── AppProviders.tsx
│   │   ├── state/
│   │   └── types/
│   │       └── api.ts
│   ├── .env.example
│   ├── .gitignore
│   ├── .nvmrc
│   ├── app.json
│   ├── App.tsx
│   ├── eas.json
│   ├── eslint.config.js
│   ├── index.ts
│   ├── jest.config.js
│   ├── LICENSE
│   ├── package-lock.json
│   ├── package.json
│   └── tsconfig.json
├── scripts/
├── supabase/
│   ├── migrations/
│   │   ├── 202607180001_initial_schema.sql
│   │   ├── 202607180002_storage.sql
│   │   └── 202607180003_updated_at.sql
│   ├── config.toml
│   └── seed.sql
├── .editorconfig
├── .env.example
├── .gitignore
├── Makefile
├── README.md
├── render.yaml
└── STRUCTURE_STATUS.md
```

Die Struktur trennt Mobile App, API/Agent/Domain/Repositories/Infrastructure, Supabase-Migrationen, Dokumentation und CI/CD.

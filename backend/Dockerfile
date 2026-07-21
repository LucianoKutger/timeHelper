FROM ghcr.io/astral-sh/uv:python3.13-trixie-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends locales \
    && echo "de_DE.UTF-8 UTF-8" > /etc/locale.gen \
    && locale-gen \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=de_DE.UTF-8 \
    LC_TIME=de_DE.UTF-8

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/opt/venv

# Erst nur Abhängigkeitsdateien kopieren, damit Docker den Layer cachen kann.
COPY pyproject.toml uv.lock ./

# Produktionsabhängigkeiten installieren.
RUN uv sync --locked --no-install-project --no-dev

# Anwendung kopieren.
COPY . .

# Projekt selbst installieren.
RUN uv sync --locked --no-dev

EXPOSE 8080

# Cloud Run setzt PORT automatisch.
# Lokal wird als Fallback Port 8080 verwendet.
CMD ["sh", "-c", "exec /opt/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
.PHONY: backend-install backend-run backend-test backend-lint mobile-install mobile-start mobile-test mobile-lint check

backend-install:
	cd backend && uv sync --dev

backend-run:
	cd backend && uv run uvicorn app.main:app --reload

backend-test:
	cd backend && uv run pytest

backend-lint:
	cd backend && uv run ruff check . && uv run mypy app

mobile-install:
	cd mobile && npm install

mobile-start:
	cd mobile && npm run start

mobile-test:
	cd mobile && npm test -- --runInBand

mobile-lint:
	cd mobile && npm run lint && npm run typecheck

check: backend-lint backend-test mobile-lint mobile-test

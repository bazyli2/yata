FROM python:3.12 AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

# Use uv for fast, reproducible installs from the lockfile.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

FROM python:3.12-slim
WORKDIR /app

# Install the Doppler CLI so the container can fetch secrets at startup
# via `doppler run -- ...`. The Fly app needs DOPPLER_TOKEN set as a
# secret (pointing at the yata/prd Doppler config).
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl gnupg \
    && curl -sSfL https://packages.doppler.com/public/cli/gpg.DE2A7741A397C129.key \
        | gpg --dearmor -o /usr/share/keyrings/doppler-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/doppler-archive-keyring.gpg] https://packages.doppler.com/public/cli/deb/debian any-version main" \
        > /etc/apt/sources.list.d/doppler-cli.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends doppler \
    && apt-get purge -y --auto-remove gnupg \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.venv .venv/
COPY . .

EXPOSE 8080

# `doppler run` resolves DOPPLER_TOKEN → prd secrets → env vars, then
# execs uvicorn. Binding to 0.0.0.0:8080 matches fly.toml http_service.
CMD ["doppler", "run", "--", "/app/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]

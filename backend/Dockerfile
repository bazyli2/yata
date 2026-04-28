FROM python:3.12 AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
WORKDIR /app

RUN python -m venv .venv
COPY pyproject.toml ./
RUN .venv/bin/pip install .

FROM python:3.12-slim
WORKDIR /app

# Install the Doppler CLI from Doppler's apt repo so the container can
# `doppler run -- ...` at startup and pull DB_* / CORS_ORIGINS / etc.
# from the `prd` config.
#
# NOTE: production secrets now arrive as plain Fly env vars via the
# `doppler_secrets_sync_flyio.prd` push (see terraform/doppler.tf), so
# `doppler run` is no longer required at startup in prod. It's still
# useful for local/dev runs that pass DOPPLER_TOKEN explicitly. A
# follow-up should switch the prod CMD to invoke fastapi directly.
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
# execs fastapi. Binding to 0.0.0.0:8080 matches fly_machine.services.
CMD ["doppler", "run", "--", "/app/.venv/bin/fastapi", "run", "--host", "0.0.0.0", "--port", "8080"]

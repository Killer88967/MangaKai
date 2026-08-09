#!/usr/bin/env bash
#
# Start (or stop) the local Postgres that backs the API.
#
# Codespaces stops containers when it suspends, so the database is usually down
# after a break and the API's first query fails with ECONNREFUSED. This is
# idempotent: run it as often as you like, including when Postgres is already
# up.
set -euo pipefail

CONTAINER="mangakai-postgres"
IMAGE="postgres:17-alpine"
VOLUME="mangakai-pgdata"
PORT="5432"
CREDENTIAL="mangakai" # user, password and database name are all the same here

# `docker start` returns as soon as the process is spawned, but Postgres needs a
# moment more before it accepts connections — and a fresh container has to
# initialise the data directory first. Without this wait the API would race it
# and fail on its first query.
wait_until_ready() {
  for _ in $(seq 30); do
    if docker exec "$CONTAINER" pg_isready -U "$CREDENTIAL" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  echo "Postgres did not become ready in 30s. Try: docker logs $CONTAINER" >&2
  return 1
}

# Docker's own state, rather than ours: `running` for a live container, some
# other value if it exists but is stopped, and empty if it was never created.
container_state() {
  docker inspect --format '{{.State.Status}}' "$CONTAINER" 2>/dev/null || true
}

up() {
  case "$(container_state)" in
    running)
      wait_until_ready
      echo "Postgres is already running on port $PORT."
      ;;
    "")
      echo "Creating $CONTAINER…"
      docker run --detach \
        --name "$CONTAINER" \
        --restart unless-stopped \
        --publish "$PORT:5432" \
        --volume "$VOLUME:/var/lib/postgresql/data" \
        --env "POSTGRES_USER=$CREDENTIAL" \
        --env "POSTGRES_PASSWORD=$CREDENTIAL" \
        --env "POSTGRES_DB=$CREDENTIAL" \
        "$IMAGE" >/dev/null
      wait_until_ready
      echo "Postgres is up on port $PORT. Run 'pnpm db:migrate' to create the tables."
      ;;
    *)
      docker start "$CONTAINER" >/dev/null
      wait_until_ready
      echo "Postgres is up on port $PORT."
      ;;
  esac
}

down() {
  if [ "$(container_state)" = "running" ]; then
    docker stop "$CONTAINER" >/dev/null
    echo "Postgres stopped. Your data is kept."
  else
    echo "Postgres is already stopped."
  fi
}

case "${1:-up}" in
  up) up ;;
  down) down ;;
  *)
    echo "Usage: $0 [up|down]" >&2
    exit 1
    ;;
esac

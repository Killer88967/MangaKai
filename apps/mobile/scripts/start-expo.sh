#!/usr/bin/env bash
#
# Starts Metro so a phone running Expo Go can actually reach it.
#
# Outside a Codespace this is just `expo start`: the phone and the dev server
# share a LAN, so Expo's default IP address works.
#
# Inside a Codespace the dev server lives in a remote container that the phone
# has no route to, and `expo start --tunnel` does not help either — it hardcodes
# Expo's own ngrok account, which is saturated (ERR_NGROK_108).
#
# So we point Expo at a public URL ourselves. EXPO_PACKAGER_PROXY_URL rewrites
# every URL Expo advertises — manifest, JS bundle, assets and the HMR websocket
# — to that host instead of a LAN IP. Three ways to get one, in priority order:
#
#   1. EXPO_PACKAGER_PROXY_URL already exported — we leave it alone.
#   2. A local ngrok agent forwarding this port. Uses your own ngrok account and
#      keeps the Codespaces port private.
#   3. Codespaces port forwarding. Needs the port to be public.
set -euo pipefail

PORT=8081
API_PORT=8787

# The phone is not on this machine, so `localhost` is meaningless to it. Expo
# inlines EXPO_PUBLIC_* into the bundle, so this is what the app calls.
# Override by exporting it yourself or via apps/mobile/.env.
if [[ -z "${EXPO_PUBLIC_API_URL:-}" && -n "${CODESPACE_NAME:-}" ]]; then
  export EXPO_PUBLIC_API_URL="https://${CODESPACE_NAME}-${API_PORT}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
fi
echo "API base URL: ${EXPO_PUBLIC_API_URL:-http://localhost:${API_PORT}}"

# Make a forwarded port reachable by the phone.
#
# Neither Expo Go nor the app sends GitHub credentials, so a private forward
# answers them with a sign-in page — HTML, which surfaces in the app as
# "JSON Parse error: Unexpected character: <".
#
# This is not a one-time setting. `gh` can only change a port that is currently
# forwarded, and Codespaces forwards a port fresh (private) whenever something
# starts listening on it — so the API reverts to private every time it restarts.
# Hence the retry loop, in the background: the port may not exist yet.
publish_port() {
  local port="$1" label="$2"

  (
    for _ in $(seq 1 20); do
      if gh codespace ports visibility "${port}:public" \
        --codespace "$CODESPACE_NAME" >/dev/null 2>&1; then
        exit 0
      fi
      sleep 2
    done
    echo "Could not make port ${port} (${label}) public. Set it to Public in the Ports panel."
  ) &
}

# The API always goes over Codespaces forwarding, even when Metro is on ngrok —
# a free ngrok account gets one domain and Metro is already using it.
if [[ -n "${CODESPACE_NAME:-}" ]]; then
  publish_port "$API_PORT" "API"
fi

# ngrok publishes its live tunnels on a local API. Ask it rather than making
# anyone paste a URL that changes every restart.
discover_ngrok_url() {
  local json
  json=$(curl -s --max-time 2 "http://127.0.0.1:4040/api/tunnels" 2>/dev/null) || return 1
  [[ -n "$json" ]] || return 1
  node -e '
    let raw = "";
    process.stdin.on("data", (c) => (raw += c)).on("end", () => {
      const port = process.argv[1];
      try {
        const match = (JSON.parse(raw).tunnels || []).find(
          (t) => t.proto === "https" && String(t.config?.addr || "").endsWith(":" + port)
        );
        if (match) console.log(match.public_url);
      } catch {}
    });
  ' "$PORT" <<<"$json"
}

NGROK_URL=""
if [[ -z "${EXPO_PACKAGER_PROXY_URL:-}" ]]; then
  NGROK_URL=$(discover_ngrok_url || true)
fi

if [[ -n "${EXPO_PACKAGER_PROXY_URL:-}" ]]; then
  echo "Using EXPO_PACKAGER_PROXY_URL=${EXPO_PACKAGER_PROXY_URL}"
  echo

elif [[ -n "$NGROK_URL" ]]; then
  export EXPO_PACKAGER_PROXY_URL="$NGROK_URL"
  echo "ngrok tunnel detected on port ${PORT}."
  echo "Open this in Expo Go (Enter URL manually):"
  echo "  exp://${NGROK_URL#https://}:443"
  echo

elif [[ -n "${CODESPACE_NAME:-}" ]]; then
  DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"
  HOST="${CODESPACE_NAME}-${PORT}.${DOMAIN}"
  export EXPO_PACKAGER_PROXY_URL="https://${HOST}"

  publish_port "$PORT" "Metro"

  echo "Codespaces detected (no ngrok tunnel running)."
  echo "Open this in Expo Go (Enter URL manually):"
  echo "  exp://${HOST}:443"
  echo
fi

exec expo start "$@"

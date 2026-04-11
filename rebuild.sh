#!/bin/bash
# Rebuild und Neustart des Docker-Containers nach Code-Änderungen.
# Verwende dies statt "docker compose restart", das nur den Container
# neustartet ohne das Image neu zu bauen.
set -e
echo "→ Baue Image neu und starte Container..."
docker compose up --build -d
echo "✓ Fertig. Container läuft auf Port 8921."

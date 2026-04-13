# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Run locally: `node index.js` (requires `.env`)
- Install deps: `npm install`
- Run in Docker: `docker-compose up -d --build` (reads `.env`)
- No tests or linter are configured.

## Required environment variables

Defined in [src/config/index.js](src/config/index.js):
- `TELEGRAM_BOT_TOKEN`
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`
- `STORAGE_BUCKET` (default `hr-bot`), `STORAGE_BASE_URL`, `STORAGE_USE_PRESIGNED_URLS`, `STORAGE_PRESIGNED_URL_EXPIRY` (seconds, default 7 days)

## Architecture

Single-process Node.js (CommonJS) Telegram bot that stores videos in MinIO and returns a QR code linking to them. Entry point [index.js](index.js) calls `initStorage()` then `initBot()` — storage must succeed before the bot starts polling.

Flow for an incoming Telegram video ([src/bot/index.js](src/bot/index.js)):
1. `bot.getFile(fileId)` → build Telegram CDN URL using the bot token.
2. `axios` streams the file and pipes it directly into `minioClient.putObject` via [storage.service.js](src/services/storage.service.js) `uploadFile` — the Telegram-reported `file_size` is passed through, so it must be accurate (streaming upload, not buffered).
3. `getPresignedUrl` returns a time-limited GET URL with `response-content-type: video/mp4` and `inline` disposition so the link previews/plays in a browser.
4. [qr.service.js](src/services/qr.service.js) renders that URL to a PNG buffer, which is sent back with `sendPhoto`.

Bot uses **polling** (not webhooks) — `docker-compose.yml` intentionally exposes no ports. Switching to webhooks would require changes in both places.

User-facing bot messages are in Uzbek; preserve that language when editing bot replies.

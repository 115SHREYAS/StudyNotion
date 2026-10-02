# Project guidance

## Scope

This repository is an in-progress Node.js backend scaffold for StudyNotion. The application code lives under `server/`. It currently contains Mongoose models, controller modules, middleware, integration helpers, and email templates. `server/index.js` is empty and there are no route files, so do not assume controller functions are exposed through a running HTTP API.

## Project structure

- `server/controllers/` — controller functions for authentication, courses, sections, categories, profiles, payments, and reviews
- `server/models/` — Mongoose schemas and course progress model
- `server/middleware/` — authentication and role checks
- `server/config/` — database and Razorpay configuration
- `server/mail/templates/` and `server/utils/` — email templates and integration helpers

## Development

- Use Node.js and npm; run package commands from `server/`.
- Install dependencies with `npm install` in `server/`.
- `npm start` runs `node index.js`; `npm run dev` runs it with nodemon. These currently invoke the empty entry point and do not start an API.
- `server/package.json` does not define test, lint, or build scripts. Do not claim these checks exist or pass unless they have been added and run.
- Keep changes focused on the requested behavior. Follow the existing CommonJS and JavaScript style unless a task calls for a broader migration.

## Configuration and secrets

Local configuration belongs in `server/.env`. Source references `MONGODB_URL`, `JWT_SECRET`, `FOLDER_NAME`, Cloudinary credentials, SMTP credentials, and Razorpay credentials. Never commit real credentials or other secrets. Integrations are not fully initialized by the current entry point; account for that when adding application startup or integration behavior.

## Implementation considerations

- Controllers are not wired to routes today. When adding API behavior, include the route registration and application startup needed to make it reachable.
- Preserve consistency between models, controller input/output, and integration helpers when changing data behavior.
- Add validation and error handling when introducing new externally reachable operations.
- Update `README.md` when project setup, configuration, scripts, or runnable behavior changes.

# StudyNotion API (starter)

This repository contains the beginnings of a Node.js/Express backend for an online learning platform. Its data models and controller modules cover accounts, profiles, courses, sections and lessons, categories, course progress, ratings and reviews, password recovery, and Razorpay payments. MongoDB, Cloudinary, and SMTP integrations are referenced in the source.

## Project status

The backend is not yet wired into a runnable API: [`server/index.js`](server/index.js) is empty, and the repository does not currently include Express route files. The controller functions are not reachable over HTTP until an application entry point and routes are added. Treat this as an in-progress backend scaffold rather than a deployable service.

## Requirements

- Node.js and npm
- MongoDB
- Credentials for any integrations you configure (Cloudinary, SMTP, and Razorpay)

## Install

```sh
cd server
npm install
```

The available scripts are:

```sh
npm start    # node index.js
npm run dev  # nodemon index.js
```

These scripts currently run the empty `index.js`; they do not start an HTTP server yet.

## Configuration

Create `server/.env` for local configuration. The source references these variables:

| Variable | Used for |
| --- | --- |
| `MONGODB_URL` | MongoDB connection string |
| `JWT_SECRET` | Signing and verifying authentication tokens |
| `FOLDER_NAME` | Cloudinary upload folder |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary credentials (configure the Cloudinary SDK before uploads) |
| `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS` | SMTP mail delivery |
| `RAZORPAY_KEY`, `RAZORPAY_SECRET` | Razorpay client credentials |

Do not commit real credentials. The current entry point does not load application configuration or connect to MongoDB; initialize these integrations when wiring the server.

## Source layout

- `server/controllers/` — account, course, category, payment, profile, and review controller functions
- `server/models/` — Mongoose schemas
- `server/middleware/` — JWT authentication and account-role checks
- `server/config/` — database and Razorpay setup
- `server/mail/templates/` and `server/utils/` — email templates, mail helper, and image upload helper

## Development notes

There are no test, lint, or build scripts defined in `server/package.json`. Before using this project as a service, add and configure the Express app, route registration, middleware, startup/database connection, and validation/error handling.

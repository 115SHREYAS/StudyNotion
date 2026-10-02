# Course Platform API (backend scaffold)

This repository contains the beginnings of a Node.js backend for a course platform. It includes Mongoose models, Express-style controller functions, authentication middleware, and helpers for email, media uploads, and Razorpay payments.

## Project status

The backend is an incomplete scaffold. `server/index.js` is empty, and the repository does not yet include Express route definitions or an application bootstrap. The controllers are not exposed as HTTP endpoints, so starting the package does not currently start an API server. Some controller dependencies referenced by the code are also not present in the repository. Complete the application setup and routes before using this as a service.

## Included areas

- **Accounts:** OTP-based signup, login, password changes and reset flows, profile management, and role-based auth middleware for students, instructors, and admins.
- **Courses:** course, section, and subsection controller logic and Mongoose models.
- **Catalog:** category and course listing/detail controller logic.
- **Reviews:** rating creation and rating summary controller logic.
- **Payments:** Razorpay payment capture and signature verification controller logic.
- **Integrations:** Nodemailer email helper/templates and a Cloudinary upload helper.

These are implementation areas in the current code, not a documented or stable public API. Request formats, routes, and authorization requirements will depend on the routes added to the project.

## Requirements

- Node.js and npm
- MongoDB
- Credentials for the services used by the features you enable: SMTP, Cloudinary, and Razorpay

## Install

From the repository root:

```sh
cd server
npm install
```

The package defines `npm start` and `npm run dev` scripts, both targeting `server/index.js`. Since that file is currently empty, these commands do not provide a working API server yet.

## Configuration

The code reads the following environment variables. Place them in `server/.env` when dotenv loading is added to the application bootstrap (the current empty `index.js` does not load it):

| Variable | Used for |
| --- | --- |
| `MONGODB_URL` | MongoDB connection string |
| `JWT_SECRET` | Signing and verifying authentication tokens |
| `MAIL_HOST` | SMTP host |
| `MAIL_USER` | SMTP username |
| `MAIL_PASS` | SMTP password |
| `FOLDER_NAME` | Cloudinary upload folder passed by course/media controllers |
| `RAZORPAY_KEY` | Razorpay key ID |
| `RAZORPAY_SECRET` | Razorpay key secret |

Cloudinary credentials and configuration also need to be supplied when wiring the upload helper; the current code does not configure them. Do not commit real credentials.

## Development

```sh
npm run dev
```

This invokes Nodemon on `index.js`, but an Express app, middleware setup, database connection, and route mounting still need to be implemented before it can serve requests.

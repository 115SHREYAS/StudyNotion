# Learning Platform API

Node.js backend for a course learning platform. It contains MongoDB models and controllers for accounts, courses, sections, progress, ratings, and payments, plus email and media upload helpers.

## Setup

Requires Node.js and MongoDB. From `server/`:

```sh
npm install
touch .env  # add the settings below
npm run dev
```

Configure these values in `server/.env` as needed:

| Variable | Used for |
| --- | --- |
| `MONGODB_URL` | MongoDB connection |
| `JWT_SECRET` | Authentication tokens |
| `RAZORPAY_KEY`, `RAZORPAY_SECRET` | Payments |
| `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS` | Email delivery |
| `FOLDER_NAME` | Cloudinary upload folder |

`npm start` runs `node index.js`; `npm run dev` runs it with nodemon. The current `server/index.js` is empty, so HTTP server startup and route mounting still need to be implemented.

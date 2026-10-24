# Project enhancement opportunities

This review covers the checked-in Node.js backend under `server/`. The repository does not contain a frontend, so the items below focus on backend behavior and API foundations. Priorities indicate suggested implementation order: **P0** blocks reliable use, **P1** improves core workflows, and **P2** extends the product.

## P0 — Make the service runnable and its core flows reliable

### 1. Add the Express application bootstrap and API routes

**Evidence:** [`server/index.js`](server/index.js) is empty, while the package start script runs it directly. No route modules are present. Controllers and database configuration therefore have no wired API surface in this checkout.

**Enhancement:** Build the application entry point: load configuration, connect to MongoDB, configure JSON/form and cookie parsing, mount routes for auth, courses, categories, profile, reviews, and payments, and start listening only after a successful database connection. Add a health endpoint and a centralized not-found/error response.

**Outcome:** The existing controllers become accessible through a documented, consistent API and deployments can verify service health.

### 2. Repair payment order creation and secure payment verification

**Evidence:** [`server/controllers/Payments.js`](server/controllers/Payments.js) declares `course` but loads into `courseDetails`, then reads `course.price`; it checks `studentEnrolled`, while the course schema uses `studentsEnrolled`. Signature verification references `crypto` without importing it and uses a hard-coded secret. Payment fulfillment trusts request payload notes and appends enrollment without checking order/payment status or preventing duplicate fulfillment.

**Enhancement:** Correct schema references and return paths; use configured Razorpay credentials and the provider’s supported signature verification inputs; validate the captured payment/order status and amount against the expected course price; make fulfillment idempotent; update enrollment records atomically; and add clear error responses and audit logging.

**Outcome:** Checkout can create orders consistently and enrollment only follows a verified, paid transaction.

### 3. Correct authentication and signup verification

**Evidence:** [`server/middleware/auth.js`](server/middleware/auth.js) reads `Authorisation` (misspelled), calls `.replace()` on a possibly missing header, and never calls `next()` after successful JWT verification. [`server/controllers/Auth.js`](server/controllers/Auth.js) compares `otp` with the entire `recentOtp` query result, returns the OTP in the send-OTP response, and signup does not consume the OTP. The role value is not validated before account creation.

**Enhancement:** Parse the standard `Authorization: Bearer ...` header safely, call `next()` only after valid authentication, remove token logging, compare signup with the newest OTP document’s `otp`, consume it after success, avoid returning OTP values, normalize/validate email, and allow only supported account roles. Align cookie expiration with JWT expiration and set secure cookie options for production.

**Outcome:** Authenticated routes proceed correctly and signup verification provides a meaningful barrier against abuse.

### 4. Fix model/controller mismatches that break core API operations

**Evidence:** [`server/models/Course.js`](server/models/Course.js) ends with `modules.exports` rather than `module.exports`. The course model uses `studentsEnrolled`, `ratingsAndReviews`, and `courseContent`, while controllers contain singular/plural and capitalization variants (for example in payments and category population). The rating model lacks a `course` field although review controllers query and create by course. Several controllers import `CourseProgress` or `convertSecondsToDuration` from absent/mismatched module paths.

**Enhancement:** Establish canonical model names and field names, correct exports/imports and populate paths, add the missing review-to-course relation and appropriate indexes, and confirm all referenced modules exist. Add schema validation for required course fields, nonnegative price, rating bounds, and unique user/course reviews.

**Outcome:** Model loading, course listing, rating aggregation, progress tracking, and enrollment queries use a consistent data contract.

## P1 — Complete and protect the learning and account workflows

### 5. Enforce ownership and role authorization on course editing

**Evidence:** Course and section/subsection controller operations accept IDs from the request and perform updates/deletes without checking that the authenticated instructor owns the course. The course edit and delete handlers are present only as commented-out code in [`server/controllers/Course.js`](server/controllers/Course.js).

**Enhancement:** Implement course edit/delete and validate ownership for every course, section, and subsection mutation. Enforce instructor/admin role requirements at route level and verify each nested resource belongs to the stated parent course. Keep published course access separate from instructor management access.

**Outcome:** Instructors can manage their own content without being able to change another instructor’s courses.

### 6. Finish profile, password reset, and account lifecycle behavior

**Evidence:** [`server/controllers/Profile.js`](server/controllers/Profile.js) returns no user data from `getAllUserDetails`, and account deletion removes only the user/profile while leaving related records and cloud assets. [`server/controllers/ResetPassword.js`](server/controllers/ResetPassword.js) uses `crypto` without importing it, embeds localhost in reset links, and does not clear the reset token after changing the password. [`server/controllers/Auth.js`](server/controllers/Auth.js) does not check that the user exists before reading the password during password change.

**Enhancement:** Return a safe populated profile payload; validate profile inputs; define cleanup or retention behavior for related data; configure the public reset URL; import secure token generation, invalidate reset tokens after use, and handle missing users and missing/expired tokens with suitable status codes. Revoke existing sessions after password changes.

**Outcome:** Account settings and recovery work outside local development and avoid stale credentials and orphaned data.

### 7. Implement learning progress and lesson duration consistently

**Evidence:** A `courseProgress` model exists, but course controller imports a differently cased `CourseProgress` file and an absent duration utility. Subsection creation stores a supplied duration string, while video upload metadata could provide a canonical duration; student enrollment and completion are not joined into a clear progress workflow.

**Enhancement:** Define progress APIs for enrolled students, record completed lessons idempotently, calculate course completion, and return progress with course details. Standardize duration storage (for example, seconds as a number) and format it at the API boundary.

**Outcome:** Students can resume courses and see accurate completion status.

### 8. Add validation, pagination, and safe public data projections

**Evidence:** Most controllers accept raw request values; course and review listing endpoints return unpaginated collections. `getAllCourses` populates full instructor documents, and auth responses can expose user fields unless carefully removed.

**Enhancement:** Add request validation for IDs, field types, lengths, and allowed values; paginate and sort course/review/category listings; select explicit public fields in populated documents; and centralize response shapes and status codes.

**Outcome:** APIs behave predictably as data grows and expose only the information each endpoint needs.

## P2 — Improve operability and learner experience

### 9. Add automated tests and API documentation

**Evidence:** [`server/package.json`](server/package.json) defines only start/dev scripts and no test or lint tooling. There are no route or API documentation files in this checkout.

**Enhancement:** Add unit tests for auth, signup OTP, ownership checks, course CRUD, payment signature/idempotency, and progress; add integration tests using an isolated database; and publish an OpenAPI specification with request/response examples and role requirements.

**Outcome:** Regressions in security-sensitive flows are caught early and frontend/API integration has a stable contract.

### 10. Centralize configuration, errors, and operational logging

**Evidence:** Configuration is read directly from `process.env` across modules; logs include OTPs, JWT decode data, and verbose provider responses. Mail errors are swallowed in [`server/utils/mailSender.js`](server/utils/mailSender.js), making delivery failures hard to detect. No graceful shutdown or structured request logging is present.

**Enhancement:** Validate required environment variables at startup, separate development and production settings, use structured logs with secrets and personal data redacted, propagate mail/provider failures to callers or a retry queue, and add graceful shutdown plus readiness checks.

**Outcome:** Configuration mistakes and external-service failures are easier to diagnose without leaking sensitive values.

### 11. Expand the course discovery experience

**Evidence:** [`server/controllers/Course.js`](server/controllers/Course.js) returns a simple published-course list without search/filter/pagination. Category page logic in [`server/controllers/Category.js`](server/controllers/Category.js) assumes related category/course data exists and refers to fields such as `sold` that are not defined by the visible course schema.

**Enhancement:** Add search and filters for category, instructor, price range, rating, and tags; provide stable pagination; and compute featured/popular course selections from tracked enrollment data with a defined fallback for empty categories.

**Outcome:** Learners can find relevant courses and discovery endpoints remain useful when catalog data is sparse.

## Suggested delivery sequence

1. Bootstrap the service and define routes.
2. Fix model/import consistency and authentication/signup.
3. Secure course ownership and payment fulfillment.
4. Complete account and learning progress workflows.
5. Add validation, tests, API docs, and operational improvements.
6. Extend discovery and learner-facing features.

This is a code-based enhancement review, not a claim that every item is currently exposed through a running API; route wiring is absent from the checked-in project.

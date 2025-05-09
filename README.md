# Time Capsule API

A secure, time-locked message storage system built with **Express.js**, **JWT authentication**, and **MongoDB**. Users can create capsules that unlock at a future date, retrieve them with a secret code, and manage them until they're unlocked. Capsules auto-expire after 30 days past their unlock date.


## Project Overview

This RESTful API supports:

- User registration & login (JWT-based)
- Time-locked capsule creation (`POST /capsules`)
- Secure capsule retrieval (`GET /capsules/:id?code=...`)
- Pagination listing (`GET /capsules?page=...`)
- Capsule update & delete (before unlock time)
- Auto-expiration of capsules (after 30 days past unlock)
- Unit tested with Jest + Supertest


## How to Run the App

### 1. Clone the Repo
```bash
git clone https://github.com/your-username/time-capsule-api.git
cd time-capsule-api
```

### 2. Install the dependencies
```bash
npm install
```

### 3. Configure Environment
Create a .env file based on .env.example:
```bash
cp .env.example .env
```
Set your MongoDB URI and JWT secret in .env:
```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/timecapsule
JWT_SECRET=your_jwt_secret
```

### 4. Start the Server
```bash
npm run dev    # for development with nodemon
```
Server runs at:
```
http://localhost:5000
```

## How to run test cases

All the necessery information along with expected outputs are provided in the [TESTING](https://github.com/tgunjal0421/time-capsule-api/blob/main/TESTING.docx) file.

## Assumptions & Tradeoffs

- Unlock code is a random 4-byte hex string generated on capsule creation
- Capsule expiration is handled via a background job (node-cron)
- Capsules cannot be updated or deleted after they’re unlocked
- Messages remain hidden in list view unless capsule is unlocked
- DB is cleared in test mode for isolated testing
- No frontend included — designed to be consumed by a client app

## Folder Structure
```
src/
  ├── config/        # DB config
  ├── controllers/   # Business logic
  ├── models/        # Mongoose schemas
  ├── routes/        # Express routes
  ├── middleware/    # Auth middleware
  ├── utils/         # Background jobs (e.g. expiration)
  └── tests/         # Jest test files
```

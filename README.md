# Secure Note-Taking Application - Backend

A robust RESTful API built with **Node.js**, **Express**, **MongoDB**, and **Mongoose**, featuring role-based access control (RBAC), JWT authentication, secure password hashing (`bcryptjs`), optimized MongoDB indexing strategy (`schema.index`), and advanced single-pipeline aggregations (`$unwind`, `$group`, `$lookup`).

---

## 🚀 Quick Start

### 1. Installation
```bash
cd backend
npm install
```

### 2. Environment Configuration
Create or edit `.env` (defaults are preconfigured in `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/secure_notes
JWT_SECRET=super_secret_jwt_key_secure_notes_2026
JWT_EXPIRES_IN=7d
```
> **Note on Database:** The application automatically connects to your local or Atlas MongoDB. If no MongoDB daemon is running locally, it seamlessly falls back to an in-memory MongoDB server for zero-friction evaluation and testing!

### 3. Seed Database
Seeds demo Admin and Users with interests, notes, and posts:
```bash
npm run seed
```

### 4. Run Automated Test Suite
Executes the comprehensive automated test suite (25 tests covering indexing, auth, RBAC, pagination, and both aggregation scenarios):
```bash
npm test
```

### 5. Start Server
```bash
# Production mode
npm start

# Development mode with watch
npm run dev
```

---

## 🎯 Indexing Strategy & Optimization

In strict accordance with the interview specifications:
- All indexes are declared explicitly using `schema.index(...)` in their respective models.
- **Critical Constraint Adherence**: **No unnecessary indexes**. Only indexes strictly required to support list views, reads, and aggregation pipelines are defined.

### 1. `User` Model (`src/models/User.js`)
| Index | Type | Purpose & Supported Query |
| :--- | :--- | :--- |
| `email: 1` | Unique Single Field | Supports `User.findOne({ email })` for fast $O(1)$ login credentials verification and guarantees email uniqueness. |
| `createdAt: -1` | Single Field (Desc) | Supports Admin listing all users with pagination sorted by newest first: `User.find().sort({ createdAt: -1 })`. |
| `interests: 1` | Multikey Index | Supports **Scenario 1 Aggregation**: Group by Interests ($unwind and grouping by user interests). |
| `_id: 1` | Primary Key | Default MongoDB primary index; supports single-user lookup by ID (`/api/auth/me`, `/api/users/:id`). |

### 2. `Note` Model (`src/models/Note.js`)
| Index | Type | Purpose & Supported Query |
| :--- | :--- | :--- |
| `{ author: 1, createdAt: -1 }` | Compound (ESR) | Supports regular user listing their own notes with pagination ordered by newest first: `Note.find({ author: userId }).sort({ createdAt: -1 })`. Follows Equality-Sort-Range. |
| `{ createdAt: -1 }` | Single Field (Desc) | Supports Admin listing everyone's notes across the system with pagination ordered by newest first: `Note.find().sort({ createdAt: -1 })`. |
| `_id: 1` | Primary Key | Supports single note lookup, update, and deletion by note ID. |

### 3. `Post` Model (`src/models/Post.js`)
| Index | Type | Purpose & Supported Query |
| :--- | :--- | :--- |
| `{ author: 1, createdAt: -1 }` | Compound | Supports **Scenario 2 Aggregation**: Optimizes the foreign field match in `$lookup` (`foreignField: 'author'`) and fetching a user's posts sorted by date. |
| `{ createdAt: -1 }` | Single Field (Desc) | Supports public feed of posts with pagination sorted by newest first: `Post.find().sort({ createdAt: -1 })`. |

---

## 📊 Aggregation Tasks

### Scenario 1: Group by Interests
- **Requirement:** View users grouped by their interests array (e.g., `['chess', 'reading']`).
- **Constraint:** Must use **exactly one** `collection.aggregate()` call.
- **Endpoint:** `GET /api/aggregations/group-by-interests`
- **Pipeline Implementation:**
```javascript
User.aggregate([
  // 1. Unwind interests array to produce an individual document per interest
  { $unwind: '$interests' },

  // 2. Group by interest name and collect user info
  {
    $group: {
      _id: '$interests',
      userCount: { $sum: 1 },
      users: {
        $push: {
          _id: '$_id',
          name: '$name',
          email: '$email',
          role: '$role',
        },
      },
    },
  },

  // 3. Sort by most popular interests first
  { $sort: { userCount: -1, _id: 1 } },

  // 4. Project clean response shape
  {
    $project: {
      _id: 0,
      interest: '$_id',
      userCount: 1,
      users: 1,
    },
  },
]);
```

### Scenario 2: User Posts ($lookup)
- **Requirement:** Retrieve all posts belonging to a particular user from a separate `posts` collection.
- **Constraint:** Use a **single aggregation pipeline** with a `$lookup` stage.
- **Endpoint:** `GET /api/aggregations/user-posts/:userId` (or `GET /api/posts/user/:userId`)
- **Pipeline Implementation:**
```javascript
User.aggregate([
  // 1. Match the specific user
  { $match: { _id: targetUserId } },

  // 2. Single $lookup stage to join posts by author foreign key
  {
    $lookup: {
      from: 'posts',
      localField: '_id',
      foreignField: 'author',
      as: 'posts',
    },
  },

  // 3. Project user details along with retrieved posts and count
  {
    $project: {
      _id: 1,
      name: 1,
      email: 1,
      role: 1,
      interests: 1,
      totalPosts: { $size: '$posts' },
      posts: 1,
    },
  },
]);
```

---

## 🔒 Roles & Permissions (RBAC)

| Resource / Action | User Role | Admin Role |
| :--- | :--- | :--- |
| **Create Note** | ✅ Yes (`POST /api/notes`) | ✅ Yes |
| **List Own Notes** | ✅ Yes (`GET /api/notes`) | ✅ Yes |
| **List Everyone's Notes** | ❌ Forbidden (403) | ✅ Yes (`GET /api/notes`) |
| **Update Own Note** | ✅ Yes (`PUT /api/notes/:id`) | ✅ Yes |
| **Delete Own Note** | ✅ Yes (`DELETE /api/notes/:id`) | ✅ Yes |
| **List All Users** | ❌ Forbidden (403) | ✅ Yes (`GET /api/users`) |
| **Manage Users (Add/Edit/Delete)** | ❌ Forbidden (403) | ✅ Yes (`/api/users`) |
| **Create Public Post** | ✅ Yes (`POST /api/posts`) | ✅ Yes |
| **View Aggregations** | ✅ Yes | ✅ Yes |

---

## 📚 Interactive Swagger API Documentation

Interactive OpenAPI 3.0 documentation with built-in testing ("Try it out") and Bearer JWT authorization:

- **Swagger UI:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs) (or short link: [http://localhost:5000/docs](http://localhost:5000/docs))
- **OpenAPI JSON Spec:** [http://localhost:5000/api/docs.json](http://localhost:5000/api/docs.json)

### How to use Swagger UI:
1. Open [http://localhost:5000/api/docs](http://localhost:5000/api/docs) in your browser.
2. Execute `POST /api/auth/login` with credentials (e.g. `admin@example.com` / `admin123`).
3. Copy the returned `token`.
4. Click the green **Authorize 🔓** button at the top right of the Swagger UI.
5. Paste the token into the value field and click **Authorize**.
6. You can now execute and test all protected endpoints (Notes, Admin Users, Me) directly in your browser!

---

## 📡 API Reference Overview

### Auth
- `POST /api/auth/register` - Register a new account (`name`, `email`, `password`, `interests`, optional `role`)
- `POST /api/auth/login` - Authenticate & receive JWT token (`email`, `password`)
- `GET /api/auth/me` - Get authenticated profile
- `PUT /api/auth/me` - Update current profile (`name`, `interests`)

### Notes (Private)
- `POST /api/notes` - Create new note (`title`, `content`)
- `GET /api/notes?page=1&limit=10` - List notes with pagination (User gets own notes; Admin gets all notes)
- `GET /api/notes/:id` - Read note by ID (User can only access their own note)
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### User Management (Admin Only)
- `GET /api/users?page=1&limit=10` - List users with pagination
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Posts & Feed
- `POST /api/posts` - Create post (`title`, `content`)
- `GET /api/posts?page=1&limit=10` - Public paginated feed of posts
- `GET /api/posts/user/:userId` - Retrieve user's posts via `$lookup` pipeline

### Aggregations
- `GET /api/aggregations/group-by-interests` - Scenario 1: Group by Interests (single aggregate)
- `GET /api/aggregations/user-posts/:userId` - Scenario 2: User Posts ($lookup pipeline)

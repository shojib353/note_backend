const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const User = require('../src/models/User');
const Note = require('../src/models/Note');
const Post = require('../src/models/Post');

let mongod;
let adminToken;
let userToken;
let bobToken;
let adminUser;
let regularUser;
let bobUser;
let userNote;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);

  // Sync schema.index()
  await User.syncIndexes();
  await Note.syncIndexes();
  await Post.syncIndexes();
});

test.after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

test('1. Database Indexing Verification', async (t) => {
  await t.test('User collection should have explicit schema indexes', async () => {
    const indexes = await User.collection.indexes();
    const indexNames = indexes.map((idx) => Object.keys(idx.key).join('_'));

    // Required: email_1, createdAt_-1, interests_1, plus default _id_
    assert.ok(indexes.some((idx) => idx.key.email === 1 && idx.unique === true), 'Unique email index exists');
    assert.ok(indexes.some((idx) => idx.key.createdAt === -1), 'createdAt descending index exists');
    assert.ok(indexes.some((idx) => idx.key.interests === 1), 'interests multikey index exists');
    
    // Ensure no redundant/unnecessary indexes
    // Only 4 indexes: _id_, email_1, createdAt_-1, interests_1
    assert.equal(indexes.length, 4, 'User schema has only the strictly required indexes');
  });

  await t.test('Note collection should have explicit schema indexes', async () => {
    const indexes = await Note.collection.indexes();
    
    assert.ok(indexes.some((idx) => idx.key.author === 1 && idx.key.createdAt === -1), 'Compound author_1_createdAt_-1 index exists');
    assert.ok(indexes.some((idx) => idx.key.createdAt === -1 && Object.keys(idx.key).length === 1), 'createdAt_-1 index exists');
    assert.equal(indexes.length, 3, 'Note schema has only the strictly required indexes (_id, compound author+createdAt, createdAt)');
  });

  await t.test('Post collection should have explicit schema indexes', async () => {
    const indexes = await Post.collection.indexes();
    
    assert.ok(indexes.some((idx) => idx.key.author === 1 && idx.key.createdAt === -1), 'Compound author_1_createdAt_-1 index exists');
    assert.ok(indexes.some((idx) => idx.key.createdAt === -1 && Object.keys(idx.key).length === 1), 'createdAt_-1 index exists');
    assert.equal(indexes.length, 3, 'Post schema has only strictly required indexes (_id, compound author+createdAt, createdAt)');
  });
});

test('2. Authentication and Password Hashing', async (t) => {
  await t.test('POST /api/auth/register should register user with hashed password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice User',
        email: 'alice@example.com',
        password: 'password123',
        interests: ['chess', 'reading'],
      });

    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, 'alice@example.com');
    assert.equal(res.body.user.role, 'user');
    assert.equal(res.body.user.password, undefined); // Password hidden

    // Verify stored password in MongoDB is hashed
    const dbUser = await User.findOne({ email: 'alice@example.com' }).select('+password');
    assert.notEqual(dbUser.password, 'password123');
    assert.ok(dbUser.password.startsWith('$2')); // bcrypt prefix

    userToken = res.body.token;
    regularUser = res.body.user;
  });

  await t.test('Register Admin user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'adminpassword123',
        role: 'admin',
        interests: ['chess', 'cryptography'],
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.user.role, 'admin');
    adminToken = res.body.token;
    adminUser = res.body.user;
  });

  await t.test('Register Bob user with different interests', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'bobpassword123',
        interests: ['reading', 'cooking'],
      });

    assert.equal(res.status, 201);
    bobToken = res.body.token;
    bobUser = res.body.user;
  });

  await t.test('POST /api/auth/login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'password123',
      });

    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, 'alice@example.com');
  });

  await t.test('POST /api/auth/login with invalid password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'wrongpassword',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });
});

test('3. Role-Based Access Control on Notes', async (t) => {
  await t.test('Regular user can create a note', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Alice Private Note',
        content: 'Secret thoughts and research notes.',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.title, 'Alice Private Note');
    userNote = res.body.data;
  });

  await t.test('Bob creates his own note', async () => {
    const res = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        title: 'Bob Recipe',
        content: 'Secret sourdough formula.',
      });

    assert.equal(res.status, 201);
  });

  await t.test('Regular user listing notes only receives their own notes', async () => {
    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.pagination.totalCount, 1);
    assert.equal(res.body.data[0].title, 'Alice Private Note');
  });

  await t.test('Bob CANNOT view Alice private note (403 Forbidden)', async () => {
    const res = await request(app)
      .get(`/api/notes/${userNote._id}`)
      .set('Authorization', `Bearer ${bobToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  await t.test('Admin CAN view everyone notes', async () => {
    const res = await request(app)
      .get('/api/notes')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    // Both Alice's note and Bob's note visible to admin
    assert.equal(res.body.pagination.totalCount, 2);
  });

  await t.test('Admin can view Alice private note directly by ID', async () => {
    const res = await request(app)
      .get(`/api/notes/${userNote._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.title, 'Alice Private Note');
  });
});

test('4. Admin User Management & RBAC', async (t) => {
  await t.test('Regular user CANNOT list all users (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  await t.test('Admin CAN list all users with pagination', async () => {
    const res = await request(app)
      .get('/api/users?page=1&limit=2')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.length, 2);
    assert.equal(res.body.pagination.totalCount, 3);
    assert.equal(res.body.pagination.totalPages, 2);
    assert.equal(res.body.pagination.hasNextPage, true);
  });

  await t.test('Admin can update a user', async () => {
    const res = await request(app)
      .put(`/api/users/${regularUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Alice Johnson (Updated)',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.name, 'Alice Johnson (Updated)');
  });
});

test('5. Aggregations (Scenarios 1 & 2)', async (t) => {
  // Create sample posts for Alice and Bob
  await Post.create([
    {
      title: 'Alice Public Post 1',
      content: 'Hello world from Alice',
      author: regularUser._id,
    },
    {
      title: 'Alice Public Post 2',
      content: 'Second post by Alice',
      author: regularUser._id,
    },
    {
      title: 'Bob Public Post 1',
      content: 'Hello world from Bob',
      author: bobUser._id,
    },
  ]);

  await t.test('Scenario 1: Group by Interests using exactly one collection.aggregate() call', async () => {
    const res = await request(app)
      .get('/api/aggregations/group-by-interests');

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
    
    // Check that interests like 'chess' and 'reading' group users
    const chessGroup = res.body.data.find((item) => item.interest === 'chess');
    assert.ok(chessGroup, 'Chess interest group exists');
    assert.ok(chessGroup.userCount >= 2, 'Chess shared by Alice and Admin');

    const readingGroup = res.body.data.find((item) => item.interest === 'reading');
    assert.ok(readingGroup, 'Reading interest group exists');
    assert.ok(readingGroup.userCount >= 2, 'Reading shared by Alice and Bob');
  });

  await t.test('Scenario 2: User Posts ($lookup) retrieving all posts belonging to a particular user', async () => {
    const res = await request(app)
      .get(`/api/aggregations/user-posts/${regularUser._id}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.totalPosts, 2);
    assert.equal(res.body.data.posts.length, 2);
    assert.ok(res.body.data.posts.some((p) => p.title === 'Alice Public Post 1'));
  });

  await t.test('Scenario 2: User Posts from /api/posts/user/:userId via $lookup', async () => {
    const res = await request(app)
      .get(`/api/posts/user/${bobUser._id}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.count, 1);
    assert.equal(res.body.data[0].title, 'Bob Public Post 1');
    assert.equal(res.body.data[0].author.name, 'Bob Smith');
  });
});

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/server');

test('6. Swagger API Documentation', async (t) => {
  await t.test('GET /api/docs.json should return valid OpenAPI 3.0 specification', async () => {
    const res = await request(app).get('/api/docs.json');
    assert.equal(res.status, 200);
    assert.equal(res.body.openapi, '3.0.3');
    assert.equal(res.body.info.title, 'Secure Note-Taking & Social API');
    assert.ok(res.body.paths, 'OpenAPI paths should be defined');
    assert.ok(res.body.paths['/api/auth/register']);
    assert.ok(res.body.paths['/api/auth/login']);
    assert.ok(res.body.paths['/api/notes']);
    assert.ok(res.body.paths['/api/users']);
    assert.ok(res.body.paths['/api/posts']);
    assert.ok(res.body.paths['/api/aggregations/group-by-interests']);
    assert.ok(res.body.paths['/api/aggregations/user-posts/{userId}']);
    assert.ok(res.body.components.securitySchemes.bearerAuth);
  });

  await t.test('GET /api/docs/ should serve Swagger UI HTML', async () => {
    const res = await request(app).get('/api/docs/');
    assert.equal(res.status, 200);
    assert.match(res.text, /swagger-ui/i);
  });

  await t.test('GET /docs should redirect to /api/docs', async () => {
    const res = await request(app).get('/docs');
    assert.equal(res.status, 302);
    assert.equal(res.headers.location, '/api/docs');
  });

  await t.test('GET /api/health should include swagger documentation endpoints', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.documentation.swaggerUi, '/api/docs');
    assert.equal(res.body.documentation.openApiJson, '/api/docs.json');
  });
});

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Secure Note-Taking & Social API',
      version: '1.0.0',
      description:
        'RESTful API documentation for the Secure Note-Taking Application featuring MongoDB, Mongoose, JWT Authentication, Role-Based Access Control (RBAC), and MongoDB Aggregation Pipelines.',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Current Environment Server',
      },
      {
        url: 'http://localhost:5000',
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from /api/auth/login or /api/auth/register.',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '67b7f1b7482f6e9b41a3bc01',
            },
            name: {
              type: 'string',
              example: 'Alice Smith',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'alice@example.com',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              example: 'user',
            },
            interests: {
              type: 'array',
              items: {
                type: 'string',
              },
              example: ['technology', 'reading', 'ai'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-02-21T06:30:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-02-21T06:30:00.000Z',
            },
          },
        },
        Note: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '67b7f1b7482f6e9b41a3bc02',
            },
            title: {
              type: 'string',
              example: 'Meeting Notes & Agenda',
            },
            content: {
              type: 'string',
              example: 'Discuss MongoDB indexing strategy and performance metrics.',
            },
            author: {
              $ref: '#/components/schemas/User',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-02-21T07:00:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-02-21T07:00:00.000Z',
            },
          },
        },
        Post: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '67b7f1b7482f6e9b41a3bc03',
            },
            title: {
              type: 'string',
              example: 'Deep Dive into MongoDB Aggregations',
            },
            content: {
              type: 'string',
              example: 'Learn how to use $lookup and $group efficiently with targeted indexes.',
            },
            author: {
              $ref: '#/components/schemas/User',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-02-21T07:15:00.000Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-02-21T07:15:00.000Z',
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            currentPage: {
              type: 'integer',
              example: 1,
            },
            totalPages: {
              type: 'integer',
              example: 5,
            },
            totalItems: {
              type: 'integer',
              example: 50,
            },
            limit: {
              type: 'integer',
              example: 10,
            },
            hasNextPage: {
              type: 'boolean',
              example: true,
            },
            hasPrevPage: {
              type: 'boolean',
              example: false,
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'Error description message',
            },
          },
        },
      },
    },
    paths: {
      '/api/health': {
        get: {
          tags: ['Health'],
          summary: 'Service Health Check',
          description: 'Checks API health and lists primary root endpoint namespaces.',
          responses: {
            200: {
              description: 'Service is operational',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', example: '2026-02-21T06:00:00.000Z' },
                      service: { type: 'string', example: 'Secure Note-Taking API' },
                      endpoints: {
                        type: 'object',
                        properties: {
                          auth: { type: 'string', example: '/api/auth' },
                          notes: { type: 'string', example: '/api/notes' },
                          users: { type: 'string', example: '/api/users' },
                          posts: { type: 'string', example: '/api/posts' },
                          aggregations: { type: 'string', example: '/api/aggregations' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          description: 'Creates a new user profile with a hashed password and returns a JWT token.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'Alice Smith' },
                    email: { type: 'string', format: 'email', example: 'alice@example.com' },
                    password: { type: 'string', format: 'password', minLength: 6, example: 'securePass123' },
                    role: { type: 'string', enum: ['user', 'admin'], default: 'user', example: 'user' },
                    interests: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['technology', 'reading'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'User registered successfully' },
                      token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Missing required fields or email already exists',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Log in user',
          description: 'Authenticates user with email and password and returns a JWT token.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'alice@example.com' },
                    password: { type: 'string', format: 'password', example: 'securePass123' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Logged in successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Logged in successfully' },
                      token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current user profile',
          description: 'Returns profile of currently authenticated user.',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Current user profile retrieved',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Not authorized or token missing/invalid',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        put: {
          tags: ['Auth'],
          summary: 'Update current user profile',
          description: 'Updates current logged in user name and interests.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Alice Modified' },
                    interests: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['cooking', 'gardening'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Profile updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Profile updated successfully' },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/notes': {
        post: {
          tags: ['Notes'],
          summary: 'Create a new note',
          description: 'Creates a private note belonging to the authenticated user.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'content'],
                  properties: {
                    title: { type: 'string', example: 'Weekly Sprint Goals' },
                    content: { type: 'string', example: '1. Finish Swagger docs. 2. Verify all API test suites.' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Note created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Note created successfully' },
                      data: { $ref: '#/components/schemas/Note' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Missing title or content',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        get: {
          tags: ['Notes'],
          summary: 'List notes with pagination',
          description:
            'Fetches paginated list of notes. Regular users only see their own notes. Admins can view all notes or filter by author.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
              description: 'Page number',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 },
              description: 'Number of items per page',
            },
            {
              name: 'author',
              in: 'query',
              schema: { type: 'string' },
              description: 'Author user ID filter (Admin only)',
            },
          ],
          responses: {
            200: {
              description: 'Paginated notes response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Note' },
                      },
                      pagination: { $ref: '#/components/schemas/PaginationMeta' },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/notes/{id}': {
        get: {
          tags: ['Notes'],
          summary: 'Get note by ID',
          description: 'Retrieves a single note. Regular users can only access their own notes; admins can view any note.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Note ObjectId',
            },
          ],
          responses: {
            200: {
              description: 'Note details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/Note' },
                    },
                  },
                },
              },
            },
            403: {
              description: 'Access forbidden (attempting to view someone else note)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            404: {
              description: 'Note not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        put: {
          tags: ['Notes'],
          summary: 'Update note by ID',
          description: 'Updates note title or content. Accessible by owner or admin.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Note ObjectId',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', example: 'Updated Title' },
                    content: { type: 'string', example: 'Updated Content' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Note updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Note updated successfully' },
                      data: { $ref: '#/components/schemas/Note' },
                    },
                  },
                },
              },
            },
            403: {
              description: 'Access forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            404: {
              description: 'Note not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Notes'],
          summary: 'Delete note by ID',
          description: 'Deletes a note. Accessible by owner or admin.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Note ObjectId',
            },
          ],
          responses: {
            200: {
              description: 'Note deleted successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Note deleted successfully' },
                    },
                  },
                },
              },
            },
            403: {
              description: 'Access forbidden',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            404: {
              description: 'Note not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/users': {
        get: {
          tags: ['Users (Admin)'],
          summary: 'List all users (Admin only)',
          description: 'Retrieves paginated list of all users sorted by creation date descending.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
              description: 'Page number',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 },
              description: 'Number of items per page',
            },
          ],
          responses: {
            200: {
              description: 'Paginated user list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/User' },
                      },
                      pagination: { $ref: '#/components/schemas/PaginationMeta' },
                    },
                  },
                },
              },
            },
            403: {
              description: 'Forbidden: Admin role required',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        post: {
          tags: ['Users (Admin)'],
          summary: 'Create a new user (Admin only)',
          description: 'Allows an administrator to create a user account directly.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'Charlie Brown' },
                    email: { type: 'string', format: 'email', example: 'charlie@example.com' },
                    password: { type: 'string', format: 'password', minLength: 6, example: 'securePass123' },
                    role: { type: 'string', enum: ['user', 'admin'], default: 'user', example: 'user' },
                    interests: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['gardening', 'design'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'User created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'User created successfully' },
                      data: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Validation failed or duplicate email',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            403: {
              description: 'Forbidden: Admin role required',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/users/{id}': {
        get: {
          tags: ['Users (Admin)'],
          summary: 'Get user by ID (Admin only)',
          description: 'Retrieves a single user account profile by ObjectId.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'User ObjectId',
            },
          ],
          responses: {
            200: {
              description: 'User profile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            404: {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        put: {
          tags: ['Users (Admin)'],
          summary: 'Update user by ID (Admin only)',
          description: 'Updates a user profile fields, role, interests, or password.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'User ObjectId',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'Charlie Updated' },
                    email: { type: 'string', format: 'email', example: 'charlie.updated@example.com' },
                    role: { type: 'string', enum: ['user', 'admin'], example: 'admin' },
                    interests: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['chess', 'robotics'],
                    },
                    password: { type: 'string', format: 'password', minLength: 6, example: 'newPassword123' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'User updated successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'User updated successfully' },
                      data: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            404: {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Users (Admin)'],
          summary: 'Delete user by ID (Admin only)',
          description: 'Deletes a user account. Admins cannot delete their own account.',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'User ObjectId',
            },
          ],
          responses: {
            200: {
              description: 'User removed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'User removed successfully' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Admin cannot delete their own account',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            404: {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/posts': {
        get: {
          tags: ['Posts'],
          summary: 'List public posts with pagination',
          description: 'Retrieves public posts ordered by newest first.',
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
              description: 'Page number',
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 },
              description: 'Number of posts per page',
            },
          ],
          responses: {
            200: {
              description: 'Paginated public posts',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Post' },
                      },
                      pagination: { $ref: '#/components/schemas/PaginationMeta' },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Posts'],
          summary: 'Create a new public post',
          description: 'Publishes a new public post authored by the authenticated user.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'content'],
                  properties: {
                    title: { type: 'string', example: 'Building Scalable Node.js APIs' },
                    content: { type: 'string', example: 'Here are the key takeaways from optimizing indexes and aggregation stages...' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Post created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Post created successfully' },
                      data: { $ref: '#/components/schemas/Post' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Missing title or content',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/posts/user/{userId}': {
        get: {
          tags: ['Posts'],
          summary: 'Get posts belonging to a user ($lookup aggregation)',
          description:
            'Retrieves all posts belonging to a particular user using a single aggregation pipeline with a $lookup stage.',
          parameters: [
            {
              name: 'userId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'User ObjectId',
            },
          ],
          responses: {
            200: {
              description: 'User posts retrieved via aggregation',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      count: { type: 'integer', example: 3 },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Post' },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Invalid user ID format',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
      '/api/aggregations/group-by-interests': {
        get: {
          tags: ['Aggregations'],
          summary: 'Scenario 1: Group by Interests',
          description:
            'Aggregates user profiles grouped by individual interests using exactly one collection.aggregate() call and supported by multikey index on interests.',
          responses: {
            200: {
              description: 'Grouped interests aggregation result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      scenario: { type: 'string', example: 'Scenario 1: Group by Interests' },
                      constraint: { type: 'string', example: 'Exactly one collection.aggregate() call' },
                      count: { type: 'integer', example: 4 },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            interest: { type: 'string', example: 'technology' },
                            userCount: { type: 'integer', example: 2 },
                            users: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: {
                                  _id: { type: 'string', example: '67b7f1b7482f6e9b41a3bc01' },
                                  name: { type: 'string', example: 'Alice Smith' },
                                  email: { type: 'string', example: 'alice@example.com' },
                                  role: { type: 'string', example: 'user' },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/aggregations/user-posts/{userId}': {
        get: {
          tags: ['Aggregations'],
          summary: 'Scenario 2: User Posts ($lookup)',
          description:
            'Retrieves user details along with all their posts using a single aggregation pipeline with a $lookup stage.',
          parameters: [
            {
              name: 'userId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'User ObjectId',
            },
          ],
          responses: {
            200: {
              description: 'User posts lookup aggregation result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      scenario: { type: 'string', example: 'Scenario 2: User Posts ($lookup)' },
                      constraint: { type: 'string', example: 'Single aggregation pipeline with a $lookup stage' },
                      data: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string', example: '67b7f1b7482f6e9b41a3bc01' },
                          name: { type: 'string', example: 'Alice Smith' },
                          email: { type: 'string', example: 'alice@example.com' },
                          role: { type: 'string', example: 'user' },
                          interests: {
                            type: 'array',
                            items: { type: 'string' },
                            example: ['technology', 'reading'],
                          },
                          totalPosts: { type: 'integer', example: 2 },
                          posts: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                _id: { type: 'string', example: '67b7f1b7482f6e9b41a3bc03' },
                                title: { type: 'string', example: 'My First Post' },
                                content: { type: 'string', example: 'Post content here' },
                                createdAt: { type: 'string', example: '2026-02-21T07:15:00.000Z' },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Invalid user ID format',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
            404: {
              description: 'User not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none } .swagger-ui .info { margin: 20px 0; }',
  customSiteTitle: 'Secure Notes & Social API Docs',
};

const setupSwagger = (app) => {
  // Expose JSON specification
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Expose Swagger UI at /api/docs and /docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  app.get('/docs', (req, res) => res.redirect('/api/docs'));
};

module.exports = {
  swaggerSpec,
  setupSwagger,
};

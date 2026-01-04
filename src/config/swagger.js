const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Desarrollo de Software Backend API',
      version: '1.0.0',
      description: 'API REST para gestión de cursos, usuarios e inscripciones',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'Juan Pérez',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'juan@example.com',
            },
            role: {
              type: 'string',
              enum: ['student', 'professor', 'admin'],
              example: 'student',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Course: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            title: {
              type: 'string',
              example: 'Introducción a Node.js',
            },
            description: {
              type: 'string',
              example: 'Curso completo sobre Node.js y Express',
            },
            professor_id: {
              type: 'integer',
              example: 2,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Inscription: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            userId: {
              type: 'integer',
              example: 1,
            },
            courseId: {
              type: 'integer',
              example: 1,
            },
            enrollment_status: {
              type: 'string',
              enum: ['pending', 'active', 'dropped', 'expired'],
              example: 'pending',
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
            },
            paymentStatus: {
              type: 'string',
              enum: ['pending', 'paid', 'failed'],
              example: 'pending',
            },
            paymentAmount: {
              type: 'integer',
              example: 0,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        TokenResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
        ProfileResponse: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'Juan Pérez',
            },
            email: {
              type: 'string',
              example: 'juan@example.com',
            },
            role: {
              type: 'string',
              example: 'student',
            },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            userId: {
              type: 'integer',
              example: 1,
            },
            amount: {
              type: 'integer',
              description: 'Monto en CLP (pesos chilenos)',
              example: 10000,
            },
            description: {
              type: 'string',
              example: 'Donación para el proyecto',
            },
            status: {
              type: 'string',
              enum: ['pending', 'approved', 'rejected', 'cancelled', 'refunded'],
              example: 'pending',
            },
            mercadoPagoPreferenceId: {
              type: 'string',
              example: '1234567890-abc123',
            },
            mercadoPagoPaymentId: {
              type: 'string',
              nullable: true,
              example: '1234567890',
            },
            mercadoPagoStatus: {
              type: 'string',
              nullable: true,
              example: 'approved',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes.js', './src/routes/*.js', './src/app.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;


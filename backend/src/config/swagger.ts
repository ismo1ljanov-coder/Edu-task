import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'EduTask API',
      version: '1.0.0',
      description:
        "O'quv markazlari uchun uy vazifalarini boshqarish tizimi — REST API hujjati.",
    },
    servers: [{ url: '/api', description: 'API base path' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // JSDoc @openapi comments inside route files are collected into the spec.
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
});

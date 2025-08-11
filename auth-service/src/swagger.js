// external dependencies
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

export function mountSwagger(app, title, port) {
  const spec = swaggerJSDoc({
    definition: {
      openapi: '3.0.0',
      info: { title, version: '1.0.0', description: `${title} API` },
      servers: [
        { url: `http://localhost:${port}`, description: 'Local' }
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
        },
        schemas: {
          // Common reusable schemas
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string', example: 'Invalid credentials' }
            }
          }
        }
      }
    },
    // We’ll keep docs in src/docs/*.js to avoid clutter in routes
    apis: ['./src/docs/**/*.js'],
  });

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
}

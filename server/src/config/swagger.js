const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nexus API Documentation',
      version: '1.0.0',
      description: 'API documentation for Nexus - A platform connecting entrepreneurs with investors',
      contact: {
        name: 'Nexus Support',
        email: 'support@nexus.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5002/api',
        description: 'Development server'
      },
      {
        url: 'https://your-production-url.com/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            name: {
              type: 'string',
              description: 'Full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email address'
            },
            userType: {
              type: 'string',
              enum: ['entrepreneur', 'investor'],
              description: 'Type of user'
            },
            firstName: {
              type: 'string',
              description: 'First name'
            },
            lastName: {
              type: 'string',
              description: 'Last name'
            },
            role: {
              type: 'string',
              enum: ['admin', 'investor', 'entrepreneur', 'user'],
              description: 'User role'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'suspended'],
              description: 'Account status'
            },
            emailVerified: {
              type: 'boolean',
              description: 'Email verification status'
            },
            twoFactorEnabled: {
              type: 'boolean',
              description: '2FA status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date'
            }
          }
        },
        Meeting: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Meeting ID'
            },
            title: {
              type: 'string',
              description: 'Meeting title'
            },
            description: {
              type: 'string',
              description: 'Meeting description'
            },
            startTime: {
              type: 'string',
              format: 'date-time',
              description: 'Meeting start time'
            },
            endTime: {
              type: 'string',
              format: 'date-time',
              description: 'Meeting end time'
            },
            location: {
              type: 'string',
              description: 'Meeting location'
            },
            organizerId: {
              type: 'string',
              description: 'Organizer user ID'
            },
            participants: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  userId: {
                    type: 'string',
                    description: 'Participant user ID'
                  },
                  status: {
                    type: 'string',
                    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
                    description: 'Participation status'
                  }
                }
              }
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'cancelled', 'completed'],
              description: 'Meeting status'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            }
          }
        },
        Document: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Document ID'
            },
            title: {
              type: 'string',
              description: 'Document title'
            },
            description: {
              type: 'string',
              description: 'Document description'
            },
            fileName: {
              type: 'string',
              description: 'File name'
            },
            originalName: {
              type: 'string',
              description: 'Original file name'
            },
            fileUrl: {
              type: 'string',
              description: 'File URL'
            },
            fileSize: {
              type: 'number',
              description: 'File size in bytes'
            },
            mimeType: {
              type: 'string',
              description: 'MIME type'
            },
            uploadedBy: {
              type: 'string',
              description: 'Uploader user ID'
            },
            status: {
              type: 'string',
              enum: ['draft', 'pending_review', 'approved', 'rejected', 'signed'],
              description: 'Document status'
            },
            category: {
              type: 'string',
              enum: ['contract', 'proposal', 'legal', 'financial', 'presentation', 'other'],
              description: 'Document category'
            },
            requiresSignature: {
              type: 'boolean',
              description: 'Whether document requires signature'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Transaction ID'
            },
            userId: {
              type: 'string',
              description: 'User ID'
            },
            type: {
              type: 'string',
              enum: ['deposit', 'withdraw', 'transfer'],
              description: 'Transaction type'
            },
            amount: {
              type: 'number',
              description: 'Transaction amount'
            },
            currency: {
              type: 'string',
              description: 'Currency code'
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed', 'cancelled'],
              description: 'Transaction status'
            },
            description: {
              type: 'string',
              description: 'Transaction description'
            },
            paymentMethod: {
              type: 'string',
              enum: ['stripe', 'paypal', 'bank_transfer'],
              description: 'Payment method'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation date'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            error: {
              type: 'string',
              description: 'Error details'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              description: 'Success message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};
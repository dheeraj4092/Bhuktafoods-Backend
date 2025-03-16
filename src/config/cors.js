import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const allowedOrigins = [
  'https://www.bhuktafoods.com',
  'https://bhuktafoods.com',
  process.env.CORS_ORIGIN || 'http://localhost:3000'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'x-my-custom-header'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Middleware for handling CORS
export const corsMiddleware = cors(corsOptions);

// Middleware for handling preflight requests
export const handlePreflight = (req, res, next) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-my-custom-header');
    res.header('Access-Control-Max-Age', '86400');
    return res.status(204).send();
  }
  next();
}; 
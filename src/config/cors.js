import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const allowedOrigins = [
  'https://www.bhuktafoods.com',
  'https://bhuktafoods.com',
  'https://bhuktafoods-backend.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173', // Vite default port
  process.env.CORS_ORIGIN
].filter(Boolean); // Remove any undefined values

console.log('Allowed CORS origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    console.log('Request origin:', origin);
    
    // Allow requests with no origin (like mobile apps, curl requests, or same-origin requests)
    if (!origin || process.env.NODE_ENV !== 'production') {
      console.log('Allowing request with no origin or in non-production environment');
      return callback(null, true);
    }

    // Check if the origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => 
      origin.toLowerCase().startsWith(allowedOrigin.toLowerCase())
    );

    if (isAllowed) {
      console.log('Origin is allowed:', origin);
      callback(null, true);
    } else {
      console.log('Origin is not allowed:', origin);
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
  console.log('Handling preflight request:', req.method, req.path);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-my-custom-header');
    res.header('Access-Control-Max-Age', '86400');
    console.log('Preflight response sent');
    return res.status(204).send();
  }
  next();
}; 
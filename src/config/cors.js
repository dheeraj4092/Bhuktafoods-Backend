import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const allowedOrigins = [
  'https://www.bhuktafoods.com',
  'https://bhuktafoods.com',
  'https://bhuktafoods-backend.vercel.app',
  'https://bhuktafoods-backend-eh2f5k2nf-dheeraj4092s-projects.vercel.app',
  'https://bhuktafoods-backend-aj02dayur-dheeraj4092s-projects.vercel.app',
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
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (!allowedOrigin) return false;
      // Check if origin matches exactly or is a subdomain of allowed origin
      return origin.toLowerCase() === allowedOrigin.toLowerCase() ||
             origin.toLowerCase().endsWith('.' + allowedOrigin.toLowerCase()) ||
             origin.toLowerCase().includes('vercel.app'); // Allow all Vercel preview deployments
    });

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
    // Get the origin from the request
    const origin = req.headers.origin;
    
    // Check if the origin is allowed
    const isAllowed = !origin || process.env.NODE_ENV !== 'production' || 
                     allowedOrigins.some(allowedOrigin => {
                       if (!allowedOrigin) return false;
                       return origin.toLowerCase() === allowedOrigin.toLowerCase() ||
                              origin.toLowerCase().endsWith('.' + allowedOrigin.toLowerCase()) ||
                              origin.toLowerCase().includes('vercel.app');
                     });

    if (isAllowed) {
      // If origin is allowed, set it in the response header
      res.header('Access-Control-Allow-Origin', origin || '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-my-custom-header');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');
      console.log('Preflight response sent for origin:', origin);
      return res.status(204).send();
    } else {
      console.log('Origin not allowed in preflight:', origin);
      return res.status(403).json({ error: 'Not allowed by CORS' });
    }
  }
  next();
}; 
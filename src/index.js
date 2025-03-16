import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import express from 'express';
import { corsMiddleware, handlePreflight } from './config/cors.js';

// Load environment variables
dotenv.config();

// Import routes
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import userRoutes from './routes/userRoutes.js';
import pincodeRoutes from './routes/pincode.js';

// Import error handlers
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';

// Configure paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Apply middlewares
app.use(corsMiddleware);
app.use(handlePreflight);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/pincodes', pincodeRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Snackolicious Delights API' });
});

// API health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Handle 404s
app.use(notFoundHandler);

// Error handling
app.use(errorHandler);

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Environment:', process.env.NODE_ENV);
  });
}

export default app;

// Serverless handler for Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

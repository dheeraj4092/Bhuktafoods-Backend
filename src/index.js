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

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Admin routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.get('/admin/products', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'products.html'));
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
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

// Root route - only respond with JSON if /api is accessed
app.get('/', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.json({ 
      message: 'Welcome to Snackolicious Delights API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        products: '/api/products',
        auth: '/api/auth',
        cart: '/api/cart',
        orders: '/api/orders'
      }
    });
  } else {
    res.redirect('/admin/login');
  }
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

// Export the Express app
export default app;

// Serverless handler for Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

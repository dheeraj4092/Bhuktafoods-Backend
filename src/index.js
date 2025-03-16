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

// Timeout middleware
const timeout = (req, res, next) => {
    // Set timeout to 9.5 seconds (leaving 500ms buffer for Vercel's 10s limit)
    res.setTimeout(9500, () => {
        res.status(408).json({ error: 'Request timeout' });
    });
    next();
};

// Initialize Express app
const app = express();

// Apply middlewares
app.use(timeout);  // Add timeout middleware
app.use(corsMiddleware);
app.use(handlePreflight);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  next();
});

// Serve static files - make sure this comes before API routes
app.use(express.static(path.join(__dirname, 'public')));

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

// Serve admin dashboard - ensure these routes work with the static file serving
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'login.html'));
});

// Serve admin dashboard only after authentication
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Catch-all route for admin pages to handle client-side routing
app.get('/admin/*', (req, res) => {
  // Check if the request is for a static file
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico)$/)) {
    res.sendFile(path.join(__dirname, 'public', 'admin', req.path));
    return;
  }
  // For all other routes, redirect to login
  res.redirect('/admin/login');
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Snackolicious Delights API' });
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

// Export the app for serverless deployment
export default app;

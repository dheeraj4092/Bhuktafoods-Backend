import { supabase } from '../config/supabase.js';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from '../services/emailService.js';

// Create order
export const createOrder = async (req, res) => {
  try {
    console.log('Creating order with payload:', req.body);
    console.log('Authenticated user:', req.user);

    const { items, shipping_address, total_amount } = req.body;
    
    // Validate required fields
    if (!items || !Array.isArray(items)) {
      throw new Error('Items array is required');
    }
    if (!shipping_address) {
      throw new Error('Shipping address is required');
    }
    if (!total_amount) {
      throw new Error('Total amount is required');
    }

    // Call the create_order function
    const { data: orderResult, error: orderError } = await supabase
      .rpc('create_order', {
        p_user_id: req.user.id,
        p_shipping_address: shipping_address,
        p_items: items.map(item => ({
          product_id: item.product_id,
          quantity: parseInt(item.quantity),
          quantity_unit: item.quantity_unit || '250g',
          unit_price: parseFloat(item.unit_price)
        })),
        p_total_amount: parseFloat(total_amount)
      });

    if (orderError) {
      console.error('Error creating order:', {
        error: orderError,
        user: req.user.id,
        payload: req.body
      });
      throw orderError;
    }

    console.log('Order created:', orderResult);

    // Send emails asynchronously
    Promise.all([
      sendOrderConfirmationEmail(orderResult.order, shipping_address.email),
      sendAdminNotificationEmail(orderResult.order)
    ]).catch(error => {
      console.error('Error sending order emails:', error);
    });

    // Return success response
    res.status(201).json({
      message: 'Order created successfully',
      order: orderResult.order
    });
  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({ 
      error: 'Failed to create order', 
      details: error.message,
      code: error.code 
    });
  }
};

// Get user's orders
export const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          quantity_unit,
          price,
          products (
            id,
            name,
            image
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get orders error:', error);
      throw new Error('Failed to fetch orders');
    }

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ 
      error: error.message || 'Error fetching orders',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get single order
export const getOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          quantity_unit,
          price,
          products (
            id,
            name,
            image
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Get order error:', error);
      throw new Error('Failed to fetch order');
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify order belongs to user
    if (order.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ 
      error: error.message || 'Error fetching order',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update order status (admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update order status error:', error);
      throw new Error('Failed to update order status');
    }

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get updated order details
    const { data: orderDetails, error: detailsError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          quantity_unit,
          price,
          products (
            id,
            name,
            image
          )
        )
      `)
      .eq('id', id)
      .single();

    if (detailsError) {
      console.error('Error fetching updated order details:', detailsError);
      return res.status(500).json({ error: 'Failed to fetch updated order details' });
    }

    res.json(orderDetails);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ 
      error: error.message || 'Error updating order status',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
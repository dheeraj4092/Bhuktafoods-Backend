import { supabase } from '../config/supabase.js';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from '../services/emailService.js';

// Create order
export const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    
    // Calculate total amount
    const total_amount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    // Transform items into the expected format for the create_order function
    const transformed_items = items.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      quantity_unit: item.quantity_unit || '250g',
      unit_price: item.price
    }));

    // Ensure proper typing for the parameters
    const orderParams = {
      p_user_id: req.user.id,
      p_shipping_address: JSON.stringify(shippingAddress), // Ensure JSONB format
      p_items: JSON.stringify(transformed_items), // Ensure JSONB array format
      p_total_amount: Number(total_amount) // Ensure decimal format
    };

    // Call the create_order function
    const { data, error } = await supabase.rpc('create_order', orderParams);

    if (error) {
      console.error('Error creating order:', error);
      throw error;
    }

    // Get the created order details
    const { data: orderDetails, error: detailsError } = await supabase
      .rpc('get_order_details', { 
        p_order_id: data.order_id 
      });

    if (detailsError) {
      console.error('Error fetching order details:', detailsError);
      throw detailsError;
    }

    // Send emails asynchronously - don't wait for them
    Promise.all([
      sendOrderConfirmationEmail(orderDetails, shippingAddress.email),
      sendAdminNotificationEmail(orderDetails)
    ]).catch(error => {
      console.error('Error sending order emails:', error);
      // Log to your error tracking service
    });

    // Respond with the order details
    res.status(201).json(orderDetails);
  } catch (error) {
    console.error('Error creating order:', error);
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
          price_at_time,
          products (
            id,
            name,
            image_url
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
      .rpc('get_order_details', { p_order_id: id });

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
      .rpc('get_order_details', { p_order_id: id });

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
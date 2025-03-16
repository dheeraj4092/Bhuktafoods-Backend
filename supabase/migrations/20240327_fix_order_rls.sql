-- Description: This migration updates the RLS policies for orders and order_items tables
-- to ensure proper access control and fixes the order creation function.

-- First, enable RLS on the tables if not already enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete their own orders" ON orders;
DROP POLICY IF EXISTS "Admin can manage all orders" ON orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON orders;

-- Create policies for orders table
CREATE POLICY "Users can create their own orders" 
ON orders FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own orders" 
ON orders FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders" 
ON orders FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add admin policy for orders
CREATE POLICY "Admin can manage all orders"
ON orders FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Drop existing policies for order_items
DROP POLICY IF EXISTS "Users can create their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Users can update their own order items" ON order_items;
DROP POLICY IF EXISTS "Admin can manage all order items" ON order_items;
DROP POLICY IF EXISTS "Admin can view all order items" ON order_items;

-- Create policies for order_items table
CREATE POLICY "Users can create their own order items" 
ON order_items FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their own order items" 
ON order_items FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own order items" 
ON order_items FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);

-- Add admin policy for order_items
CREATE POLICY "Admin can manage all order items"
ON order_items FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Grant necessary permissions to authenticated users
GRANT INSERT, SELECT, UPDATE ON orders TO authenticated;
GRANT INSERT, SELECT, UPDATE ON order_items TO authenticated;

-- Drop existing order creation function if it exists
DROP FUNCTION IF EXISTS create_order(UUID, JSONB, JSONB[], DECIMAL);

-- Update the create_order function to be security definer and bypass RLS
CREATE OR REPLACE FUNCTION create_order(
  p_user_id UUID,
  p_shipping_address JSONB,
  p_items JSONB[],
  p_total_amount DECIMAL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_order_item JSONB;
BEGIN
  -- Create the order
  INSERT INTO orders (
    user_id,
    shipping_address,
    total_amount,
    status
  ) VALUES (
    p_user_id,
    p_shipping_address,
    p_total_amount,
    'pending'
  ) RETURNING id INTO v_order_id;

  -- Create order items
  FOREACH v_order_item IN ARRAY p_items
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      quantity_unit,
      price_at_time
    ) VALUES (
      v_order_id,
      (v_order_item->>'product_id')::UUID,
      (v_order_item->>'quantity')::INTEGER,
      COALESCE((v_order_item->>'quantity_unit')::VARCHAR, '250g'),
      (v_order_item->>'unit_price')::DECIMAL
    );

    -- Update product stock
    UPDATE products
    SET stock_quantity = stock_quantity - (v_order_item->>'quantity')::INTEGER
    WHERE id = (v_order_item->>'product_id')::UUID;
  END LOOP;

  -- Clear cart items for the user
  DELETE FROM cart_items
  WHERE cart_id IN (
    SELECT id FROM shopping_cart WHERE user_id = p_user_id
  );

  -- Return the order details
  RETURN (
    SELECT jsonb_build_object(
      'order', jsonb_build_object(
        'id', o.id,
        'total_amount', o.total_amount,
        'shipping_address', o.shipping_address,
        'status', o.status,
        'created_at', o.created_at,
        'order_items', (
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'quantity_unit', oi.quantity_unit,
              'price_at_time', oi.price_at_time,
              'product', (
                SELECT jsonb_build_object(
                  'id', p.id,
                  'name', p.name,
                  'image_url', p.image_url
                )
                FROM products p
                WHERE p.id = oi.product_id
              )
            )
          )
          FROM order_items oi
          WHERE oi.order_id = o.id
        )
      )
    )
    FROM orders o
    WHERE o.id = v_order_id
  );
END;
$$;

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION create_order(UUID, JSONB, JSONB[], DECIMAL) TO authenticated; 
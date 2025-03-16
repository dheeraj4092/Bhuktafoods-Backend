-- Drop all versions of the create_order function
DROP FUNCTION IF EXISTS create_order(UUID, JSONB, JSONB[], DECIMAL);
DROP FUNCTION IF EXISTS create_order(JSONB[], DECIMAL, UUID);
DROP FUNCTION IF EXISTS create_order(JSONB[], DECIMAL, UUID, JSONB);

-- Create the correct version of the function
CREATE OR REPLACE FUNCTION create_order(
  p_user_id UUID,
  p_shipping_address JSONB,
  p_items JSONB[],
  p_total_amount DECIMAL
) RETURNS JSONB AS $$
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
      (v_order_item->>'quantity_unit')::VARCHAR,
      (v_order_item->>'unit_price')::DECIMAL
    );
  END LOOP;

  -- Return the order ID
  RETURN jsonb_build_object('order_id', v_order_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
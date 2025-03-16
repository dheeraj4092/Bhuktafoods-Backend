  try {
    // Prepare the order payload
    const orderPayload = {
      items: items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        quantity_unit: item.quantityUnit,
        unit_price: item.basePrice
      })),
      shipping_address: {
        name: formData.name,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        zip_code: formData.zipCode
      },
      total_amount: totalPrice
    };

    console.log('Sending order payload:', orderPayload);

    // Send the order to the backend
    const orderResponse = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(orderPayload)
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      console.error('Order creation failed:', errorData);
      throw new Error(errorData.error || errorData.details || "Failed to create order");
    }

    const data = await orderResponse.json();
    console.log('Order response:', data);

    if (!data.order?.id) {
      console.error('Invalid order response:', data);
      throw new Error("Invalid order response from server");
    }

    clearCart();
    toast.success(data.message || "Order placed successfully!");
    
    // Navigate to success page with order details
    navigate(`/order-success?orderId=${data.order.id}`, { 
      state: {
        orderId: data.order.id,
        orderTotal: data.order.total_amount,
        items: data.order.items,
        shippingAddress: data.order.shipping_address
      }
    });

    return data;
  } catch (error) {
    console.error("Checkout error:", error);
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error("Failed to place order. Please try again.");
    }
    throw error;
  }
} 
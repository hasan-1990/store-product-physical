// Migration script to move cart data from localStorage to database
// Run this on the client side when user logs in or app starts

export interface LocalCartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  color?: string;
  size?: string;
}

export const migrateLocalCartToDatabase = async (userId?: string) => {
  try {
    // Get cart session ID
    const sessionId = localStorage.getItem('cart_session_id');
    
    if (!sessionId && !userId) {
      console.log('No session ID or user ID found for cart migration');
      return;
    }

    // Get existing cart from localStorage (if any)
    const localCart = localStorage.getItem('cart_items');
    if (!localCart) {
      console.log('No local cart found to migrate');
      return;
    }

    let localCartItems: LocalCartItem[] = [];
    try {
      localCartItems = JSON.parse(localCart);
    } catch (error) {
      console.error('Error parsing local cart:', error);
      return;
    }

    if (localCartItems.length === 0) {
      console.log('Local cart is empty');
      return;
    }

    console.log(`Migrating ${localCartItems.length} items from local cart to database`);

    // Migrate each item
    for (const item of localCartItems) {
      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            userId: userId,
            sessionId: !userId ? sessionId : undefined,
          }),
        });

        const data = await response.json();
        if (!data.success) {
          console.error(`Failed to migrate item ${item.id}:`, data.error);
        } else {
          console.log(`Successfully migrated item: ${item.name}`);
        }
      } catch (error) {
        console.error(`Error migrating item ${item.id}:`, error);
      }
    }

    // Clear localStorage cart after successful migration
    localStorage.removeItem('cart_items');
    console.log('Local cart cleared after migration');

  } catch (error) {
    console.error('Cart migration error:', error);
  }
};

// Function to handle session to user cart transfer when user logs in
export const transferSessionCartToUser = async (userId: string) => {
  try {
    const sessionId = localStorage.getItem('cart_session_id');
    if (!sessionId) {
      console.log('No session cart to transfer');
      return;
    }

    // Get session cart items
    const response = await fetch(`/api/cart?sessionId=${sessionId}`);
    const data = await response.json();

    if (!data.success || !data.data || data.data.length === 0) {
      console.log('No session cart items to transfer');
      return;
    }

    console.log(`Transferring ${data.data.length} items from session to user cart`);

    // Add each session cart item to user cart
    for (const item of data.data) {
      try {
        const addResponse = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            userId: userId,
          }),
        });

        const addData = await addResponse.json();
        if (!addData.success) {
          console.error(`Failed to transfer item ${item.id}:`, addData.error);
        }
      } catch (error) {
        console.error(`Error transferring item ${item.id}:`, error);
      }
    }

    // Clear session cart after transfer
    const clearResponse = await fetch(`/api/cart?sessionId=${sessionId}`, {
      method: 'DELETE',
    });

    if (clearResponse.ok) {
      localStorage.removeItem('cart_session_id');
      console.log('Session cart cleared after transfer');
    }

  } catch (error) {
    console.error('Cart transfer error:', error);
  }
};

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CacheManager } from '@/lib/cache-manager';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Admin users API called');
    
    // Skip cache for now - direct database fetch
    console.log('🔄 Fetching users from database (cache disabled)');
    const mongodb = await connectDB();
    
    const users = await mongodb.users.find().sort({ createdAt: -1 }).toArray();
    console.log('Found users count:', users.length);
    
    // Get all orders to calculate totalOrders and totalSpent per user
    console.log('📦 Fetching orders for statistics...');
    const orders = await mongodb.orders.find().toArray();
    console.log('Found orders count:', orders.length);
    
    // Calculate order statistics per user
    const userOrderStats = new Map<string, { totalOrders: number; totalSpent: number }>();
    
    orders.forEach((order: any) => {
      // Get userId and normalize to string
      let userId = order.userId || order.user;
      if (!userId) return;
      
      // Convert to string if it's ObjectId
      if (typeof userId === 'object' && userId._id) {
        userId = userId._id.toString();
      } else if (typeof userId === 'object') {
        userId = userId.toString();
      } else {
        userId = String(userId);
      }
      
      const stats = userOrderStats.get(userId) || { totalOrders: 0, totalSpent: 0 };
      stats.totalOrders += 1;
      
      // Calculate total spent from order
      // If totalAmount is 0, calculate from items (in case of 100% discount)
      let orderTotal = order.totalAmount || order.totalPrice || order.total || order.amount || 0;
      
      // If totalAmount is 0, sum up item prices (before discount)
      if (orderTotal === 0 && order.items && Array.isArray(order.items)) {
        orderTotal = order.items.reduce((sum: number, item: any) => {
          const itemPrice = (item.price || 0) * (item.quantity || 1);
          return sum + itemPrice;
        }, 0);
      }
      
      stats.totalSpent += orderTotal;
      
      userOrderStats.set(userId, stats);
    });
    
    console.log('📊 Calculated stats for', userOrderStats.size, 'users');
    console.log('📊 Stats breakdown:', Array.from(userOrderStats.entries()).map(([id, stat]) => ({
      userId: id.substring(0, 10) + '...',
      orders: stat.totalOrders,
      spent: stat.totalSpent
    })));
    
    // Simple transformation
    const transformedUsers = users.map((user: any) => {
      // Split name into first and last name
      const nameParts = user.name?.split(' ') || ['', ''];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Safe date conversion
      const getISODate = (dateValue: any): string => {
        if (!dateValue) return new Date().toISOString();
        if (typeof dateValue === 'string') return dateValue;
        if (dateValue instanceof Date) return dateValue.toISOString();
        if (typeof dateValue.toISOString === 'function') return dateValue.toISOString();
        return new Date().toISOString();
      };
      
      // Map database role to frontend role
      let frontendRole = 'customer';
      const dbRole = (user.role || '').toLowerCase();
      
      if (dbRole === 'admin' || dbRole === 'مدیر') {
        frontendRole = 'admin';
      } else if (dbRole === 'moderator' || dbRole === 'ناظر') {
        frontendRole = 'moderator';
      } else {
        frontendRole = 'customer';
      }
      
      // Get order statistics for this user
      const userId = user._id.toString();
      const stats = userOrderStats.get(userId) || { totalOrders: 0, totalSpent: 0 };
      
      return {
        id: userId,
        firstName,
        lastName,
        email: user.email,
        phone: user.phone || user.mobile || '',
        avatar: user.avatar || '',
        role: frontendRole,
        status: user.isActive !== false ? 'active' : 'inactive',
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpent,
        joinDate: getISODate(user.createdAt),
        lastActivity: getISODate(user.updatedAt || user.createdAt),
        address: user.address || null
      };
    });

    // Cache disabled for now
    // await CacheManager.setUsers(transformedUsers);
    console.log('💾 Cache skipped for users');

    console.log('✅ Users data prepared, sending response');
    return NextResponse.json({
      success: true,
      users: transformedUsers,
      count: users.length,
      source: 'database'
    });

  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('📝 Admin update user API called');
    
    const body = await request.json();
    const { userId, updates } = body;
    
    console.log('📋 Received update request:');
    console.log('  userId:', userId, '(type:', typeof userId, ')');
    console.log('  updates:', JSON.stringify(updates));

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();
    
    // Prepare update object based on what's being updated
    const updateObject: any = {};
    
    if (updates.firstName || updates.lastName) {
      // Combine firstName and lastName back to name field
      const name = `${updates.firstName || ''} ${updates.lastName || ''}`.trim();
      updateObject.name = name;
    }
    
    if (updates.email) updateObject.email = updates.email;
    if (updates.phone) updateObject.phone = updates.phone;
    if (updates.role) {
      // Convert to database format
      updateObject.role = updates.role === 'admin' ? 'ADMIN' : 'USER';
    }
    if (updates.status) {
      // Convert status to isActive field
      updateObject.isActive = updates.status === 'active';
    }
    if (updates.address) {
      updateObject.address = updates.address;
    }
    
    // Handle password update
    if (updates.password) {
      const hashedPassword = await bcrypt.hash(updates.password, 12);
      updateObject.password = hashedPassword;
    }
    
    updateObject.updatedAt = new Date();

    // Update user in database
    let result;
    
    console.log('🔍 Attempting to find user with ID:', userId);
    
    // Try string ID format first (most common in this database)
    console.log('🔑 Trying string ID format');
    result = await mongodb.users.updateOne(
      { _id: userId },
      { $set: updateObject }
    );
    
    console.log('📊 Update result:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
    
    // If not found with string, try ObjectId format
    if (result.matchedCount === 0 && /^[0-9a-fA-F]{24}$/.test(userId)) {
      console.log('🔑 Trying ObjectId format');
      result = await mongodb.users.updateOne(
        { _id: new ObjectId(userId) },
        { $set: updateObject }
      );
      
      console.log('📊 Update result with ObjectId:', {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      });
    }

    if (result.matchedCount === 0) {
      console.error('❌ User not found with ID:', userId);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Invalidate cache so updated data is fetched fresh
    await CacheManager.invalidateUsers();
    console.log('🧹 Users cache invalidated after user update');

    console.log('✅ User updated successfully');
    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating user:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Admin delete user API called');
    
    const body = await request.json();
    const { userId, userIds } = body;

    if (!userId && !userIds) {
      return NextResponse.json(
        { error: 'userId or userIds is required' },
        { status: 400 }
      );
    }

    const mongodb = await connectDB();
    
    if (userIds && Array.isArray(userIds)) {
      // Bulk delete multiple users
      console.log('🗑️ Bulk deleting users:', userIds);
      
      // Try string IDs first (most common in this database)
      console.log('🔑 Trying string ID format for bulk deletion');
      let result = await mongodb.users.deleteMany({ _id: { $in: userIds as any } });
      
      console.log(`📊 Deleted ${result.deletedCount} users with string IDs`);
      
      // If no matches found, try ObjectId format
      if (result.deletedCount === 0) {
        console.log('🔑 Trying ObjectId format for bulk deletion');
        const objectIds = [];
        
        for (const id of userIds) {
          if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
            try {
              objectIds.push(new ObjectId(id));
            } catch (error) {
              console.warn('⚠️ Failed to convert to ObjectId:', id);
            }
          }
        }
        
        if (objectIds.length > 0) {
          result = await mongodb.users.deleteMany({ _id: { $in: objectIds } });
          console.log(`📊 Deleted ${result.deletedCount} users with ObjectIds`);
        }
      }

      if (result.deletedCount === 0) {
        return NextResponse.json(
          { error: 'No users were deleted - invalid IDs or users not found' },
          { status: 404 }
        );
      }

      console.log(`✅ Total deleted: ${result.deletedCount} users out of ${userIds.length} requested`);

      // Also delete their orders if any (using string IDs for orders)
      await mongodb.orders.deleteMany({ userId: { $in: userIds } });

      // Invalidate cache so updated data is fetched fresh
      await CacheManager.invalidateUsers();
      console.log('🧹 Users cache invalidated after bulk deletion');

      return NextResponse.json({
        success: true,
        message: `${result.deletedCount} users deleted successfully`,
        deletedCount: result.deletedCount
      });
    } else {
      // Single user delete
      try {
        if (!userId || typeof userId !== 'string') {
          return NextResponse.json(
            { error: 'Invalid user ID format' },
            { status: 400 }
          );
        }

        let result;
        
        // Try string ID format first (most common in this database)
        console.log('🔑 Trying string ID format for deletion');
        result = await mongodb.users.deleteOne({ _id: userId as any });
        
        // If not found with string, try ObjectId format
        if (result.deletedCount === 0 && /^[0-9a-fA-F]{24}$/.test(userId)) {
          console.log('🔑 Trying ObjectId format for deletion');
          result = await mongodb.users.deleteOne({ _id: new ObjectId(userId) });
        }

        if (result.deletedCount === 0) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }

        // Also delete user's orders if any
        await mongodb.orders.deleteMany({ userId: userId });

        // Invalidate cache so updated data is fetched fresh
        await CacheManager.invalidateUsers();
        console.log('🧹 Users cache invalidated after user deletion');

        console.log('✅ User deleted successfully');
        return NextResponse.json({
          success: true,
          message: 'User deleted successfully'
        });
      } catch (error) {
        console.error('❌ Error in single user deletion:', error);
        return NextResponse.json(
          { error: 'Failed to delete user', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        );
      }
    }

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

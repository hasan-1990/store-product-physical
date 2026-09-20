// src/middleware/api-auth.ts
/**
 * API Authentication & Authorization Middleware
 * احراز هویت و دسترسی API
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '@/lib/secrets';
import { connectDB } from '@/lib/mongodb';
import { logFailedLogin, logSuspiciousActivity, logSensitiveDataAccess } from '@/lib/logger';
import { sanitizeObject, sanitizeMongoQuery } from '@/lib/input-sanitization';

/**
 * Extract token from request
 */
function extractToken(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookie
  const token = request.cookies.get('next-auth.session-token')?.value;
  if (token) {
    return token;
  }
  
  return null;
}

/**
 * Verify JWT token
 */
async function verifyToken(token: string): Promise<any> {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Get user from database
 */
async function getUserFromToken(token: string): Promise<any> {
  try {
    const decoded = await verifyToken(token);
    if (!decoded || !decoded.email) {
      return null;
    }
    
    const db = await connectDB();
    const user = await db.users.findOne(
      { email: sanitizeMongoQuery(decoded.email) },
      { projection: { password: 0 } } // Don't return password
    );
    
    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Extract client IP
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP.trim();
  }
  
  return 'unknown';
}

/**
 * Require Authentication
 */
export async function requireAuth(request: NextRequest): Promise<{
  authorized: boolean;
  user?: any;
  response?: NextResponse;
}> {
  const token = extractToken(request);
  
  if (!token) {
    logFailedLogin('unknown', getClientIP(request), 'No token provided');
    
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: 'احراز هویت نشده است' },
        { status: 401 }
      )
    };
  }
  
  const user = await getUserFromToken(token);
  
  if (!user) {
    logFailedLogin('unknown', getClientIP(request), 'Invalid token');
    
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      )
    };
  }
  
  return {
    authorized: true,
    user
  };
}

/**
 * Require Admin Role
 */
export async function requireAdmin(request: NextRequest): Promise<{
  authorized: boolean;
  user?: any;
  response?: NextResponse;
}> {
  const authResult = await requireAuth(request);
  
  if (!authResult.authorized) {
    return authResult;
  }
  
  const { user } = authResult;
  
  if (user.role?.toLowerCase() !== 'admin') {
    logSuspiciousActivity(
      'UNAUTHORIZED_ADMIN_ACCESS',
      { userId: user._id, email: user.email, path: request.nextUrl.pathname },
      getClientIP(request),
      user._id?.toString()
    );
    
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: 'دسترسی غیرمجاز - فقط ادمین' },
        { status: 403 }
      )
    };
  }
  
  return {
    authorized: true,
    user
  };
}

/**
 * Require Specific Role
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<{
  authorized: boolean;
  user?: any;
  response?: NextResponse;
}> {
  const authResult = await requireAuth(request);
  
  if (!authResult.authorized) {
    return authResult;
  }
  
  const { user } = authResult;
  
  if (!allowedRoles.includes(user.role)) {
    logSuspiciousActivity(
      'UNAUTHORIZED_ROLE_ACCESS',
      { 
        userId: user._id, 
        userRole: user.role, 
        requiredRoles: allowedRoles,
        path: request.nextUrl.pathname 
      },
      getClientIP(request),
      user._id?.toString()
    );
    
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: 'دسترسی غیرمجاز' },
        { status: 403 }
      )
    };
  }
  
  return {
    authorized: true,
    user
  };
}

/**
 * Check if user owns resource
 */
export async function requireOwnership(
  request: NextRequest,
  resourceUserId: string
): Promise<{
  authorized: boolean;
  user?: any;
  response?: NextResponse;
}> {
  const authResult = await requireAuth(request);
  
  if (!authResult.authorized) {
    return authResult;
  }
  
  const { user } = authResult;
  
  // Admin has access to everything
  if (user.role === 'admin') {
    return {
      authorized: true,
      user
    };
  }
  
  // Check ownership
  if (user._id?.toString() !== resourceUserId) {
    logSuspiciousActivity(
      'UNAUTHORIZED_RESOURCE_ACCESS',
      { 
        userId: user._id, 
        attemptedResource: resourceUserId,
        path: request.nextUrl.pathname 
      },
      getClientIP(request),
      user._id?.toString()
    );
    
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: 'دسترسی به این منبع ندارید' },
        { status: 403 }
      )
    };
  }
  
  return {
    authorized: true,
    user
  };
}

/**
 * Sanitize Request Body
 */
export async function sanitizeRequestBody(request: NextRequest): Promise<any> {
  try {
    const body = await request.json();
    return sanitizeObject(body);
  } catch (error) {
    return {};
  }
}

/**
 * Validate Request Body Schema
 */
export function validateSchema(
  data: Record<string, any>,
  schema: Record<string, { required?: boolean; type?: string; maxLength?: number; min?: number; max?: number }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`فیلد ${field} الزامی است`);
      continue;
    }
    
    // Skip validation if not required and empty
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }
    
    // Check type
    if (rules.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== rules.type) {
        errors.push(`فیلد ${field} باید از نوع ${rules.type} باشد`);
        continue;
      }
    }
    
    // Check string maxLength
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      errors.push(`فیلد ${field} نباید بیشتر از ${rules.maxLength} کاراکتر باشد`);
    }
    
    // Check number min/max
    if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
      errors.push(`فیلد ${field} نباید کمتر از ${rules.min} باشد`);
    }
    
    if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
      errors.push(`فیلد ${field} نباید بیشتر از ${rules.max} باشد`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Log Sensitive Data Access
 */
export async function logDataAccess(
  request: NextRequest,
  user: any,
  dataType: string
): Promise<void> {
  const action = request.method === 'GET' ? 'read' : request.method === 'DELETE' ? 'delete' : 'write';
  
  logSensitiveDataAccess(
    dataType,
    user._id?.toString() || 'unknown',
    action
  );
}

/**
 * CORS Preflight Handler
 */
export function handleCORS(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }
    
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');
    
    return response;
  }
  
  return null;
}

/**
 * Rate Limit Check for Authenticated Users
 */
const userRateLimits = new Map<string, { count: number; resetTime: number }>();

export function checkUserRateLimit(
  userId: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = userRateLimits.get(userId);
  
  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs;
    userRateLimits.set(userId, { count: 1, resetTime });
    return { allowed: true, remaining: maxRequests - 1, resetTime };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

// Cleanup rate limit store
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of userRateLimits.entries()) {
    if (now > value.resetTime) {
      userRateLimits.delete(key);
    }
  }
}, 60000);

/**
 * API Response Helper
 */
export function apiResponse(
  data: any,
  status: number = 200,
  message?: string
): NextResponse {
  return NextResponse.json({
    success: status >= 200 && status < 300,
    message,
    data,
    timestamp: new Date().toISOString()
  }, { status });
}

/**
 * API Error Response
 */
export function apiError(
  message: string,
  status: number = 400,
  details?: any
): NextResponse {
  return NextResponse.json({
    success: false,
    message,
    details,
    timestamp: new Date().toISOString()
  }, { status });
}

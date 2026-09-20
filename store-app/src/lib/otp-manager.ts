import { connectDB } from './mongodb'

// OTP interface
interface OTPDocument {
  phone: string
  code: string
  type: 'register' | 'login' | 'forgot'
  attempts: number
  createdAt: Date
  expiresAt: Date
}

// Generate 4-digit OTP
export function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

// Store OTP in MongoDB
export async function storeOTP(
  phone: string, 
  code: string, 
  type: 'register' | 'login' | 'forgot', 
  existingAttempts = 0
): Promise<void> {
  try {
    const db = await connectDB()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    
    // Delete old OTP for this phone
    await db.otpCodes.deleteMany({ phone })
    
    // Insert new OTP
    await db.otpCodes.insertOne({
      phone,
      code,
      type,
      attempts: existingAttempts + 1,
      createdAt: new Date(),
      expiresAt
    })
    
    console.log(`✅ OTP stored in DB: ${phone} -> ${code} (expires in 10 min)`)
  } catch (error) {
    console.error('❌ Error storing OTP:', error)
    throw error
  }
}

// Get OTP from MongoDB
export async function getOTP(phone: string): Promise<{ code: string, expiry: number, attempts: number, type: string } | null> {
  try {
    const db = await connectDB()
    const otpDoc = await db.otpCodes.findOne({ phone }) as OTPDocument | null
    
    if (!otpDoc) {
      console.log(`⚠️ No OTP found for ${phone}`)
      return null
    }
    
    // Check if expired
    if (new Date() > otpDoc.expiresAt) {
      console.log(`⏰ OTP expired for ${phone}`)
      await db.otpCodes.deleteOne({ phone })
      return null
    }
    
    console.log(`✅ OTP found for ${phone}: ${otpDoc.code}`)
    return {
      code: otpDoc.code,
      expiry: otpDoc.expiresAt.getTime(),
      attempts: otpDoc.attempts,
      type: otpDoc.type
    }
  } catch (error) {
    console.error('❌ Error getting OTP:', error)
    return null
  }
}

// Delete OTP from MongoDB
export async function deleteOTP(phone: string): Promise<void> {
  try {
    const db = await connectDB()
    await db.otpCodes.deleteOne({ phone })
    console.log(`🗑️ OTP deleted for ${phone}`)
  } catch (error) {
    console.error('❌ Error deleting OTP:', error)
  }
}

// Check if OTP is expired
export async function isOTPExpired(phone: string): Promise<boolean> {
  try {
    const db = await connectDB()
    const otpDoc = await db.otpCodes.findOne({ phone }) as OTPDocument | null
    
    if (!otpDoc) {
      return true
    }
    
    if (new Date() > otpDoc.expiresAt) {
      await db.otpCodes.deleteOne({ phone })
      return true
    }
    
    return false
  } catch (error) {
    console.error('❌ Error checking OTP expiry:', error)
    return true
  }
}

// Cleanup expired OTPs (can be called by cron job)
export async function cleanupExpiredOTPs(): Promise<void> {
  try {
    const db = await connectDB()
    const result = await db.otpCodes.deleteMany({
      expiresAt: { $lt: new Date() }
    })
    console.log(`🧹 Cleaned up ${result.deletedCount} expired OTPs`)
  } catch (error) {
    console.error('❌ Error cleaning up OTPs:', error)
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase/admin';
import crypto from 'crypto';
import { emailService } from '@/lib/services/EmailService';

// GET - List all admin users
export async function GET() {
  try {
    const snapshot = await firestore
      .collection('adminUsers')
      .orderBy('createdAt', 'desc')
      .get();

    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        name: data.name,
        role: data.role || 'admin',
        isActive: data.isActive !== false,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        lastLogin: data.lastLogin?.toDate?.()?.toISOString() || data.lastLogin,
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Create new admin user and send invite email
export async function POST(request: NextRequest) {
  try {
    const { email, name, role } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await firestore
      .collection('adminUsers')
      .where('email', '==', email.toLowerCase())
      .get();

    if (!existingUser.empty) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Generate a secure setup token
    const setupToken = crypto.randomBytes(32).toString('hex');
    const setupTokenHash = crypto.createHash('sha256').update(setupToken).digest('hex');
    const setupTokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Create the user (inactive until they set their password)
    const newUser = {
      email: email.toLowerCase(),
      name,
      role: role || 'admin',
      isActive: false, // Will be activated when they set their password
      setupTokenHash,
      setupTokenExpiry,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await firestore.collection('adminUsers').add(newUser);

    // Build the setup URL
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    const setupUrl = `${baseUrl}/admin/setup-password?token=${setupToken}`;

    // Send invite email
    const emailSent = await emailService.sendAdminInvite(email, {
      name,
      setupUrl,
    });

    if (!emailSent) {
      console.warn('Failed to send invite email, but user was created');
    }

    return NextResponse.json({
      success: true,
      emailSent,
      user: {
        id: docRef.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        isActive: newUser.isActive,
      },
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

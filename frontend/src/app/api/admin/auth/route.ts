import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase/admin';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if any admin users exist
    const adminUsersSnapshot = await firestore.collection('adminUsers').limit(1).get();

    // If no admin users exist, create the first one using env variable
    if (adminUsersSnapshot.empty) {
      const envPassword = process.env.ADMIN_PASSWORD;

      if (!envPassword) {
        return NextResponse.json(
          { success: false, error: 'Admin access not configured. Please set ADMIN_PASSWORD in environment.' },
          { status: 500 }
        );
      }

      // For first-time setup, check against env password
      if (password === envPassword) {
        // Create the first admin user
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        await firestore.collection('adminUsers').add({
          email: email.toLowerCase(),
          name: 'Admin',
          passwordHash,
          role: 'super_admin',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        return NextResponse.json({
          success: true,
          user: { email: email.toLowerCase(), name: 'Admin', role: 'super_admin' },
          message: 'First admin account created successfully',
        });
      }

      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Normal authentication flow - find user by email
    const userQuery = await firestore
      .collection('adminUsers')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (userQuery.empty) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // Check if user is active
    if (userData.isActive === false) {
      return NextResponse.json(
        { success: false, error: 'Account is disabled. Contact an administrator.' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login timestamp
    await userDoc.ref.update({
      lastLogin: new Date(),
    });

    return NextResponse.json({
      success: true,
      user: {
        id: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'admin',
      },
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

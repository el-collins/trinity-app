import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase/admin';
import bcrypt from 'bcryptjs';

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

// POST - Create new admin user
export async function POST(request: NextRequest) {
  try {
    const { email, name, password, role } = await request.json();

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
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

    // Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create the user
    const newUser = {
      email: email.toLowerCase(),
      name,
      passwordHash,
      role: role || 'admin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await firestore.collection('adminUsers').add(newUser);

    return NextResponse.json({
      success: true,
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

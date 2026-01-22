import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase/admin';
import bcrypt from 'bcryptjs';

// GET - Get single admin user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const docRef = firestore.collection('adminUsers').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const data = docSnap.data()!;

    return NextResponse.json({
      id: docSnap.id,
      email: data.email,
      name: data.name,
      role: data.role || 'admin',
      isActive: data.isActive !== false,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      lastLogin: data.lastLogin?.toDate?.()?.toISOString() || data.lastLogin,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PATCH - Update admin user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { email, name, password, role, isActive } = body;

    const docRef = firestore.collection('adminUsers').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const updates: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (email !== undefined) {
      // Check if email is already taken by another user
      const existingUser = await firestore
        .collection('adminUsers')
        .where('email', '==', email.toLowerCase())
        .get();

      const otherUserWithEmail = existingUser.docs.find(doc => doc.id !== id);
      if (otherUserWithEmail) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 }
        );
      }

      updates.email = email.toLowerCase();
    }

    if (name !== undefined) {
      updates.name = name;
    }

    if (role !== undefined) {
      updates.role = role;
    }

    if (isActive !== undefined) {
      updates.isActive = isActive;
    }

    if (password) {
      const saltRounds = 12;
      updates.passwordHash = await bcrypt.hash(password, saltRounds);
    }

    await docRef.update(updates);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete admin user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const docRef = firestore.collection('adminUsers').doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if this is the last admin user
    const allAdmins = await firestore.collection('adminUsers').get();
    if (allAdmins.size <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last admin user' },
        { status: 400 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

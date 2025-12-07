import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from '../../../lib/prisma';

export async function POST(req) {
  try {
    const { apaarId, name, mobile, dob, password } = await req.json();

    // Validate all required fields
    if (!apaarId || !name || !mobile || !dob || !password) {
      return NextResponse.json({ 
        error: "All fields are required (APAAR ID, Name, Mobile, DOB, Password)" 
      }, { status: 400 });
    }

    // Validate mobile number format (10 digits)
    if (!/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ 
        error: "Mobile number must be exactly 10 digits" 
      }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ 
        error: "Password must be at least 6 characters long" 
      }, { status: 400 });
    }

    // Validate date of birth
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      return NextResponse.json({ 
        error: "Invalid date of birth" 
      }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { apaarId } 
    });
    
    if (existingUser) {
      return NextResponse.json({ 
        error: "APAAR ID already registered" 
      }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with all required fields
    const user = await prisma.user.create({
      data: { 
        apaarId,
        name,
        mobile,
        dob: dobDate,
        hashedPassword 
      },
    });

    return NextResponse.json({ 
      message: "User created successfully",
      user: { 
        id: user.id, 
        apaarId: user.apaarId,
        name: user.name,
        mobile: user.mobile,
        dob: user.dob
      } 
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ 
      error: "Failed to create user. Please try again." 
    }, { status: 500 });
  }
}

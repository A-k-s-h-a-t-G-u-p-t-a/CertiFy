import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from '../../../lib/prisma';

export async function POST(req) {
  const { apaarId, password } = await req.json();

  if (!apaarId || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { apaarId } });
  if (existingUser) {
    return NextResponse.json({ error: "Apaar ID already registered" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { apaarId, hashedPassword },
  });

  return NextResponse.json({ 
    message: "User created successfully",
    user: { id: user.id, apaarId: user.apaarId } 
  }, { status: 201 });
}

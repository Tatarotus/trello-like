"use server"

import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createSession, deleteSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function register(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) return { error: "All fields are required" };

  const existingUser = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existingUser) return { error: "Email already in use" };

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await db.insert(users).values({
    id: crypto.randomUUID(),
    name,
    email,
    password: hashedPassword,
  }).returning();

  await createSession(newUser[0].id);
  redirect('/');
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) return { error: "All fields are required" };

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) return { error: "Invalid credentials" };

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return { error: "Invalid credentials" };

  await createSession(user.id);
  redirect('/');
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}

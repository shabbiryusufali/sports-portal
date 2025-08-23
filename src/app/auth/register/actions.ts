"use server";
import { createUserWithCredentials } from "@/lib/auth"; // Adjust the import path as needed

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface RegisterResult {
  success: boolean;
  message?: string;
}

export async function registerWithCredentials(
  credentials: RegisterCredentials,
): Promise<RegisterResult> {
  try {
    let user = await createUserWithCredentials(credentials);
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Registration failed",
    };
  }
}

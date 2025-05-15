import bcrypt from 'bcrypt';
import jwt, { SignOptions, Secret, JwtPayload } from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN, SALT_ROUNDS } from '../config/env';

// Interface for token payload
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

// Interface for user data without sensitive information
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Interface for user data from database
export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  [key: string]: any; // Allow additional properties
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(payload: TokenPayload): string {
  // Explicitly import type to avoid conflicts
  const options: jwt.SignOptions = {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  };
  
  return jwt.sign(
    payload, 
    JWT_SECRET as Secret, 
    options
  );
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: TokenPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions["expiresIn"]
  };
  
  return jwt.sign(
    payload, 
    JWT_SECRET as Secret, 
    options
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET as Secret) as JwtPayload;
  
  // Transform to our TokenPayload
  return {
    userId: decoded.userId,
    email: decoded.email,
    role: decoded.role
  };
}

/**
 * Extract token from authorization header
 */
export function extractTokenFromHeader(authHeader: string): string | null {
  // Check if header exists and has bearer format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // Extract token
  return authHeader.substring(7);
}

/**
 * Create safe user object (without sensitive data)
 */
export function createSafeUser(user: UserData): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}
// JWT Configuration
export const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_change_in_production';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// Bcrypt Configuration
export const SALT_ROUNDS = 10; // Number of salt rounds for bcrypt
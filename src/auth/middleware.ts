import { extractTokenFromHeader, verifyToken } from '../utils/auth';

/**
 * Authentication middleware to verify JWT tokens
 * 
 * @param req - The request object
 * @param res - The response object
 * @param next - The next middleware function
 */
export async function authenticateToken(req: any, res: any, next: Function) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Missing token.'
      });
    }
    
    try {
      const decoded = verifyToken(token);
      req.user = decoded; // Add user info to request
      next();
    } catch (error) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
}

/**
 * Authorization middleware to check user role
 * 
 * @param allowedRoles - Array of roles allowed to access the resource
 */
export function authorizeRoles(allowedRoles: string[]) {
  return (req: any, res: any, next: Function) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      if (allowedRoles.includes(req.user.role)) {
        next();
      } else {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: Insufficient permissions'
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false, 
        message: 'Authorization error'
      });
    }
  };
}
import { Service } from "encore.dev/service";
import { api } from "encore.dev/api";
import { extractTokenFromHeader, verifyToken } from '../utils/auth';

// Định nghĩa Service
export default new Service("auth-middleware");

// Interface cho context xác thực
interface AuthContext {
  userId: string;
  userRole: string;
}

/**
 * Hàm tiện ích để kiểm tra xác thực từ Authorization header
 */
export function extractAuthFromHeader(authorization?: string): AuthContext {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }
  
  const token = authorization.substring(7);
  try {
    const decoded = verifyToken(token);
    return {
      userId: decoded.userId,
      userRole: decoded.role
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Kiểm tra quyền truy cập dựa trên vai trò
 */
export function checkRoleAccess(userRole: string, allowedRoles: string[]) {
  if (!userRole || !allowedRoles.includes(userRole)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
}

// Lưu ý: Trong Encore, không sử dụng middleware trực tiếp
// Thay vào đó, tạo các hàm tiện ích để sử dụng trong API endpoints
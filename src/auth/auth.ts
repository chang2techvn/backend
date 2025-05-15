import { api } from "encore.dev/api";
import { getPrisma } from "../database/db";
import { TaskStatus } from "../tasks/tasks";
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  generateRefreshToken,
  createSafeUser,
  verifyToken
} from '../utils/auth';

// Define proper types for the Prisma User with relations
interface UserWithRelations {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  avatar: string | null;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
  tasks: {
    id: string;
    status: string;
    [key: string]: any;
  }[];
  memberOf: {
    id: string;
    userId: string;
    projectId: string;
    joinedAt: Date;
    project: {
      id: string;
      [key: string]: any;
    };
    [key: string]: any;
  }[];
}

// Types for our API
interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserDetail extends AuthUser {
  avatar: string | null;
  skills: string[];
  stats: UserStats;
}

interface UserStats {
  tasks: number;
  projects: number;
  completed: number;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest {
  name: string;
  email: string;
  password: string;
  role: string;
}

interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken?: string;
  expiresAt: string; // Changed to string for better JSON serialization
}

interface SuccessResponse {
  success: boolean;
  message: string;
}

interface RefreshTokenRequest {
  refreshToken: string;
}

// 4.1. POST /api/auth/login - Đăng nhập
export const login = api(
  { expose: true, method: "POST", path: "/api/auth/login" },
  async (request: LoginRequest): Promise<AuthResponse> => {
    const prisma = getPrisma();
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: request.email },
    });

    // Check if user exists
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Compare passwords
    const passwordValid = await comparePassword(request.password, user.password);
    if (!passwordValid) {
      throw new Error("Invalid email or password");
    }

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // Token expires in 1 day

    return {
      user: createSafeUser(user),
      token,
      refreshToken,
      expiresAt: expiresAt.toISOString()
    };
  }
);

// 4.2. POST /api/auth/signup - Đăng ký
export const signup = api(
  { expose: true, method: "POST", path: "/api/auth/signup" },
  async (request: SignupRequest): Promise<AuthResponse> => {
    const prisma = getPrisma();
    
    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: request.email },
    });

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Hash the password before saving
    const hashedPassword = await hashPassword(request.password);

    // Create the new user with hashed password
    const newUser = await prisma.user.create({
      data: {
        name: request.name,
        email: request.email,
        password: hashedPassword,
        role: request.role,
        skills: [],
      },
    });

    // Generate tokens
    const tokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    };
    
    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // Token expires in 1 day

    return {
      user: createSafeUser(newUser),
      token,
      refreshToken,
      expiresAt: expiresAt.toISOString()
    };
  }
);

// 4.3. GET /api/auth/me - Lấy thông tin người dùng hiện tại
export const getCurrentUser = api(
  { expose: true, method: "GET", path: "/api/auth/me" },
  async (params: { userId: string }): Promise<UserDetail> => {
    const prisma = getPrisma();
    
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get tasks for this user
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: params.userId
      }
    });

    // Get project memberships for this user
    const projectMembers = await prisma.projectMember.findMany({
      where: {
        userId: params.userId
      },
      include: {
        project: true
      }
    });

    // Calculate user stats
    const completedTasks = tasks.filter(task => task.status === TaskStatus.DONE).length;
    const projectCount = projectMembers.length;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      skills: user.skills,
      stats: {
        tasks: tasks.length,
        projects: projectCount,
        completed: completedTasks,
      },
    };
  }
);

// 4.4. POST /api/auth/logout - Đăng xuất
export const logout = api(
  { expose: true, method: "POST", path: "/api/auth/logout" },
  async (): Promise<SuccessResponse> => {
    // In a real application with a token repository, we would invalidate the token
    // For this implementation, we'll assume client-side token removal
    return {
      success: true,
      message: "Logged out successfully",
    };
  }
);

// 4.5. POST /api/auth/refresh - Làm mới token
export const refreshToken = api(
  { expose: true, method: "POST", path: "/api/auth/refresh" },
  async (request: RefreshTokenRequest): Promise<AuthResponse> => {
    try {
      // Verify the refresh token
      const decoded = verifyToken(request.refreshToken);
      
      // Get user from database to ensure they still exist and have correct permissions
      const prisma = getPrisma();
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });
      
      if (!user) {
        throw new Error("User not found");
      }
      
      // Generate new tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role
      };
      
      const newToken = generateToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 1);
      
      return {
        user: createSafeUser(user),
        token: newToken,
        refreshToken: newRefreshToken,
        expiresAt: expiresAt.toISOString()
      };
    } catch (error) {
      throw new Error("Invalid or expired refresh token");
    }
  }
);
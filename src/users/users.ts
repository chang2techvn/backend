import { api } from "encore.dev/api";
import { getPrisma } from "../database/db";
import { TaskStatus } from "../tasks/tasks";

// Types for our API responses and requests
interface UserBasic {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  skills: string[];
}

interface UserDetail extends UserBasic {
  email: string;
  stats: UserStats;
}

interface UserList {
  users: UserBasic[];
}

interface UserStats {
  tasks: number;
  projects: number;
  completed: number;
}

interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: string;
  skills: string[];
}

interface UpdateUserRequest {
  name?: string;
  role?: string;
}

interface UpdateSkillsRequest {
  skills: string[];
}

interface AvatarUpdateRequest {
  avatarBase64: string; // Base64 encoded image string
}

// 1.1. GET /api/users - Lấy danh sách tất cả người dùng
export const getAllUsers = api(
  { expose: true, method: "GET", path: "/api/users" },
  async (): Promise<UserList> => {
    const prisma = getPrisma();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        avatar: true,
        skills: true,
      },
    });

    return { users };
  }
);

// 1.2. GET /api/users/:id - Lấy thông tin chi tiết người dùng
export const getUserById = api(
  { expose: true, method: "GET", path: "/api/users/:id" },
  async ({ id }: { id: string }): Promise<UserDetail> => {
    const prisma = getPrisma();
    
    // Get the basic user information
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        skills: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get user's tasks
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: id
      },
      select: {
        id: true,
        status: true,
      }
    });

    // Get user's project memberships
    const projectMembers = await prisma.projectMember.findMany({
      where: {
        userId: id
      },
      select: {
        project: {
          select: {
            id: true,
          }
        }
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

// 1.3. POST /api/users - Tạo người dùng mới
export const createUser = api(
  { expose: true, method: "POST", path: "/api/users" },
  async (request: CreateUserRequest): Promise<UserDetail> => {
    const prisma = getPrisma();
    
    // Create the new user
    const newUser = await prisma.user.create({
      data: {
        name: request.name,
        email: request.email,
        password: request.password, // In a real application, should hash this password
        role: request.role,
        skills: request.skills,
      },
    });

    // Return the created user with stats
    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      avatar: newUser.avatar,
      skills: newUser.skills,
      stats: {
        tasks: 0,
        projects: 0,
        completed: 0,
      },
    };
  }
);

// 1.4. PUT /api/users/:id - Cập nhật thông tin người dùng
export const updateUser = api(
  { expose: true, method: "PUT", path: "/api/users/:id" },
  async ({ id, ...request }: { id: string } & UpdateUserRequest): Promise<UserDetail> => {
    const prisma = getPrisma();
    
    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(request.name && { name: request.name }),
        ...(request.role && { role: request.role }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        skills: true,
      },
    });
    
    // Get user's tasks
    const tasks = await prisma.task.findMany({
      where: { assigneeId: id },
      select: { id: true, status: true }
    });

    // Get user's project memberships
    const projectMembers = await prisma.projectMember.findMany({
      where: { userId: id },
      select: { project: { select: { id: true } } }
    });

    // Calculate user stats
    const completedTasks = tasks.filter(task => task.status === TaskStatus.DONE).length;
    const projectCount = projectMembers.length;

    return {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      skills: updatedUser.skills,
      stats: {
        tasks: tasks.length,
        projects: projectCount,
        completed: completedTasks,
      },
    };
  }
);

// 1.5. PATCH /api/users/:id/skills - Cập nhật kỹ năng của người dùng
export const updateUserSkills = api(
  { expose: true, method: "PATCH", path: "/api/users/:id/skills" },
  async ({ id, skills }: { id: string } & UpdateSkillsRequest): Promise<Pick<UserBasic, "id" | "name" | "skills">> => {
    const prisma = getPrisma();
    
    // Update the user's skills
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        skills,
      },
      select: {
        id: true,
        name: true,
        skills: true,
      },
    });

    return updatedUser;
  }
);

// 1.6. PATCH /api/users/:id/avatar - Cập nhật avatar người dùng (using Base64)
export const updateUserAvatar = api(
  { expose: true, method: "PATCH", path: "/api/users/:id/avatar" },
  async ({ id, avatarBase64 }: { id: string } & AvatarUpdateRequest): Promise<Pick<UserBasic, "id" | "avatar">> => {
    const prisma = getPrisma();
    
    // Check if the provided string is a valid Base64 image
    if (!avatarBase64 || !avatarBase64.startsWith('data:image/')) {
      throw new Error("Invalid image format. Please provide a valid Base64 encoded image.");
    }

    // In a production app, you might want to add more validation here:
    // - Check file size limit
    // - Verify image dimensions
    // - Clean/sanitize the Base64 data
    
    // Update the avatar with the Base64 string
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        avatar: avatarBase64,
      },
      select: {
        id: true,
        avatar: true,
      },
    });

    return updatedUser;
  }
);

// 1.7. GET /api/users/:id/stats - Lấy thống kê người dùng
export const getUserStats = api(
  { expose: true, method: "GET", path: "/api/users/:id/stats" },
  async ({ id }: { id: string }): Promise<UserStats> => {
    const prisma = getPrisma();
    
    // Get user's tasks
    const tasks = await prisma.task.findMany({
      where: { assigneeId: id },
      select: { id: true, status: true }
    });

    // Get user's project memberships
    const projectMembers = await prisma.projectMember.findMany({
      where: { userId: id },
      select: { project: { select: { id: true } } }
    });

    if (tasks.length === 0 && projectMembers.length === 0) {
      const userExists = await prisma.user.findUnique({
        where: { id },
        select: { id: true }
      });
      
      if (!userExists) {
        throw new Error("User not found");
      }
    }

    // Calculate user stats
    const completedTasks = tasks.filter(task => task.status === TaskStatus.DONE).length;
    const projectCount = projectMembers.length;

    return {
      tasks: tasks.length,
      projects: projectCount,
      completed: completedTasks,
    };
  }
);
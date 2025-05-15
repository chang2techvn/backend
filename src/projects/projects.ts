import { api } from "encore.dev/api";
import { getPrisma } from "../database/db";
import { TaskStatus } from "../tasks/tasks";

// Types for our API responses and requests
interface ProjectBasic {
  id: string;
  name: string;
  description: string | null;  // Updated to allow null values
  createdAt: Date;
  taskCount: number;
  members: string[];
}

interface ProjectDetail extends ProjectBasic {
  // Additional detail fields can be added here if needed
}

interface ProjectList {
  projects: ProjectBasic[];
}

interface CreateProjectRequest {
  name: string;
  description: string;
}

interface UpdateProjectRequest {
  name?: string;
  description?: string;
}

interface AddMemberRequest {
  userId: string;
}

interface SuccessResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
  };
}

interface TaskList {
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;  // Updated to allow null values
    status: TaskStatus;
    assignee: {
      id: string;
      name: string;
    } | null;
    dueDate: Date | null;
  }>;
}

interface MemberList {
  members: Array<{
    id: string;
    name: string;
    role: string;
    avatar: string | null;
  }>;
}

// 2.1. GET /api/projects - Lấy tất cả dự án
export const getAllProjects = api(
  { expose: true, method: "GET", path: "/api/projects" },
  async (): Promise<ProjectList> => {
    const prisma = getPrisma();
    
    // Get projects without includes first
    const projects = await prisma.project.findMany();
    
    // Process each project to get related data
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        // Get tasks for this project
        const tasks = await prisma.task.findMany({
          where: { projectId: project.id },
          select: { id: true }
        });
        
        // Get members for this project
        const members = await prisma.projectMember.findMany({
          where: { projectId: project.id },
          select: { userId: true }
        });
        
        return {
          id: project.id,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          taskCount: tasks.length,
          members: members.map((member: { userId: string }) => member.userId),
        };
      })
    );

    return {
      projects: projectsWithDetails
    };
  }
);

// 2.2. GET /api/projects/:id - Lấy thông tin chi tiết dự án
export const getProjectById = api(
  { expose: true, method: "GET", path: "/api/projects/:id" },
  async ({ id }: { id: string }): Promise<ProjectDetail> => {
    const prisma = getPrisma();
    
    // Get project basic information
    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      throw new Error("Project not found");
    }
    
    // Get tasks for this project
    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      select: { id: true }
    });
    
    // Get members for this project
    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
      select: { userId: true }
    });

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      taskCount: tasks.length,
      members: members.map((member: { userId: string }) => member.userId),
    };
  }
);

// 2.3. POST /api/projects - Tạo dự án mới
export const createProject = api(
  { expose: true, method: "POST", path: "/api/projects" },
  async (request: CreateProjectRequest): Promise<ProjectDetail> => {
    const prisma = getPrisma();
    
    const newProject = await prisma.project.create({
      data: {
        name: request.name,
        description: request.description,
      },
    });

    return {
      id: newProject.id,
      name: newProject.name,
      description: newProject.description,
      createdAt: newProject.createdAt,
      taskCount: 0,
      members: [],
    };
  }
);

// 2.4. PUT /api/projects/:id - Cập nhật thông tin dự án
export const updateProject = api(
  { expose: true, method: "PUT", path: "/api/projects/:id" },
  async ({ id, ...request }: { id: string } & UpdateProjectRequest): Promise<ProjectDetail> => {
    const prisma = getPrisma();
    
    // Update the project
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...(request.name && { name: request.name }),
        ...(request.description && { description: request.description }),
      }
    });
    
    // Get tasks for this project
    const tasks = await prisma.task.findMany({
      where: { projectId: id },
      select: { id: true }
    });
    
    // Get members for this project
    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
      select: { userId: true }
    });

    return {
      id: updatedProject.id,
      name: updatedProject.name,
      description: updatedProject.description,
      createdAt: updatedProject.createdAt,
      taskCount: tasks.length,
      members: members.map((member: { userId: string }) => member.userId),
    };
  }
);

// 2.5. DELETE /api/projects/:id - Xóa dự án
export const deleteProject = api(
  { expose: true, method: "DELETE", path: "/api/projects/:id" },
  async ({ id }: { id: string }): Promise<SuccessResponse> => {
    const prisma = getPrisma();
    
    await prisma.project.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Project deleted successfully",
    };
  }
);

// 2.6. GET /api/projects/:id/tasks - Lấy tất cả nhiệm vụ trong dự án
export const getProjectTasks = api(
  { expose: true, method: "GET", path: "/api/projects/:id/tasks" },
  async ({ id }: { id: string }): Promise<TaskList> => {
    const prisma = getPrisma();
    
    const tasks = await prisma.task.findMany({
      where: {
        projectId: id,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status as TaskStatus,
        assignee: task.assignee,
        dueDate: task.dueDate,
      })),
    };
  }
);

// 2.7. GET /api/projects/:id/members - Lấy danh sách thành viên dự án
export const getProjectMembers = api(
  { expose: true, method: "GET", path: "/api/projects/:id/members" },
  async ({ id }: { id: string }): Promise<MemberList> => {
    const prisma = getPrisma();
    
    const members = await prisma.projectMember.findMany({
      where: {
        projectId: id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            avatar: true,
          },
        },
      },
    });

    return {
      members: members.map(member => ({
        id: member.user.id,
        name: member.user.name,
        role: member.user.role,
        avatar: member.user.avatar,
      })),
    };
  }
);

// 2.8. POST /api/projects/:id/members - Thêm người dùng vào dự án
export const addProjectMember = api(
  { expose: true, method: "POST", path: "/api/projects/:id/members" },
  async ({ id, userId }: { id: string } & AddMemberRequest): Promise<SuccessResponse> => {
    const prisma = getPrisma();
    
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Add the user to the project
    await prisma.projectMember.create({
      data: {
        userId: userId,
        projectId: id,
      },
    });

    return {
      success: true,
      message: "User added to project",
      user: {
        id: user.id,
        name: user.name,
      },
    };
  }
);

// 2.9. DELETE /api/projects/:id/members/:userId - Xóa người dùng khỏi dự án
export const removeProjectMember = api(
  { expose: true, method: "DELETE", path: "/api/projects/:id/members/:userId" },
  async ({ id, userId }: { id: string, userId: string }): Promise<SuccessResponse> => {
    const prisma = getPrisma();
    
    // Find the member first
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        userId: userId,
        projectId: id,
      }
    });

    if (!projectMember) {
      throw new Error("Project member not found");
    }

    // Delete the member using the id
    await prisma.projectMember.delete({
      where: {
        id: projectMember.id
      },
    });

    return {
      success: true,
      message: "User removed from project",
    };
  }
);
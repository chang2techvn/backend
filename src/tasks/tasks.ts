import { api } from "encore.dev/api";
import { getPrisma } from "../database/db";

// Define our own TaskStatus enum instead of importing from Prisma
export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
}

// Types for our API
interface TaskBasic {
  id: string;
  title: string;
  description: string | null; // Updated to allow null values
  status: TaskStatus;
  assignee?: {
    id: string;
    name: string;
  } | null;
  dueDate: Date | null;
  projectId: string;
}

interface TaskDetail extends TaskBasic {
  createdAt: Date;
  updatedAt: Date;
}

interface TaskList {
  tasks: TaskBasic[];
}

interface CreateTaskRequest {
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null;
  dueDate: string | null;
  projectId: string;
}

interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assigneeId?: string | null;
  dueDate?: string | null;
  projectId?: string;
}

interface UpdateTaskStatusRequest {
  status: TaskStatus;
  projectId: string;
}

interface SuccessResponse {
  success: boolean;
  message: string;
}

// 3.1. GET /api/tasks?projectId=:projectId - Lấy tất cả nhiệm vụ trong dự án
export const getAllTasks = api(
  { expose: true, method: "GET", path: "/api/tasks" },
  async ({ projectId }: { projectId?: string }): Promise<TaskList> => {
    const prisma = getPrisma();
    
    const tasks = await prisma.task.findMany({
      where: {
        ...(projectId && { projectId }),
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
        projectId: task.projectId,
      })),
    };
  }
);

// 3.2. GET /api/tasks/:id - Lấy thông tin chi tiết nhiệm vụ
export const getTaskById = api(
  { expose: true, method: "GET", path: "/api/tasks/:id" },
  async ({ id }: { id: string }): Promise<TaskDetail> => {
    const prisma = getPrisma();
    
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status as TaskStatus,
      assignee: task.assignee,
      dueDate: task.dueDate,
      projectId: task.projectId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
);

// 3.3. POST /api/tasks - Tạo nhiệm vụ mới
export const createTask = api(
  { expose: true, method: "POST", path: "/api/tasks" },
  async (request: CreateTaskRequest): Promise<TaskDetail> => {
    const prisma = getPrisma();
    
    // Parse date if provided
    const dueDate = request.dueDate ? new Date(request.dueDate) : null;

    const newTask = await prisma.task.create({
      data: {
        title: request.title,
        description: request.description,
        status: request.status,
        assigneeId: request.assigneeId,
        dueDate,
        projectId: request.projectId,
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
      id: newTask.id,
      title: newTask.title,
      description: newTask.description,
      status: newTask.status as TaskStatus,
      assignee: newTask.assignee,
      dueDate: newTask.dueDate,
      projectId: newTask.projectId,
      createdAt: newTask.createdAt,
      updatedAt: newTask.updatedAt,
    };
  }
);

// 3.4. PUT /api/tasks/:id - Cập nhật thông tin nhiệm vụ
export const updateTask = api(
  { expose: true, method: "PUT", path: "/api/tasks/:id" },
  async ({ id, ...request }: { id: string } & UpdateTaskRequest): Promise<TaskDetail> => {
    const prisma = getPrisma();
    
    // Parse date if provided
    const dueDate = request.dueDate ? new Date(request.dueDate) : undefined;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(request.title && { title: request.title }),
        ...(request.description && { description: request.description }),
        ...(request.status && { status: request.status }),
        ...(request.assigneeId !== undefined && { assigneeId: request.assigneeId }),
        ...(dueDate !== undefined && { dueDate }),
        ...(request.projectId && { projectId: request.projectId }),
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
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      status: updatedTask.status as TaskStatus,
      assignee: updatedTask.assignee,
      dueDate: updatedTask.dueDate,
      projectId: updatedTask.projectId,
      createdAt: updatedTask.createdAt,
      updatedAt: updatedTask.updatedAt,
    };
  }
);

// 3.5. PATCH /api/tasks/:id/status - Cập nhật trạng thái nhiệm vụ
export const updateTaskStatus = api(
  { expose: true, method: "PATCH", path: "/api/tasks/:id/status" },
  async ({ id, status, projectId }: { id: string } & UpdateTaskStatusRequest): Promise<Partial<TaskDetail>> => {
    const prisma = getPrisma();
    
    // Verify project exists and task belongs to project
    const task = await prisma.task.findFirst({
      where: {
        id,
        projectId,
      },
    });

    if (!task) {
      throw new Error("Task not found or doesn't belong to specified project");
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
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
      id: updatedTask.id,
      title: updatedTask.title,
      status: updatedTask.status as TaskStatus,
      assignee: updatedTask.assignee,
      updatedAt: updatedTask.updatedAt,
    };
  }
);

// 3.6. DELETE /api/tasks/:id - Xóa nhiệm vụ
export const deleteTask = api(
  { expose: true, method: "DELETE", path: "/api/tasks/:id" },
  async ({ id }: { id: string }): Promise<SuccessResponse> => {
    const prisma = getPrisma();
    
    await prisma.task.delete({
      where: { id },
    });

    return {
      success: true,
      message: "Task deleted successfully",
    };
  }
);
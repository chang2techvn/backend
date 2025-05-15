import { getPrisma } from '../database/db';
import { hashPassword } from '../utils/auth';
import { TaskStatus } from '../tasks/tasks';

export async function seedDatabase() {
  const prisma = getPrisma();
  
  try {
    // Xóa dữ liệu hiện có để tránh trùng lặp
    await prisma.task.deleteMany({});
    await prisma.projectMember.deleteMany({});
    await prisma.project.deleteMany({});
    await prisma.user.deleteMany({});
    
    console.log('Database cleaned. Creating new data...');
    
    // Tạo users với mật khẩu đã mã hóa
    const alicePassword = await hashPassword('secure123');
    const bobPassword = await hashPassword('secure123');
    const charliePassword = await hashPassword('secure123');
    
    const alice = await prisma.user.create({
      data: {
        id: 'user-1',
        name: 'Alice Smith',
        email: 'alice@example.com',
        password: alicePassword,
        role: 'Product Manager',
        avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Alice',
        skills: ['Product', 'Management', 'Design'],
      },
    });
    
    const bob = await prisma.user.create({
      data: {
        id: 'user-2',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        password: bobPassword,
        role: 'Developer',
        avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Bob',
        skills: ['Frontend', 'React', 'TypeScript'],
      },
    });
    
    const charlie = await prisma.user.create({
      data: {
        id: 'user-3',
        name: 'Charlie Wang',
        email: 'charlie@example.com',
        password: charliePassword,
        role: 'Designer',
        avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Charlie',
        skills: ['UI', 'UX', 'Figma'],
      },
    });
    
    // Tạo dự án mẫu
    const frontendProject = await prisma.project.create({
      data: {
        id: 'proj-1',
        name: 'Frontend Architecture Refactor',
        description: 'Update the frontend architecture with modern patterns',
      },
    });
    
    const mobileProject = await prisma.project.create({
      data: {
        id: 'proj-2',
        name: 'Mobile App',
        description: 'Build a new mobile app with React Native',
      },
    });
    
    // Thêm thành viên vào dự án
    await prisma.projectMember.create({
      data: {
        userId: alice.id,
        projectId: frontendProject.id,
      },
    });
    
    await prisma.projectMember.create({
      data: {
        userId: bob.id,
        projectId: frontendProject.id,
      },
    });
    
    await prisma.projectMember.create({
      data: {
        userId: charlie.id,
        projectId: mobileProject.id,
      },
    });
    
    await prisma.projectMember.create({
      data: {
        userId: alice.id,
        projectId: mobileProject.id,
      },
    });
    
    // Tạo nhiệm vụ mẫu cho dự án Frontend
    const tasksList = [
      {
        id: 'task-101',
        title: 'Setup Zustand store',
        description: 'Create a global store using Zustand',
        status: TaskStatus.IN_PROGRESS,
        assigneeId: alice.id,
        projectId: frontendProject.id,
        dueDate: new Date('2025-05-20'),
      },
      {
        id: 'task-102',
        title: 'Build Table View',
        description: 'Create reusable table component',
        status: TaskStatus.DONE,
        assigneeId: bob.id,
        projectId: frontendProject.id,
        dueDate: new Date('2025-05-15'),
      },
      {
        id: 'task-103',
        title: 'Design System Implementation',
        description: 'Implement the new design system',
        status: TaskStatus.TODO,
        assigneeId: charlie.id,
        projectId: mobileProject.id,
        dueDate: new Date('2025-05-25'),
      },
    ];
    
    // Tạo tasks từ danh sách
    for (const taskData of tasksList) {
      await prisma.task.create({ 
        data: {
          id: taskData.id,
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          assigneeId: taskData.assigneeId,
          projectId: taskData.projectId,
          dueDate: taskData.dueDate,
        } 
      });
    }
    
    // Tạo thêm nhiều tasks cho Alice
    for (let i = 1; i <= 10; i++) {
      const status = i <= 5 ? TaskStatus.DONE : (i <= 8 ? TaskStatus.IN_PROGRESS : TaskStatus.TODO);
      const projectId = i % 2 === 0 ? frontendProject.id : mobileProject.id;
      const dueDate = new Date(`2025-06-${i < 10 ? '0' + i : i}`);
      
      await prisma.task.create({
        data: {
          title: `Task ${i}`,
          description: `Description for Task ${i}`,
          status: status,
          assigneeId: alice.id,
          projectId: projectId,
          dueDate: dueDate,
        },
      });
    }
    
    return {
      success: true,
      message: 'Database seeded successfully with sample data for the frontend team',
      data: {
        users: 3,
        projects: 2,
        tasks: tasksList.length + 10,
      }
    };
  } catch (error: any) {
    console.error('Error seeding database:', error);
    return {
      success: false,
      message: 'Failed to seed database',
      error: error?.message || 'Unknown error',
    };
  }
}
import { PrismaClient, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Use Prisma's enum instead of string constants
const TASK_STATUS = {
  TODO: TaskStatus.TODO,
  IN_PROGRESS: TaskStatus.IN_PROGRESS,
  DONE: TaskStatus.DONE,
};

async function main() {
  console.log('Starting to seed database...');

  // Clean up existing data
  await prisma.task.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Database cleaned. Creating new data...');

  // Create users
  const alice = await prisma.user.create({
    data: {
      id: 'user-1',
      name: 'Alice',
      email: 'alice@example.com',
      password: 'securepassword', // In a real app, this would be hashed
      role: 'Product Manager',
      avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Alice',
      skills: ['Product', 'Management', 'Design'],
    },
  });

  const bob = await prisma.user.create({
    data: {
      id: 'user-2',
      name: 'Bob',
      email: 'bob@example.com',
      password: 'securepassword',
      role: 'Developer',
      avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Bob',
      skills: ['JavaScript', 'React', 'TypeScript'],
    },
  });

  const charlie = await prisma.user.create({
    data: {
      id: 'user-3',
      name: 'Charlie',
      email: 'charlie@example.com',
      password: 'securepassword',
      role: 'Designer',
      avatar: 'https://api.dicebear.com/7.x/personas/svg?seed=Charlie',
      skills: ['UI', 'UX', 'Figma'],
    },
  });

  console.log('Created users:', { alice, bob, charlie });

  // Create projects
  const frontendProject = await prisma.project.create({
    data: {
      id: 'proj-1',
      name: 'Frontend Refactor',
      description: 'Complete refactor of the frontend architecture',
    },
  });

  const mobileProject = await prisma.project.create({
    data: {
      id: 'proj-2',
      name: 'Mobile App',
      description: 'Develop mobile app with React Native',
    },
  });

  console.log('Created projects:', { frontendProject, mobileProject });

  // Create project members
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

  console.log('Created project members');

  // Create tasks
  const task1 = await prisma.task.create({
    data: {
      id: 'task-101',
      title: 'Setup Zustand store',
      description: 'Implement global state for modal and current project',
      status: TASK_STATUS.IN_PROGRESS,
      assigneeId: alice.id,
      projectId: frontendProject.id,
      dueDate: new Date('2025-05-10'),
    },
  });

  const task2 = await prisma.task.create({
    data: {
      id: 'task-102',
      title: 'Build Table View',
      description: 'Use React Table to render task list with sorting',
      status: TASK_STATUS.TODO,
      assigneeId: bob.id,
      projectId: frontendProject.id,
      dueDate: new Date('2025-05-11'),
    },
  });

  const task3 = await prisma.task.create({
    data: {
      id: 'task-103',
      title: 'Design Mobile UI',
      description: 'Create UI designs for the mobile app',
      status: TASK_STATUS.DONE,
      assigneeId: charlie.id,
      projectId: mobileProject.id,
      dueDate: new Date('2025-05-05'),
    },
  });

  console.log('Created tasks:', { task1, task2, task3 });

  // Create more tasks for Alice to match the statistics mentioned in requirements
  const taskPromises = [];
  for (let i = 1; i <= 21; i++) {
    taskPromises.push(
      prisma.task.create({
        data: {
          title: `Additional Task ${i}`,
          description: `Description for additional task ${i}`,
          status: i <= 17 ? TASK_STATUS.DONE : TASK_STATUS.TODO,
          assigneeId: alice.id,
          projectId: i % 2 === 0 ? frontendProject.id : mobileProject.id,
          dueDate: new Date(`2025-05-${Math.min(i + 5, 30)}`),
        },
      })
    );
  }
  await Promise.all(taskPromises);

  // Add Alice to more projects to match the statistics
  const additionalProjects = [];
  for (let i = 3; i <= 5; i++) {
    const project = await prisma.project.create({
      data: {
        id: `proj-${i}`,
        name: `Additional Project ${i}`,
        description: `Description for additional project ${i}`,
      },
    });
    additionalProjects.push(project);

    await prisma.projectMember.create({
      data: {
        userId: alice.id,
        projectId: project.id,
      },
    });
  }

  console.log('Created additional data for Alice');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
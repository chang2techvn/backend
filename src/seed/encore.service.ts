import { api } from 'encore.dev/api';
import { seedDatabase } from './seed.js';

// API endpoint để seed dữ liệu mẫu
export const seed = api(
  {
    method: 'POST',
    path: '/api/seed',
    expose: true,
  },
  async () => {
    return await seedDatabase();
  }
);
import { api } from 'encore.dev/api';
import { Service } from 'encore.dev/service';
import { seedDatabase } from './seed.js';

// Define the Service resource for the seed service
export default new Service("seed");

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
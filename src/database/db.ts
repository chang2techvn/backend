import { PrismaClient } from '@prisma/client';

// Create a singleton Prisma client instance
let prismaInstance: PrismaClient | undefined;

export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    // Configure local database connection parameters
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || 'postgres';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'task-management-api';
    
    // When running in Encore, it will use the environment variables provided by Encore
    // For local development, construct a connection string from individual parts
    const connectionString = process.env.DATABASE_URL || 
      `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`;
    
    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: connectionString,
        },
      },
      log: ['error', 'warn'],
    });
    
    // Add connection validation for development
    if (process.env.NODE_ENV !== 'production') {
      // Mask password for logging
      const maskedUrl = connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
      console.log(`Connecting to database: ${maskedUrl}`);
      
      // Test connection
      prismaInstance.$connect()
        .then(() => console.log('✅ Database connection successful'))
        .catch((err) => {
          console.error('❌ Database connection failed:', err.message);
          console.error('Please check your database credentials and ensure PostgreSQL is running');
        });
    }
  }
  
  return prismaInstance;
}

// Helper function to close database connections
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = undefined;
    console.log('Database connection closed');
  }
}
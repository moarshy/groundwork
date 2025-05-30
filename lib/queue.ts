import { Queue, WorkerOptions } from 'bullmq';
import IORedis from 'ioredis';

const connectionString = process.env.REDIS_URL || 'redis://localhost:6379';

// Create a new connection instance if you need to pass options
// or if you want to reuse the connection for other Redis operations.
// For BullMQ, simply passing the connection string to Queue and Worker is often enough.
export const redisConnection = new IORedis(connectionString, {
  maxRetriesPerRequest: null, // Important for BullMQ
});

// Define your queue name
export const WORKFLOW_QUEUE_NAME = 'workflow-execution';

// Create a queue instance
export const workflowQueue = new Queue(WORKFLOW_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Number of times to retry a failed job
    backoff: {
      type: 'exponential',
      delay: 1000, // Initial delay in ms
    },
    removeOnComplete: { // Keep completed jobs for a while (e.g., 1 hour)
      age: 3600,
      count: 1000, // Or keep up to 1000 jobs
    },
    removeOnFail: { // Keep failed jobs for longer (e.g., 1 week)
        age: 24 * 3600 * 7,
    }
  },
});

// Log queue events (optional, but useful for debugging)
workflowQueue.on('error', err => {
  console.error(`BullMQ (${WORKFLOW_QUEUE_NAME}) queue error:`, err);
}); 
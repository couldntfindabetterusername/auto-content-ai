import { Worker } from 'bullmq';

const worker = new Worker(
  'content-calendar',
  async (job) => {
    console.log(`Job received: ${job.id}`);
    return { success: true };
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
  },
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

export default worker;

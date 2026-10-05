import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const REDIS_URL = process.env.REDIS_URL
const useR2 = Boolean(process.env.S3_BUCKET)

/**
 * Locally: Postgres only — events, workflows and files stay in-process/on disk.
 * In the cloud (REDIS_URL / S3_BUCKET set by Terraform + Secret Manager):
 * Upstash Redis for events + workflows, Cloudflare R2 for product images.
 */
const modules: Record<string, unknown>[] = []

if (REDIS_URL) {
  modules.push(
    {
      resolve: '@medusajs/medusa/event-bus-redis',
      options: { redisUrl: REDIS_URL },
    },
    {
      resolve: '@medusajs/medusa/workflow-engine-redis',
      options: { redis: { redisUrl: REDIS_URL } },
    }
  )
}

if (useR2) {
  modules.push({
    resolve: '@medusajs/medusa/file',
    options: {
      providers: [
        {
          resolve: '@medusajs/medusa/file-s3',
          id: 's3',
          options: {
            file_url: process.env.S3_FILE_URL, // https://media.tharam.in
            access_key_id: process.env.S3_ACCESS_KEY_ID,
            secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
            region: process.env.S3_REGION || 'auto',
            bucket: process.env.S3_BUCKET,
            endpoint: process.env.S3_ENDPOINT, // https://<account>.r2.cloudflarestorage.com
          },
        },
      ],
    },
  })
}

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Cloud SQL db-f1-micro allows ~25 connections: instances × pool ≤ 20.
    databaseDriverOptions: {
      pool: { min: 0, max: Number(process.env.DB_POOL_MAX || 6) },
    },
    ...(REDIS_URL ? { redisUrl: REDIS_URL } : {}),
    workerMode: (process.env.MEDUSA_WORKER_MODE as 'shared' | 'worker' | 'server') || 'shared',
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || 'supersecret',
      cookieSecret: process.env.COOKIE_SECRET || 'supersecret',
    },
  },
  admin: {
    backendUrl: process.env.ADMIN_BACKEND_URL || 'http://localhost:9000',
    disable: process.env.DISABLE_MEDUSA_ADMIN === 'true',
  },
  modules,
})

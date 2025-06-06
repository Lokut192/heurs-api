import 'dotenv/config';

import { DataSource } from 'typeorm';

export default new DataSource({
  type: (process.env.DB_TYPE as 'postgres' | undefined) || 'postgres',
  database: process.env.DB_NAME || 'heurs_api',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || 'heurs_api',
  password: process.env.DB_PASSWORD || 'heurs_api',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});

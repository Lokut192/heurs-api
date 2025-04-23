import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'sqlite',
  database: 'data/database.sqlite',
  entities: ['src/entities/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
});

import { NestFactory } from '@nestjs/core';

import { SeederModule } from './seeder.module';
import { SeederService } from './seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeederModule);
  const seeder = app.get(SeederService);
  await seeder.seed();
  await app.close();
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();

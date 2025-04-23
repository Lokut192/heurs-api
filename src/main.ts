import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  // App
  const app = await NestFactory.create(AppModule, {
    logger: ['debug', 'log', 'warn', 'error', 'verbose', 'fatal'],
  });

  // Logger
  const logger = new Logger('App');

  // Application port
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;

  // CORS rules
  app.enableCors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
    exposedHeaders: '*',
    credentials: true,
  });

  // Swagger
  const documentConfig = new DocumentBuilder()
    .setTitle('Overtiminator API')
    .setDescription('The Overtiminator API endpoints')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const documentFactory = () =>
    SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup('swagger', app, documentFactory, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Start application
  await app.listen(port);
  logger.log(`Server running on port ${port}`);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();

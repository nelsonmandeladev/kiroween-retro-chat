import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Enable CORS for development
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
    ],
    credentials: true,
  });

  // Note: Global validation is configured per-route due to bodyParser: false
  // This is required for Better-auth compatibility

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('RetroChat API')
    .setDescription(
      'API documentation for RetroChat - A nostalgic chat application with AI-powered message generation',
    )
    .setVersion('1.0')
    .addTag('Profile', 'User profile management endpoints')
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Messages', 'Messaging endpoints')
    .addTag('Friends', 'Friend management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

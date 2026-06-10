import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/infrastructure/filters/http-exception.filter';

const DEV_JWT_PREFIX = 'nhb-dev-';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const isProduction = process.env.NODE_ENV === 'production';

  // ── Production hardening ────────────────────────────────────
  if (isProduction) {
    const jwtSecret = process.env.JWT_SECRET ?? '';
    if (!jwtSecret || jwtSecret.startsWith(DEV_JWT_PREFIX)) {
      throw new Error(
        'JWT_SECRET must be set to a strong production value (not the dev default).',
      );
    }
    if (!process.env.CORS_ORIGIN) {
      throw new Error('CORS_ORIGIN must be set in production (comma-separated origins).');
    }
    // Behind Azure Container Apps / front door / nginx: trust the X-Forwarded-* headers
    // so req.ip / req.protocol reflect the real client (rate limiting + secure cookies).
    app.set('trust proxy', 1);
  }

  app.use(cookieParser());
  app.use(
    helmet({
      // Same-origin SPA: serving JS/CSS/etc. inline-free, but the React build needs
      // a few hashed assets. Tighten CSP later via M3 (security audit).
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  const corsOriginRaw = process.env.CORS_ORIGIN;
  const corsOrigin = corsOriginRaw
    ? corsOriginRaw.split(',').map((o) => o.trim()).filter(Boolean)
    : 'http://localhost:5173';
  app.enableCors({ origin: corsOrigin, credentials: true });

  app.setGlobalPrefix('api', { exclude: [] });

  // Swagger only in non-production. In production gate behind basic auth via az config if needed.
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('NHB Status Report API')
      .setDescription('API for project delivery management and status reporting for NHB')
      .setVersion('0.0.1')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    logger.log('Swagger UI mounted at /api/docs');
  }

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application listening on port ${port} (env=${process.env.NODE_ENV ?? 'development'})`);
}

bootstrap();

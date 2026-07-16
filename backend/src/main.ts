import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import * as morgan from 'morgan';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 5000;
  const frontendUrl = configService.get<string>('app.frontendUrl') || 'http://localhost:3000';

  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  app.use(helmet({
    crossOriginEmbedderPolicy: false,
  }));

  app.use(compression());

  if (configService.get('app.nodeEnv') !== 'production') {
    app.use(morgan('dev'));
  }

  // CORS_ORIGINS is a comma-separated allow-list; entries may end in `*` to
  // match a prefix, which is what Vercel preview deployments need.
  //
  // This was `origin: '*'`, landed as "temporarily" while chasing a preview
  // URL that would not connect. It is survivable — auth is a Bearer header,
  // not a cookie, so a hostile page cannot ride along on a session it does
  // not have — but it means any origin may call this API and read the reply,
  // and nothing here says which frontends are supposed to exist. Outside
  // production it stays open, because that is where the friction was.
  const corsOrigins = (configService.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const isProduction = configService.get('app.nodeEnv') === 'production';

  app.enableCors({
    origin: isProduction
      ? (origin, callback) => {
          // Same-origin and server-to-server requests send no Origin header.
          if (!origin) return callback(null, true);
          const allowed = corsOrigins.some((rule) =>
            rule.endsWith('*')
              ? origin.startsWith(rule.slice(0, -1))
              : origin === rule,
          );
          return allowed
            ? callback(null, true)
            : callback(new Error(`Origin not allowed by CORS: ${origin}`), false);
        }
      : true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: false,
  });

  if (isProduction && corsOrigins.length === 0) {
    // Refusing to boot beats booting with an API no browser can reach and no
    // obvious reason why.
    throw new Error(
      'CORS_ORIGINS is empty. Set it to the frontend origins that may call this API, ' +
        'comma-separated (a trailing * matches a prefix, e.g. https://nexus-*.vercel.app).',
    );
  }

  app.setGlobalPrefix('api', { exclude: [] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Nexus API')
    .setDescription(`
      ## Nexus — Advanced Freelance & Agency Management Platform

      A comprehensive platform connecting clients with freelancers and agencies.

      ### Features:
      - Multi-role authentication (Client, Freelancer, Agency Owner, Admin)
      - Project posting and bidding system with state machines
      - Contract management with escrow payments
      - Milestone-based deliverable tracking
      - Agency formation and management
      - Dispute resolution system
      - Reviews and ratings
      - Real-time notifications
    `)
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication & authorization')
    .addTag('Users', 'User profiles & freelancer management')
    .addTag('Projects', 'Project posting & management')
    .addTag('Bids', 'Bidding system')
    .addTag('Contracts', 'Contract lifecycle management')
    .addTag('Milestones', 'Milestone tracking & payments')
    .addTag('Payments', 'Wallet & payment management')
    .addTag('Agencies', 'Agency management')
    .addTag('Reviews', 'Reviews & ratings')
    .addTag('Disputes', 'Dispute resolution')
    .addTag('Notifications', 'Notification management')
    .addTag('Messages', 'Messaging system')
    .addTag('Statistics', 'Analytics & statistics')
    .addTag('Skills & Categories', 'Skills and categories')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  await app.listen(port);

  console.log(`\n🚀 Nexus API running on: http://localhost:${port}/api`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`🌍 Environment: ${configService.get('app.nodeEnv')}\n`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});

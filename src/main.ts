import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApplication } from './setup-application';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupApplication(app);

  await app.listen(process.env.PORT ?? 3000);

  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    app.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    app.close();
    process.exit(0);
  });
}
bootstrap();

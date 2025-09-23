import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';

export const setupApplication = (app: INestApplication) => {
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
};

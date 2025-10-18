import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { SES_CLIENT } from 'src/shared/gateways/ses.gateway';
import { setupApplication } from 'src/setup-application';
import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { S3_CLIENT } from 'src/shared/gateways/s3.gateway';

export const createTestModule = async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(SES_CLIENT)
    .useValue({
      send: jest.fn().mockImplementation(() =>
        Promise.resolve({
          $metadata: { httpStatusCode: 200 },
        }),
      ),
    })
    .overrideProvider(S3_CLIENT)
    .useValue({
      send: jest.fn().mockImplementation(() =>
        Promise.resolve({
          $metadata: { httpStatusCode: 200 },
        }),
      ),
    })
    .compile();
  return moduleFixture;
};

export const setupTestApp = async (moduleFixture: TestingModule) => {
  const app = moduleFixture.createNestApplication();
  setupApplication(app);
  await app.init();
  return app;
};

export const clearDatabase = async (app: INestApplication) => {
  const dataSource = app.get(DataSource);

  try {
    // Disable foreign key checks temporarily
    // await dataSource.query('SET session_replication_role = replica;');

    // Get all table names from the database
    const tables = await dataSource.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%' 
      AND tablename != 'migrations'
    `);

    // Clear all tables
    for (const table of tables) {
      const tableName = (table as { tablename: string }).tablename;
      try {
        await dataSource.query(
          `TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`,
        );
      } catch (_error) {
        // If truncate fails, try delete
        try {
          await dataSource.query(`DELETE FROM "${tableName}";`);
        } catch (deleteError) {
          // Ignore delete errors for tables that might not exist
          console.warn(
            `Could not clear table ${tableName}:`,
            (deleteError as Error).message,
          );
        }
      }
    }

    // Re-enable foreign key checks
    // await dataSource.query('SET session_replication_role = DEFAULT;');
  } catch (error) {
    console.warn('Error clearing database:', (error as Error).message);
    // Continue with tests even if clearing fails
  }
};

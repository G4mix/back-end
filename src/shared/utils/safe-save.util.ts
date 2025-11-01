import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  RequestTimeoutException,
} from '@nestjs/common';
import { DeepPartial, QueryFailedError, Repository } from 'typeorm';

export async function safeSave<T extends object>(
  repository: Repository<T>,
  data: DeepPartial<T>,
  options: { ignoreErrors?: boolean } = { ignoreErrors: false },
): Promise<T> {
  const entity = repository.create(data);

  try {
    return await repository.save(entity);
  } catch (error) {
    if (options.ignoreErrors) return undefined as unknown as T;
    if (error instanceof QueryFailedError) {
      const code = (error as any)?.driverError?.code;

      const handlers = {
        NOT_FOUND: () => {
          throw new NotFoundException(
            `${repository.metadata.name.toUpperCase()}_NOT_FOUND`,
          );
        },
        ALREADY_EXISTS: () => {
          throw new ConflictException(
            `${repository.metadata.name.toUpperCase()}_ALREADY_EXISTS`,
          );
        },
        INVALID_DATA: () => {
          throw new BadRequestException('INVALID_DATA');
        },
        TRANSACTION_CONFLICT: () => {
          throw new ConflictException('TRANSACTION_CONFLICT');
        },
        QUERY_TIMEOUT: () => {
          throw new RequestTimeoutException('QUERY_TIMEOUT');
        },
      };

      const PG_ERROR_MAP: Record<string, keyof typeof handlers> = {
        '23503': 'NOT_FOUND',
        '23505': 'ALREADY_EXISTS',
        '23502': 'INVALID_DATA',
        '22001': 'INVALID_DATA',
        '23514': 'INVALID_DATA',
        '22007': 'INVALID_DATA',
        '22P02': 'INVALID_DATA',
        '40001': 'TRANSACTION_CONFLICT',
        '57014': 'QUERY_TIMEOUT',
      };

      const throwError = handlers[PG_ERROR_MAP[code]];
      if (throwError) throwError();
    }

    throw new InternalServerErrorException('DATABASE_ERROR');
  }
}

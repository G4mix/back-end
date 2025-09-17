import { Controller, Get, Logger, Version } from '@nestjs/common';
import { LogResponseTime } from 'src/shared/decorators/log-response-time.decorator';
import { Protected } from 'src/shared/decorators/protected.decorator';

@Controller('/')
export class GetHealthStatusController {
  readonly logger = new Logger(this.constructor.name);

  @Get('/health')
  @Version('1')
  @Protected()
  @LogResponseTime()
  getHealthStatus(): { status: string } {
    return { status: 'ok' };
  }
}

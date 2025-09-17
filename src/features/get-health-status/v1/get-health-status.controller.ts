import { Controller, Get, Logger, Version } from '@nestjs/common';
import { LogResponseTime } from 'src/shared/decorators/log-response-time.decorator';

@Controller('/')
export class GetHealthStatusController {
  readonly logger = new Logger(this.constructor.name);

  @Get('/health')
  @Version('1')
  @LogResponseTime()
  getHealthStatus(): { status: string } {
    return { status: 'ok' };
  }
}

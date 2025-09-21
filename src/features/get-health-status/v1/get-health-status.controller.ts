import { Controller, Get, Logger, Version } from '@nestjs/common';

@Controller('/')
export class GetHealthStatusController {
  readonly logger = new Logger(this.constructor.name);

  @Get('/health')
  @Version('1')
  getHealthStatus(): { status: string } {
    return { status: 'ok' };
  }
}

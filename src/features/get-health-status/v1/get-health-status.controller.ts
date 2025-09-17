import { Controller, Get, Version } from '@nestjs/common';
import { Protected } from 'src/shared/decorators/protected.decorator';

@Controller('/')
export class GetHealthStatusController {
  @Get('/health')
  @Version('1')
  @Protected()
  getHealthStatus(): { status: string } {
    return { status: 'ok' };
  }
}

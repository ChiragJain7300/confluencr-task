import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
            status: 'HEALTHY',
            current_time: '2024-01-15T10:30:00Z',
          },
        },
      })
      getHealth() {
        return {
            status: 'HEALTHY',
            current_time: new Date().toISOString()
        };
      }

}

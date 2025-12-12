import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { AppConfig, appConfig } from './config/app.config';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(appConfig.KEY)
    private readonly appConfig: AppConfig
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

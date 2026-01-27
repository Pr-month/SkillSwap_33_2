import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from './config/app.config';
import { JwtConfig, jwtConfig } from './config/jwt.config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig, dbConfig } from './config/db.config';
import { CategoriesModule } from './categories/categories.module';
import { FilesModule } from './files/files.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SkillsModule } from './skills/skills.module';
import { RequestsModule } from './requests/requests.module';
import { NotificationModule } from './notification/notification.module';
import { HelmetMiddleware } from './common/middleware/helmet.middleware';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, dbConfig],
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [jwtConfig.KEY],
      useFactory: (config: JwtConfig) => ({
        secret: config.accessToken,
        signOptions: {
          expiresIn: config.accessExpiresIn as JwtSignOptions['expiresIn'],
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [dbConfig.KEY],
      useFactory: (config: DatabaseConfig) => ({
        ...config,
        autoLoadEntities: true,
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),
    UsersModule,
    AuthModule,
    CategoriesModule,
    FilesModule,
    SkillsModule,
    RequestsModule,
    ...(process.env.NODE_ENV !== 'test' ? [NotificationModule] : []),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    if (process.env.NODE_ENV === 'test') {
      consumer
        .apply(HelmetMiddleware)
        .forRoutes({ path: '*', method: RequestMethod.ALL });
    } else {
      consumer
        .apply(HelmetMiddleware, CsrfMiddleware)
        .forRoutes({ path: '*', method: RequestMethod.ALL });
    }
  }
}

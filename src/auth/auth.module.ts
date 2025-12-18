
@Module({
  imports: [PassportModule, UsersModule,     TypeOrmModule.forFeature([RefreshToken]),],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtRefreshStrategy,
    JwtAccessStrategy,
    JwtService,
    ConfigService,
  ],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConsoleOtpProvider } from './otp/console-otp.provider';
import { OTP_PROVIDER } from './otp/otp-provider.interface';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '7d') as any },
      }),
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // Swap this provider for a real SMS/Zalo ZNS vendor implementation once
    // credentials are available — nothing else in the app needs to change.
    { provide: OTP_PROVIDER, useClass: ConsoleOtpProvider },
  ],
  exports: [JwtModule],
})
export class AuthModule {}

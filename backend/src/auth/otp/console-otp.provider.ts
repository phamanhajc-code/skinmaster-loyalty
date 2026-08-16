import { Injectable, Logger } from '@nestjs/common';
import { OtpProvider } from './otp-provider.interface';

/**
 * Dev-only OTP provider — logs the code instead of sending a real SMS/ZNS.
 * Replace with a real provider (see otp-provider.interface.ts) before going
 * live; nothing else in the auth flow needs to change.
 */
@Injectable()
export class ConsoleOtpProvider implements OtpProvider {
  private readonly logger = new Logger('OTP');

  async send(phone: string, code: string): Promise<void> {
    this.logger.warn(
      `[DEV OTP] gửi tới ${phone}: mã xác thực là ${code} (đây là provider giả lập — cấu hình OTP_PROVIDER + API key thật khi triển khai production)`,
    );
  }
}

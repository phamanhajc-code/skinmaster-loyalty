import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { OTP_PROVIDER } from './otp/otp-provider.interface';
import type { OtpProvider } from './otp/otp-provider.interface';

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, '');
}

function randomOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @Inject(OTP_PROVIDER) private readonly otpProvider: OtpProvider,
  ) {}

  async adminLogin(email: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email } });
    if (!admin) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: admin.id,
      type: 'admin',
      role: admin.role,
    });

    return {
      accessToken,
      admin: { id: admin.id, fullName: admin.fullName, email: admin.email, role: admin.role },
    };
  }

  async requestOtp(rawPhone: string) {
    const phone = normalizePhone(rawPhone);
    const customer = await this.prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      throw new NotFoundException(
        'Số điện thoại chưa có trong hệ thống thành viên. Vui lòng liên hệ Skinmaster để được hỗ trợ.',
      );
    }

    const code = randomOtpCode();
    const codeHash = await bcrypt.hash(code, 10);
    const ttlSeconds = Number(this.config.get('OTP_TTL_SECONDS') ?? 300);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await this.prisma.customerOtp.create({
      data: { customerId: customer.id, phone, codeHash, expiresAt },
    });

    await this.otpProvider.send(phone, code);

    return { message: 'Đã gửi mã OTP', expiresInSeconds: ttlSeconds };
  }

  async verifyOtp(rawPhone: string, code: string) {
    const phone = normalizePhone(rawPhone);
    const otp = await this.prisma.customerOtp.findFirst({
      where: { phone, consumed: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) {
      throw new UnauthorizedException('Mã OTP không đúng hoặc đã hết hạn');
    }

    const valid = await bcrypt.compare(code, otp.codeHash);
    if (!valid) {
      throw new UnauthorizedException('Mã OTP không đúng hoặc đã hết hạn');
    }

    await this.prisma.customerOtp.update({ where: { id: otp.id }, data: { consumed: true } });

    const customer = await this.prisma.customer.findUnique({ where: { phone } });
    if (!customer) {
      throw new NotFoundException('Không tìm thấy khách hàng');
    }

    const accessToken = await this.jwtService.signAsync({ sub: customer.id, type: 'customer' });

    return { accessToken, customer };
  }
}

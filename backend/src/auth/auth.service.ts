import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { Prisma, Role, type User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto, RegisterDto } from './auth.dto.js';

const BCRYPT_ROUNDS = 12;
// Hash giả để email không tồn tại vẫn tốn thời gian như email có thật
const DUMMY_HASH = bcrypt.hashSync('khong-phai-mat-khau-that', BCRYPT_ROUNDS);

function toPublicUser(user: User) {
  return { id: user.id, email: user.email, fullName: user.fullName, role: user.role };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      // Vai trò cố định là học viên, không nhận từ yêu cầu
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          role: Role.STUDENT,
        },
      });
      return this.issueSession(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email đã được sử dụng');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const passwordMatches = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !passwordMatches) {
      // Cùng một thông báo để không lộ email nào đã đăng ký
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    return this.issueSession(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return toPublicUser(user);
  }

  private async issueSession(user: User) {
    const token = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { token, user: toPublicUser(user) };
  }
}

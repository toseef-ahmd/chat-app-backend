import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../user/dto/create-user.dto/create-user.dto';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/auth-login/auth-login';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  // This method is used to sign up a user
  async signup(signup: CreateUserDto): Promise<string> {
    const hash: string = await this.hashPassword(signup.password);

    signup.password = hash;
    const user = await this.userService.create(signup);

    if (!user) {
      throw new NotFoundException('Failed to create user');
    }

    const payload = { username: user.username, sub: user._id };

    const access_token = await this.jwtService.signAsync(payload);
    return access_token;
  }

  // This method is used to log in a user
  async login(loginDto: LoginDto): Promise<string> {
    const user = await this.userService.findUserByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid Email');
    }

    const hash = await this.hashPassword(loginDto.password);

    if (user.password !== hash) {
      throw new UnauthorizedException('Invalid password');
    }

    const payload = { username: user.username, sub: user._id };

    const access_token = await this.jwtService.signAsync(payload);
    return access_token;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { Wallet } from '../wallets/wallet.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  private readonly logger = new Logger(UsersService.name);

  async create(dto: CreateUserDto): Promise<User> {
    const emailExists = await this.usersRepository.findOne({
      where: { email: dto.email },
    });

    this.logger.log(`Cadastrando usuário: ${dto.email}.`);

    if (emailExists) {
      throw new BadRequestException('Email já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.dataSource.transaction(async manager => {
      const user = manager.create(User, {
        name: dto.name,
        email: dto.email,
        password: passwordHash,
      });

      await manager.save(user);

      const wallet = manager.create(Wallet, {
        user,
        balance: 0,
      });

      await manager.save(wallet);
      this.logger.log(`Usuário ${dto.email} criado com sucesso.`);
      return user;
    });
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

}

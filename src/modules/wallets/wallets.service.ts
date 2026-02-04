import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wallet } from './wallet.entity';

@Injectable()
export class WalletsService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
  ) {}

  private readonly logger = new Logger(WalletsService.name);

  async getWalletByUser(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!wallet) {
      throw new NotFoundException('Carteira não encontrada para este usuário.');
    }
    this.logger.log(`Carteira do usuário ${userId} encontrada com sucesso.`);
    return wallet;
  }

  async unblockWallet(userId: string): Promise<void> {
    const wallet = await this.walletRepository.findOne({
      where: { user: { id: userId } },
    });

    if (!wallet) {
      throw new NotFoundException('Carteira não encontrada.');
    }

    if (!wallet.blocked) {
      throw new BadRequestException('Carteira não está bloqueada.');
    }

    wallet.blocked = false;
    await this.walletRepository.save(wallet);
    this.logger.log(`Carteira do usuário ${userId} desbloqueada com sucesso.`);
  }
} 
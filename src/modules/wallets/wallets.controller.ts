import { Controller, Get, UseGuards, Request, NotFoundException, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalletsService } from './wallets.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Wallets')
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @ApiOperation({ summary: 'Busca o saldo da carteira do usuário logado.' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('balance')
  async getBalance(@Request() req) {
    const wallet = await this.walletsService.getWalletByUser(req.user.id);

    if (!wallet) {
      throw new NotFoundException('Carteira não encontrada.');
    }

    return {
      userId: req.user.id,
      balance: Number(wallet.balance), 
      isBlocked: wallet.blocked,
      currency: 'BRL',
    };
  }

  @ApiOperation({ summary: 'Desbloqueia a carteira do usuário logado.' })
  @UseGuards(JwtAuthGuard)
  @Patch('unblock')
  async unblock(@Request() req) {
    await this.walletsService.unblockWallet(req.user.id);
    return { message: 'Carteira desbloqueada com sucesso. Operações financeiras liberadas.' };
  }
}
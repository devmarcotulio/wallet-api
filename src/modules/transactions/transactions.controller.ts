
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { TransferDto } from './dto/transfer.dto';
import { DepositDto } from './dto/deposit.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @ApiOperation({ summary: 'Realiza uma transferência entre usuários.' })
  @UseGuards(JwtAuthGuard)
  @Post('transfer')
  async transfer(@Request() req, @Body() transferDto: TransferDto) {
    return this.transactionsService.transfer(req.user.id, transferDto);
  }

  @ApiOperation({ summary: 'Realiza um depósito na carteira do usuário.' })
  @UseGuards(JwtAuthGuard)
  @Post('deposit')
  async deposit(@Request() req, @Body() depositDto: DepositDto) {
    return this.transactionsService.deposit(req.user.id, depositDto);
  }

  @ApiOperation({ summary: 'Reverte a última transferência realizada.' })
  @UseGuards(JwtAuthGuard)
  @Post('reverse-last')
  async reverseLast(@Request() req) {
    return this.transactionsService.reverseLastTransfer(req.user.id);
  }
}
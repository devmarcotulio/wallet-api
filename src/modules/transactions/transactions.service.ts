import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Wallet } from '../wallets/wallet.entity';
import { Transaction, TransactionType, TransactionStatus } from './transaction.entity';
import { TransferDto } from './dto/transfer.dto';
import { DepositDto } from './dto/deposit.dto';

@Injectable()
export class TransactionsService {
  constructor(private dataSource: DataSource) {}

  private readonly logger = new Logger(TransactionsService.name);

  async transfer(fromUserId: string, transferDto: TransferDto) {
    const { toUserId, amount } = transferDto;
    this.logger.log(`Iniciando transferência de R$${amount} do usuário ${fromUserId} para o usuário ${toUserId}.`);

    if (fromUserId === toUserId) {
      throw new BadRequestException('Você não pode transferir para si mesmo.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const fromWallet = await queryRunner.manager.findOne(Wallet, {
        where: { user: { id: fromUserId } },
        lock: { mode: 'pessimistic_write' },
      });

      const toWallet = await queryRunner.manager.findOne(Wallet, {
        where: { user: { id: toUserId } },
        lock: { mode: 'pessimistic_write' },
      });

      if (!fromWallet || !toWallet) {
        throw new BadRequestException('Carteira de origem ou destino não encontrada.');
      }

      if (fromWallet.blocked || toWallet.blocked) {
        throw new BadRequestException('Carteira de origem ou destino se encontra bloqueada para essa transação.');
      }

      const currentFromBalance = Number(fromWallet.balance);
      const currentToBalance = Number(toWallet.balance);

      if (currentFromBalance < amount) {
        throw new BadRequestException('Saldo insuficiente.');
      }

      fromWallet.balance = currentFromBalance - amount;
      toWallet.balance = currentToBalance + amount;

      await queryRunner.manager.save(fromWallet);
      await queryRunner.manager.save(toWallet);

      const transaction = queryRunner.manager.create(Transaction, {
        type: TransactionType.TRANSFER,
        amount,
        fromWallet,
        toWallet,
        status: TransactionStatus.SUCCESS,
      });

      await queryRunner.manager.save(transaction);
      await queryRunner.commitTransaction();

      this.logger.log(`Transferência de R$${amount} do usuário ${fromUserId} para o usuário ${toUserId} concluída com sucesso.`);
      return { 
        message: 'Transferência concluída com sucesso', 
        newBalance: fromWallet.balance 
      };

    } catch (err) {
      this.logger.error(`Erro ao processar transferência: ${err.message}`);
      await queryRunner.rollbackTransaction();
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Erro ao processar transferência.');
    } finally {
      await queryRunner.release();
    }
  }

  async deposit(userId: string, depositDto: DepositDto) {
    const { amount } = depositDto;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    this.logger.log(`Iniciando depósito de R$${amount} para o usuário ${userId}.`);

    try {
      const wallet = await queryRunner.manager.findOne(Wallet, {
        where: { user: { id: userId } },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        throw new BadRequestException('Carteira não encontrada.');
      }

      if (wallet.blocked) {
        throw new BadRequestException('Sua carteira está bloqueada para essa transação.');
      }

      if (Number(wallet.balance) < 0) {
        throw new BadRequestException(
          'Carteira com saldo negativo. Depósito bloqueado.',
        );
      }

      wallet.balance = Number(wallet.balance) + amount;
      await queryRunner.manager.save(wallet);

      const transaction = queryRunner.manager.create(Transaction, {
        type: TransactionType.DEPOSIT,
        amount,
        toWallet: wallet,
        status: TransactionStatus.SUCCESS,
      });

      await queryRunner.manager.save(transaction);

      await queryRunner.commitTransaction();
      this.logger.log(`Depósito de R$${amount} para o usuário ${userId} concluído com sucesso.`);
      return { 
        message: 'Depósito realizado com sucesso', 
        newBalance: wallet.balance 
      };

    } catch (err) {
      this.logger.error(`Erro ao processar depósito: ${err.message}`);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async reverseLastTransfer(userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    this.logger.log(`Iniciando reversão da última transferência para o usuário ${userId}.`);

    try {
      const lastTransaction = await queryRunner.manager.findOne(Transaction, {
        where: { 
          fromWallet: { user: { id: userId } },
          type: TransactionType.TRANSFER,
          status: TransactionStatus.SUCCESS 
        },
        order: { createdAt: 'DESC' },
        relations: ['fromWallet', 'toWallet'],
      });

      if (!lastTransaction) {
        throw new BadRequestException('Nenhuma transferência encontrada para reverter.');
      }

      const { fromWallet, toWallet, amount } = lastTransaction;

      const walletPayer = await queryRunner.manager.findOne(Wallet, {
        where: { id: fromWallet.id },
        lock: { mode: 'pessimistic_write' },
      });
      const walletReceiver = await queryRunner.manager.findOne(Wallet, {
        where: { id: toWallet.id },
        lock: { mode: 'pessimistic_write' },
      });

      walletPayer.balance = Number(walletPayer.balance) + Number(amount);
      walletReceiver.balance = Number(walletReceiver.balance) - Number(amount);

      walletPayer.blocked = true;

      await queryRunner.manager.save(walletPayer);
      await queryRunner.manager.save(walletReceiver);

      lastTransaction.status = TransactionStatus.REVERSED;
      await queryRunner.manager.save(lastTransaction);

      const reversalEntry = queryRunner.manager.create(Transaction, {
        type: TransactionType.REVERSAL,
        amount,
        fromWallet: toWallet,
        toWallet: fromWallet,
        status: TransactionStatus.SUCCESS,
      });
      await queryRunner.manager.save(reversalEntry);

      await queryRunner.commitTransaction();
      this.logger.log(`Reversão da última transferência para o usuário ${userId} concluída com sucesso.`);
      return { message: 'Transferência revertida com sucesso', reversalId: reversalEntry.id };

    } catch (err) {
      this.logger.error(`Erro ao reverter transferência: ${err.message}`);
      await queryRunner.rollbackTransaction();
      throw err instanceof BadRequestException ? err : new InternalServerErrorException('Falha ao reverter');
    } finally {
      await queryRunner.release();
    }
  }
}
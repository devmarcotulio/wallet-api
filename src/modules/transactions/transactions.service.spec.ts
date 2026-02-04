import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { DataSource } from 'typeorm';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { TransactionType, TransactionStatus } from './transaction.entity';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let dataSource: DataSource;

  const mockManager = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: mockManager,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockManager.findOne.mockReset();
    mockManager.save.mockReset();
  });

  describe('transfer', () => {
    const transferDto = { toUserId: 'user-receiver', amount: 100 };

    it('deve realizar uma transferência com sucesso', async () => {
      
      const fromWallet = { id: 'w1', balance: 500, blocked: false };
      const toWallet = { id: 'w2', balance: 200, blocked: false };

      mockManager.findOne
        .mockResolvedValueOnce(fromWallet) 
        .mockResolvedValueOnce(toWallet);  

      const result = await service.transfer('user-origin', transferDto);

      expect(result.message).toBe('Transferência concluída com sucesso');
      expect(fromWallet.balance).toBe(400); 
      expect(toWallet.balance).toBe(300);   
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('deve lançar erro se o saldo for insuficiente', async () => {
      mockManager.findOne.mockResolvedValueOnce({ id: 'w1', balance: 50, blocked: false });
      mockManager.findOne.mockResolvedValueOnce({ id: 'w2', balance: 0, blocked: false });

      await expect(service.transfer('user-origin', transferDto))
        .rejects.toThrow(BadRequestException);
      
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('deve impedir transferência se uma das carteiras estiver bloqueada', async () => {
      mockManager.findOne.mockResolvedValueOnce({ id: 'w1', balance: 1000, blocked: true });
      mockManager.findOne.mockResolvedValueOnce({ id: 'w2', balance: 100, blocked: false });

      await expect(service.transfer('user-origin', transferDto))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('reverseLastTransfer', () => {
    it('deve reverter e bloquear a carteira do pagador', async () => {
      
      const mockLastTransaction = {
        id: 't1',
        amount: 50,
        fromWallet: { id: 'w-origin' }, 
        toWallet: { id: 'w-dest' },
        status: TransactionStatus.SUCCESS
      };

      mockManager.findOne.mockResolvedValueOnce(mockLastTransaction);

      const walletPayer = { id: 'w-origin', balance: 100, blocked: false };
      const walletReceiver = { id: 'w-dest', balance: 100, blocked: false };
      
      mockManager.findOne
        .mockResolvedValueOnce(walletPayer)
        .mockResolvedValueOnce(walletReceiver);

      const result = await service.reverseLastTransfer('user-origin');

      expect(result.message).toContain('revertida com sucesso');
      expect(walletPayer.balance).toBe(150);
      expect(walletPayer.blocked).toBe(true);
      expect(mockLastTransaction.status).toBe(TransactionStatus.REVERSED);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });
});
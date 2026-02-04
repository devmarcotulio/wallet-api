import { Test, TestingModule } from '@nestjs/testing';
import { WalletsService } from './wallets.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Wallet } from './wallet.entity';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('WalletsService', () => {
  let service: WalletsService;
  let repository: Repository<Wallet>;

  const mockWalletRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletsService,
        {
          provide: getRepositoryToken(Wallet),
          useValue: mockWalletRepository,
        },
      ],
    }).compile();

    service = module.get<WalletsService>(WalletsService);
    repository = module.get<Repository<Wallet>>(getRepositoryToken(Wallet));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWalletByUser', () => {
    it('deve retornar uma carteira se o usuário existir', async () => {
      const mockWallet = { id: '1', balance: '100.00', blocked: false } as unknown as Wallet;
      mockWalletRepository.findOne.mockResolvedValue(mockWallet);

      const result = await service.getWalletByUser('user-id');

      expect(result).toEqual(mockWallet);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { user: { id: 'user-id' } },
      });
    });

    it('deve lançar NotFoundException se a carteira não for encontrada', async () => {
      mockWalletRepository.findOne.mockResolvedValue(null);

      await expect(service.getWalletByUser('invalid-id'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('unblockWallet', () => {
    it('deve desbloquear a carteira com sucesso', async () => {
      const mockWallet = { id: '1', blocked: true } as Wallet;
      mockWalletRepository.findOne.mockResolvedValue(mockWallet);
      mockWalletRepository.save.mockResolvedValue({ ...mockWallet, blocked: false });

      await service.unblockWallet('user-id');

      expect(mockWallet.blocked).toBe(false);
      expect(repository.save).toHaveBeenCalledWith(mockWallet);
    });

    it('deve lançar BadRequestException se a carteira já estiver desbloqueada', async () => {
      const mockWallet = { id: '1', blocked: false } as Wallet;
      mockWalletRepository.findOne.mockResolvedValue(mockWallet);

      await expect(service.unblockWallet('user-id'))
        .rejects.toThrow(BadRequestException);
      
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se a carteira não existir no unblock', async () => {
      mockWalletRepository.findOne.mockResolvedValue(null);

      await expect(service.unblockWallet('user-id'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
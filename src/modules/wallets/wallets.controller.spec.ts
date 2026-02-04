import { Test, TestingModule } from '@nestjs/testing';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { NotFoundException } from '@nestjs/common';

describe('WalletsController', () => {
  let controller: WalletsController;
  let service: WalletsService;

  const mockWalletsService = {
    getWalletByUser: jest.fn(),
    unblockWallet: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [
        {
          provide: WalletsService,
          useValue: mockWalletsService,
        },
      ],
    }).compile();

    controller = module.get<WalletsController>(WalletsController);
    service = module.get<WalletsService>(WalletsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('deve retornar os dados formatados da carteira do usuário', async () => {
      const userId = 'user-123';
      const mockRequest = { user: { id: userId } };
      const mockWalletResult = { balance: '500.50', blocked: false };

      mockWalletsService.getWalletByUser.mockResolvedValue(mockWalletResult);

      const result = await controller.getBalance(mockRequest);

      expect(result).toEqual({
        userId: userId,
        balance: 500.5,
        isBlocked: false,
        currency: 'BRL',
      });
      expect(service.getWalletByUser).toHaveBeenCalledWith(userId);
    });

    it('deve lançar NotFoundException quando o serviço retornar nulo', async () => {
      mockWalletsService.getWalletByUser.mockResolvedValue(null);
      const mockRequest = { user: { id: 'invalid-id' } };

      await expect(controller.getBalance(mockRequest)).rejects.toThrow(NotFoundException);
    });
  });

  describe('unblock', () => {
    it('deve chamar o serviço de desbloqueio e retornar mensagem de sucesso', async () => {
      const userId = 'user-123';
      const mockRequest = { user: { id: userId } };

      mockWalletsService.unblockWallet.mockResolvedValue(undefined);

      const result = await controller.unblock(mockRequest);

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('sucesso');
      expect(service.unblockWallet).toHaveBeenCalledWith(userId);
    });
  });
});
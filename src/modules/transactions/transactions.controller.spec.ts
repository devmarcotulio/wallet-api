import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransferDto } from './dto/transfer.dto';
import { DepositDto } from './dto/deposit.dto';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: TransactionsService;

  const mockTransactionsService = {
    transfer: jest.fn(),
    deposit: jest.fn(),
    reverseLastTransfer: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: mockTransactionsService,
        },
      ],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
    service = module.get<TransactionsService>(TransactionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockRequest = { user: { id: 'user-123' } };

  describe('transfer', () => {
    it('deve chamar o serviço de transferência com o ID do usuário logado', async () => {
      const dto: TransferDto = { toUserId: 'receiver-456', amount: 100 };
      const expectedResponse = { message: 'Sucesso', newBalance: 400 };
      
      mockTransactionsService.transfer.mockResolvedValue(expectedResponse);

      const result = await controller.transfer(mockRequest, dto);

      expect(service.transfer).toHaveBeenCalledWith('user-123', dto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('deposit', () => {
    it('deve chamar o serviço de depósito com os dados corretos', async () => {
      const dto: DepositDto = { amount: 50 };
      const expectedResponse = { message: 'Depositado', newBalance: 550 };

      mockTransactionsService.deposit.mockResolvedValue(expectedResponse);

      const result = await controller.deposit(mockRequest, dto);

      expect(service.deposit).toHaveBeenCalledWith('user-123', dto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('reverseLast', () => {
    it('deve chamar o serviço de reversão para o usuário logado', async () => {
      const expectedResponse = { message: 'Revertido', reversalId: 'rev-001' };

      mockTransactionsService.reverseLastTransfer.mockResolvedValue(expectedResponse);

      const result = await controller.reverseLast(mockRequest);

      expect(service.reverseLastTransfer).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(expectedResponse);
    });
  });
});
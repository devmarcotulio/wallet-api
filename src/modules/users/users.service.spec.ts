import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any;
  let dataSource: any;

  const mockManager = {
    create: jest.fn().mockImplementation((entity, data) => data),
    save: jest.fn().mockResolvedValue(true),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn().mockImplementation((cb) => cb(mockManager)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    it('deve criar um usuário e uma carteira com sucesso', async () => {
      
      userRepository.findOne.mockResolvedValue(null);
      
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_password' as never);

      const result = await service.create(createUserDto);

      expect(userRepository.findOne).toHaveBeenCalled();
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(mockManager.save).toHaveBeenCalledTimes(2);
      expect(result.email).toBe(createUserDto.email);
      expect(result.password).toBe('hashed_password');
    });

    it('deve lançar BadRequestException se o email já estiver cadastrado', async () => {

      userRepository.findOne.mockResolvedValue({ id: '1', email: 'john@example.com' });

      await expect(service.create(createUserDto))
        .rejects.toThrow(BadRequestException);
      
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('findByEmail', () => {
    it('deve retornar um usuário ao buscar por email', async () => {
      const mockUser = { id: '1', email: 'test@test.com' };
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@test.com');

      expect(result).toEqual(mockUser);
    });
  });
});
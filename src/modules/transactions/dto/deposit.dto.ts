import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class DepositDto {
  @ApiProperty({ example: 100.50, description: 'Valor do depósito' })
  @IsNumber()
  @IsPositive()
  amount: number;
}
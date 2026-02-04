import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsUUID, IsPositive } from 'class-validator';

export class TransferDto {
  @ApiProperty({ example: 'uuid-do-destinatario', description: 'ID do usuário que receberá o valor' })
  @IsUUID()
  toUserId: string;

  @ApiProperty({ example: 100.50, description: 'Valor da transferência' })
  @IsNumber()
  @IsPositive()
  amount: number;
}
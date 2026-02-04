import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Nome do usuário' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'email@email.com', description: 'Email do usuário' })
  @IsEmail()
  email: string;
  
  @ApiProperty({ example: 'senha123', description: 'Senha do usuário' })
  @MinLength(6)
  password: string;
}

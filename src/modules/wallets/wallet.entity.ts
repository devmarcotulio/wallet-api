import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "../users/user.entity";

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', default: 0 })
  balance: number;

  @Column({ default: false })
  blocked: boolean;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;
}
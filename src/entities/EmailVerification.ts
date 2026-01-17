import { Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Player } from './Player';

@Entity('email_verifications')
@Unique(['code'])
export class EmailVerification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
  playerId!: number;

  @Column({ unique: true })
  @Index()
  code!: string;

  @Column({ default: false })
  isUsed!: boolean;

  @Column({ type: 'datetime' })
  expiresAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  verifiedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playerId' })
  player!: Player;
}

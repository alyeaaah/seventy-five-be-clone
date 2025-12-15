import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Player } from './Player';

@Entity('player_review') // Change table name as needed
export class PlayerReview {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  player_uuid!: string;

  @Column()
  sender_uuid!: string;

  @Column("double", { name: "rating" })
  rating: number | null = null;

  @Column({ type: 'text' })
  review!: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string | null = null;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at?: Date;

  @Column()
  updated_by?: string;

  @Column()
  deleted_at?: Date;

  @ManyToOne(() => Player, (player) => player.playerReview)
  @JoinColumn({ name: 'player_uuid', referencedColumnName: 'uuid' })
  player: Player | undefined;

  @ManyToOne(() => Player, (player) => player.reviewedBy)
  @JoinColumn({ name: 'sender_uuid', referencedColumnName: 'uuid' })
  reviewedBy: Player | undefined;
}

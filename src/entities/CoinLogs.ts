import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum CoinStatusEnum {
  IN = "IN",
  OUT = "OUT",
}
export enum CoinSourceEnum {
  MATCH = "MATCH",
  ORDER = "ORDER",
  REWARD = "REWARD",
  KUDOS = "KUDOS",
}
  

@Entity("coin_logs")
export class CoinLogs {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column("uuid", {
    name: "uuid",
    generated: "uuid",
    default: "uuid_generate_v4()",
  })
  uuid: string = "uuid_generate_v4()";

  @Column({ type: "varchar", nullable: true })
  player_uuid: string | undefined;

  @Column()
  coin: number = 0;

  @Column({ type: "enum", enum: CoinStatusEnum, default: CoinStatusEnum.IN })
  status: CoinStatusEnum = CoinStatusEnum.IN;

  @Column({ type: "enum", enum: CoinSourceEnum, default: CoinSourceEnum.MATCH })
  source: CoinSourceEnum = CoinSourceEnum.MATCH;

  @Column({ type: "varchar", nullable: true })
  ref_uuid: string | undefined;
  
  @Column()
  before: number = 0;

  @Column()
  after: number = 0;

  @Column({ type: "varchar", nullable: true })
  createdBy: string | undefined;

  @Column({ type: "varchar", nullable: true })
  deletedBy: string | undefined;

  @Column({ type: "timestamp" })
  deletedAt: Date | null = null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date = new Date();

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date = new Date();
}

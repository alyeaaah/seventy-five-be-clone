import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn
} from "typeorm";

export enum PointStatusEnum {
  IN = "IN",
  OUT = "OUT",
}
export enum PointSourceEnum {
  MATCH = "MATCH",
  ORDER = "ORDER",
  REWARD = "REWARD",
  KUDOS = "KUDOS",
}
  

@Entity("point_logs")
export class PointLogs {
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
  point: number = 0;

  @Column({ type: "enum", enum: PointStatusEnum, default: PointStatusEnum.IN })
  status: PointStatusEnum = PointStatusEnum.IN;

  @Column({ type: "enum", enum: PointSourceEnum, default: PointSourceEnum.MATCH })
  source: PointSourceEnum = PointSourceEnum.MATCH;

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

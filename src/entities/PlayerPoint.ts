
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
  } from "typeorm";
  
  @Entity("player_match_point")
  export class PlayerMatchPoint {
    @PrimaryGeneratedColumn()
    id: number | undefined;
  
    @Column("uuid", {
      name: "uuid",
      generated: "uuid",
      default: "uuid_generate_v4()",
    })
    uuid: string = "uuid_generate_v4()";
  
    @Column()
    tournament_uuid: string = "";

    @Column()
    match_uuid: string = "";

    @Column()
    player_uuid: string = "";
  
    @Column()
    round: number = 0;

    @Column()
    point: number = 0;

    @Column()
    coin: number = 0;

    @Column()
    match_point_uuid: string = "";

    @Column()
    tournament_match_point_uuid: string = "";
  
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
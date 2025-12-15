import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany
  } from "typeorm";
import { Player } from "./Player";
import { Tournament } from "./Tournament";
  
  @Entity("levels")
  export class Levels {
    @PrimaryGeneratedColumn()
    id: number | undefined;
  
    @Column("uuid", {
      name: "uuid",
      generated: "uuid",
      default: "uuid_generate_v4()",
    })
    uuid: string = "uuid_generate_v4()";
  
    @Column()
    name: string = "";

    @Column()
    level_tier: number = 0;
  
    @Column({ type: "varchar", nullable: true })
    createdBy: string | undefined;
  
    @Column({ type: "varchar", nullable: true })
    deletedBy: string | undefined | null;
  
    @Column({ type: "datetime", nullable: true })
    deletedAt: Date | undefined | null;
  
    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date = new Date();
  
    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date = new Date();

    @OneToMany(() => Player, (player) => player.level_uuid)
    player: Player[] | undefined;

    @OneToMany(() => Tournament, (tournament) => tournament.level_uuid)
    tournament: Tournament[] | undefined;
  }
  
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
  } from "typeorm";
import { Player } from "./Player";
import { League } from "./League";

  @Entity("player_logs")
  export class PlayerLog {
    @PrimaryGeneratedColumn()
    id: number | undefined;
  
    @Column()
    player_uuid: string = "";
  
    @Column()
    league_id: number = 0;

    @Column()
    description: string = "";
  
    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date = new Date();
  
    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date = new Date();

    @ManyToOne(() => Player, (player) => player.playerLog)
    @JoinColumn({ name: 'player_uuid', referencedColumnName: 'uuid' })
    player: Player | undefined;

    @ManyToOne(() => League, (league) => league.playerLogs)
    @JoinColumn({ name: 'league_id', referencedColumnName: 'id' })
    league: League | undefined;
  }
  
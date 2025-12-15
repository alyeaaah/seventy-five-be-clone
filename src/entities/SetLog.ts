import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
    ManyToOne,
    JoinColumn
  } from "typeorm";
import { Game } from "./Game";
  
  @Entity("set_logs")
  export class SetLog {
    @PrimaryGeneratedColumn()
    id: number | undefined;
  
    @Column("uuid", {
      name: "uuid",
      generated: "uuid",
      default: "uuid_generate_v4()",
    })
    uuid: string = "uuid_generate_v4()";
    
    @Column()
    set_uuid: string = "";
  
    @Column()
    home_team_score: number = 0;
  
    @Column()
    away_team_score: number = 0;

    @Column()
    gameHistory: string = "";
  
    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date = new Date();
  
    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date = new Date();

    @ManyToOne(() => Game, (game) => game.set)
    @JoinColumn({ name: 'set_uuid', referencedColumnName: 'uuid' })
    set: Game | undefined;
  }
  
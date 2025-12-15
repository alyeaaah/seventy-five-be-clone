import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
  } from "typeorm";
  import { Tournament } from "./Tournament";
  import { PlayerTeam } from "./PlayerTeam";
  import { Team } from "./Team";
import { SetLog } from "./SetLog";
import { Matches } from "./Matches";
  
  export enum GameStatus {
    PENDING = "pending",
    LIVE = "live",
    FINISHED = "finished",
  }
  
  @Entity("sets")
  export class Game {
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
    type: string = "";
    
    @Column()
    set: number = 0;
  
    @Column()
    home_team_score: number = 0;
  
    @Column()
    away_team_score: number = 0;

    @Column()
    winner_team_uuid: string = "";

    @Column()
    gameHistory: string = "";
  
    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date = new Date();
  
    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date = new Date();

    @ManyToOne(() => Team, (team) => team.uuid)
    @JoinColumn({ name: 'winner_team_uuid', referencedColumnName: 'uuid' })
    winnerTeam: Team | undefined;

    @ManyToOne(() => Matches, (match) => match.sets)
    @JoinColumn({ name: 'match_uuid', referencedColumnName: 'uuid' })
    matches: Matches[] | undefined;

    @OneToMany(() => SetLog, (setLog) => setLog.set)
    setLogs: SetLog[] | undefined;

  }
  
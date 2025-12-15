import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany,
    OneToOne
  } from "typeorm";
import { Tournament } from "./Tournament";
import { PlayerTeam } from "./PlayerTeam";
import { Matches } from "./Matches";
import { MatchHistories } from "./MatchHistories";
import { TournamentGroupTeam } from "./TournamentGroupTeams";
  
  @Entity("teams")
  export class Team {
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
    name: string = "";
    
    @Column()
    alias: string = "";
  
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

    @ManyToOne(() => Tournament, (tournament) => tournament.uuid)
    @JoinColumn({ name: 'tournament_uuid', referencedColumnName: 'uuid' })
    tournament: Tournament | undefined;

    @OneToMany(() => PlayerTeam, (playerTeam) => playerTeam.team)
    players: PlayerTeam[] | undefined;

    @OneToMany(() => Matches, (matches) => matches.home_team)
    home_matches: Team[] | undefined;

    @OneToMany(() => Matches, (matches) => matches.away_team)
    away_matches: Team[] | undefined;

    @OneToMany(() => Matches, (matches) => matches.winner)
    winner_matches: Team[] | undefined;

    @OneToMany(() => MatchHistories, (matchHistories) => matchHistories.team)
    matchHistories: MatchHistories[] | undefined;

    @OneToOne(() => TournamentGroupTeam, (tournamentGroupTeam) => tournamentGroupTeam.team)
    tournamentGroupTeam: TournamentGroupTeam | undefined;
  }
  
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany
  } from "typeorm";
import { Tournament } from "./Tournament";
import { PlayerTeam } from "./PlayerTeam";
import { Matches } from "./Matches";
import { MatchHistories } from "./MatchHistories";
import { TournamentGroup } from "./TournamentGroups";
  
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
  
    // Tournament Group related fields (merged from TournamentGroupTeam)
    @Column({ type: "varchar", nullable: true })
    group_uuid: string | null = null;

    @Column({ type: "int", nullable: true, default: 0 })
    matches_won: number = 0;

    @Column({ type: "int", nullable: true, default: 0 })
    games_won: number = 0;

    @Column({ type: "int", nullable: true, default: 0 })
    point: number = 0;

    @Column({ type: "int", nullable: true, default: 0 })
    matches_played: number = 0;
  
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

    @ManyToOne(() => TournamentGroup, (group) => group.teams, { nullable: true })
    @JoinColumn({ name: 'group_uuid', referencedColumnName: 'group_uuid' })
    group: TournamentGroup | undefined;

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

  }
  
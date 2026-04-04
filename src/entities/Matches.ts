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
import { Team } from "./Team";
import { Game } from "./Game";
import { CourtFields } from "./CourtFields";
import { GalleryAlbum } from "./GalleryAlbum";
import { PointConfig } from "./PointConfig";
import { MatchHistories } from "./MatchHistories";
import { BlogContent } from "./BlogContents";
import { PlayerKudos } from "./PlayerKudos";
import { TournamentGroup } from "./TournamentGroups";

export enum MatchStatus {
  UPCOMING = "UPCOMING",
  ONGOING = "ONGOING",
  PAUSED = "PAUSED",
  ENDED = "ENDED",
}

@Entity("matches")
export class Matches {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column("uuid", {
    name: "uuid",
    generated: "uuid",
    default: "uuid_generate_v4()",
  })
  uuid: string = "uuid_generate_v4()";

@Column({nullable: true})
  tournament_uuid: string = "";

  @Column()
  home_team_uuid: string = "";

  @Column()
  away_team_uuid: string = "";

  @Column()
  winner_team_uuid: string = "";

  // only in group stage, and null if in knockout stage
  @Column({nullable: true})
  tournament_group_index?: number;

  @Column({ nullable: true })
  group_uuid: string | null = null;

  // index of prev group stage if in knockout stage
  @Column({nullable: true})
  home_group_index?: number;

  // position of team in prev group stage if in knockout if in knockout
  @Column({nullable: true})
  home_group_position?: number;

  // UUID of prev group stage for home team if in knockout
  @Column({nullable: true})
  home_group_uuid?: string;

  // index of prev group stage
  @Column({nullable: true})
  away_group_index?: number;

  // position of team in prev group stage
  @Column({nullable: true})
  away_group_position?: number;

  // UUID of prev group stage for away team if in knockout
  @Column({nullable: true})
  away_group_uuid?: string;

  @Column()
  court_field_uuid: string | null = null;

  @Column({nullable: true})
  point_config_uuid: string = "";

  @Column()
  home_team_score: number = 0;

  @Column()
  away_team_score: number = 0;
  
  @Column({ type: "json", nullable: true })
  game_scores: Record<string, any> | null = null;

  // null if in group stage
  @Column({ type: "int", nullable: true })
  round?: number | null = null;

  // null if in group stage
  @Column({type: "int", nullable: true})
  seed_index?: number | null = null;

  @Column()
  with_ad: boolean = false;

  @Column({ type: "varchar", nullable: true })
  youtube_url: string = "";

  @Column()
  category: string = "";

  @Column({ type: "timestamp", nullable: true })
  time: Date | undefined;

  @Column({nullable: true})
  notes?: string = "";

  @Column()
  status: MatchStatus = MatchStatus.UPCOMING;

  @Column({ 
    type: "int", 
    default: 6,
    comment: "Number of games/sets needed to win the match"
  })
  race_to: number = 6;

  @Column()
  draft_pick: boolean = false;

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
  @JoinColumn({ name: "tournament_uuid", referencedColumnName: "uuid" })
  tournament: Tournament | undefined;

  @ManyToOne(() => Team, (team) => team.home_matches)
  @JoinColumn({ name: 'home_team_uuid', referencedColumnName: 'uuid' })
  home_team: Team | undefined;

  @ManyToOne(() => Team, (team) => team.away_matches)
  @JoinColumn({ name: 'away_team_uuid', referencedColumnName: 'uuid' })
  away_team: Team | undefined;

  @ManyToOne(() => Team, (team) => team.winner_matches)
  @JoinColumn({ name: 'winner_team_uuid', referencedColumnName: 'uuid' })
  winner: Team | undefined;

  @OneToMany(() => Game, (game) => game.matches)
  @JoinColumn({ name: 'uuid', referencedColumnName: 'match_uuid' })
  sets: Game[] | undefined;

  @ManyToOne(() => CourtFields, (field) => field.uuid)
  @JoinColumn({ name: "court_field_uuid", referencedColumnName: "uuid" })
  court_field: CourtFields | undefined;

  @OneToMany(() => GalleryAlbum, (galleryAlbum) => galleryAlbum.match_uuid)
  galleryAlbums: GalleryAlbum[] | undefined;

  @ManyToOne(() => PointConfig, (field) => field.uuid)
  @JoinColumn({ name: "point_config_uuid", referencedColumnName: "uuid" })
  point_config: PointConfig | undefined;

  @ManyToOne(() => TournamentGroup)
  @JoinColumn({ name: "group_uuid", referencedColumnName: "group_uuid" })
  tournament_group: TournamentGroup | undefined;

  @OneToMany(() => MatchHistories, (matchHistories) => matchHistories.matches)
  matchHistories: MatchHistories[] | undefined;

  @OneToMany(() => BlogContent, (blogContents) => blogContents.match)
  blogContents: BlogContent[] | undefined;

  @OneToMany(() => PlayerKudos, (playerKudos) => playerKudos.matches)
  player_kudos: PlayerKudos[] | undefined;
}

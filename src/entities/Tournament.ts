import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  ManyToOne
} from "typeorm";
import { Rule } from "./Rule";
import { TournamentSponsors } from "./TournamentSponsors";
import { PlayerTeam } from "./PlayerTeam";
import { Courts } from "./Courts";
import { Levels } from "./Levels";
import { PointConfig } from "./PointConfig";
import { GalleryAlbum } from "./GalleryAlbum";
import { BlogContent } from "./BlogContents";
import { League } from "./League";
import { TournamentGroup } from "./TournamentGroups";

export enum statusTournamentEnum {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  POSTPONED = "POSTPONED",
  ONGOING = "ONGOING",
  ENDED = "ENDED",
  CANCELLED = "CANCELLED",
}

export enum typeTournamentEnum {
  KNOCKOUT = "KNOCKOUT",
  ROUND_ROBIN = "ROUND ROBIN",
  FRIENDLY_MATCH = "FRIENDLY MATCH",
}

@Entity("tournaments")
export class Tournament {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column("uuid", {
    name: "uuid",
    generated: "uuid",
    default: "uuid_generate_v4()",
  })
  uuid: string | undefined = "uuid_generate_v4()";

  @Column()
  name: string = "";

  @Column()
  description: string = "";

  @Column()
  media_url: string = "";

  @Column({ type: "enum", enum: statusTournamentEnum, nullable: true })  
  status: statusTournamentEnum = statusTournamentEnum.DRAFT;

  @Column({ type: "enum", enum: typeTournamentEnum, nullable: true })  
  type: typeTournamentEnum = typeTournamentEnum.KNOCKOUT; 

  @Column({ type: "datetime", nullable: true })
  start_date: Date | null = null;

  @Column({ type: "datetime", nullable: true })
  end_date: Date | null = null;

  @Column({ type: "varchar", nullable: true })
  court_uuid: string | undefined;

  @Column({ type: "boolean", nullable: true })
  strict_level: boolean | undefined;

  @Column({ type: "varchar", nullable: true })
  level_uuid: string | undefined;

  @Column({ type: "int", nullable: true })
  league_id: number | undefined;

  @Column({ type: "varchar", nullable: true })
  point_config_uuid: string | undefined;

  @Column({ type: "timestamp", nullable: true })
  featured_at: Date | undefined;

  @Column({ type: "int", nullable: true })
  total_group: number | undefined;

  @Column({ type: "timestamp", nullable: true })
  published_at: Date | null | undefined;

  @Column({ type: "varchar", nullable: true })
  createdBy: string | undefined;

  @Column({ type: "varchar", nullable: true })
  deletedBy: string | undefined;

  @Column({ type: "datetime", nullable: true })
  deletedAt: Date | undefined;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date = new Date();

  @UpdateDateColumn({ type: "timestamp", nullable: true })
  updatedAt: Date | undefined = new Date() ;

  @UpdateDateColumn({ type: "varchar", nullable: true })
  updatedBy: string | undefined;

  @OneToMany(() => Rule, (rule) => rule.tournament)
  rules: Rule[] | undefined;
  
  @OneToMany(() => TournamentSponsors, (sponsors) => sponsors.tournament)
  sponsors: TournamentSponsors[] | undefined;

  @OneToMany(() => PlayerTeam, (playerTeam) => playerTeam.tournament)
  playerTeams: PlayerTeam[] | undefined;

  @OneToMany(() => GalleryAlbum, (galleryAlbum) => galleryAlbum.tournament_uuid)
  galleryAlbums: GalleryAlbum[] | undefined;

  @ManyToOne(() => Courts, (court) => court.uuid)
  @JoinColumn({ name: 'court_uuid', referencedColumnName: 'uuid' })
  court: Courts | undefined;
  
  @ManyToOne(() => Levels, (level) => level.uuid)
  @JoinColumn({ name: 'level_uuid', referencedColumnName: 'uuid' })
  level: Levels | undefined;

  @ManyToOne(() => PointConfig, (pointConfig) => pointConfig.uuid)
  @JoinColumn({ name: 'point_config_uuid', referencedColumnName: 'uuid' })
  point_config: PointConfig | undefined;

  @OneToMany(() => BlogContent, (blogContents) => blogContents.tournament)
  blogContents: BlogContent[] | undefined;

  @ManyToOne(() => League, (league) => league.id)
  @JoinColumn({ name: 'league_id', referencedColumnName: 'id' })
  league: League | undefined;

  @OneToMany(() => TournamentGroup, (group) => group.tournament)
  groups: TournamentGroup[] | undefined;
}

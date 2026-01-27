import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Levels } from "./Levels";
import { PlayerTeam } from "./PlayerTeam";
import { Gallery } from "./Gallery";
import { MatchHistories } from "./MatchHistories";
import { BlogContent } from "./BlogContents";
import { PlayerGallery } from "./PlayerGallery";
import { MerchOrder } from "./MerchOrder";
import { PlayerLog } from "./PlayerLog";
import { PlayerReview } from "./PlayerReview";
import { League } from "./League";
import { PlayerTitles } from "./PlayerTitles";

export enum GenderEnum {
  male = "m",
  female = "f"
};

export enum RoleEnum {
  PLAYER = "PLAYER",
  ADMIN = "ADMIN",
  MARQUEEPLAYER = "MARQUEEPLAYER",
}

export enum ForehandEnum {
  left = "LEFT",
  right = "RIGHT"
};

export enum BackhandEnum {
  one = "One Handed",
  double = "Double Handed"
};

@Entity("players")
export class Player {
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
  nickname: string = "";

  @Column()
  username: string = "";
  
  @Column()
  email: string = "";

  @Column()
  phoneNumber: string = "";

  @Column()
  password: string = "";

  @Column()
  address: string = "";

  @Column()
  city: string = "";

  @Column()
  media_url: string = "";

  @Column()
  avatar_url: string = "";

  @Column({default: false})
  isVerified: boolean = false;

  @Column({default: false})
  featured: boolean = false;

  @Column()
  skills: string = "";
  @Column()
  socialMediaIg: string = "";

  @Column()
  socialMediaX: string = "";
  
  @Column({ type: "enum", enum: ForehandEnum, nullable: true })  
  playstyleForehand: string | undefined;
  
  @Column({ type: "enum", enum: BackhandEnum, nullable: true })  
  playstyleBackhand: string | undefined;

  @Column({ type: "date", nullable: true })
  turnDate: Date | null = null;

  @Column({ type: "date", nullable: true })
  dateOfBirth: Date | null = null;

  @Column()
  placeOfBirth: string = "";

  @Column({ type: "integer", nullable: true })
  height: number = 0;

  @Column({ type: "integer", nullable: true })
  point: number = 0;

  @Column({ type: "integer", nullable: true })
  coin: number = 0;

  @Column({ type: "timestamp", nullable: false, default: () => "CURRENT_TIMESTAMP" })
  point_updated_at: Date = new Date();

  @Column({ type: "enum", enum: GenderEnum, nullable: true })
  gender: string | undefined;

  @Column({ type: "varchar", nullable: true })
  level_uuid: string | undefined;

  @Column({ type: "timestamp", nullable: true })
  pinned_at: Date | undefined;

  @Column({ type: "varchar", nullable: true })
  createdBy: string | undefined;

  @Column({ type: "varchar", nullable: true })
  deletedBy: string | undefined;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | null = null;

  @Column({ type: "int", nullable: true })
  league_id: number | undefined;

  @Column({ type: "enum", nullable: false, enum: RoleEnum, default: RoleEnum.PLAYER })
  role: string = RoleEnum.PLAYER;

  @Column({ default: false })
  isReferee: boolean = false;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date = new Date();

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date = new Date();

  @ManyToOne(() => Levels, (level) => level.uuid)
  @JoinColumn({ name: 'level_uuid', referencedColumnName: 'uuid' })
  level: Levels | undefined;

  @OneToMany(() => PlayerTeam, (playerTeam) => playerTeam.player)
  playerTeam: PlayerTeam[] | undefined;

  @OneToMany(() => Gallery, (gallery) => gallery.player)
  galleries: Gallery[] | undefined;

  @OneToMany(() => MatchHistories, (matchHistories) => matchHistories.player)
  matchHistories: MatchHistories[] | undefined;

  @OneToMany(() => BlogContent, (blogContents) => blogContents.player)
  blogContents: BlogContent[] | undefined;

  @OneToMany(() => PlayerGallery, (playerGallery) => playerGallery.player)
  playerGalleries: PlayerGallery[] | undefined;

  @OneToMany(() => MerchOrder, (order) => order.player)
  orders: MerchOrder[] | undefined;

  @OneToMany(() => PlayerLog, (playerLog) => playerLog.player)
  playerLog: PlayerLog[] | undefined;

  @ManyToOne(() => League, (league) => league.players)
  @JoinColumn({ name: 'league_id', referencedColumnName: 'id' })
  league: League | undefined;

  @OneToMany(() => PlayerReview, (playerReview) => playerReview.player)
  playerReview: PlayerReview[] | undefined;

  @OneToMany(() => PlayerReview, (playerReview) => playerReview.reviewedBy)
  reviewedBy: PlayerReview[] | undefined;

  @OneToMany(() => PlayerTitles, (playerTitle) => playerTitle.player)
  playerTitles: PlayerTitles[] | undefined;
  
}

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { BlogContentTag } from "./BlogContentTags";
import { BlogContentReaction } from "./BlogContentReaction";
import { Gallery } from "./Gallery";
import { User } from "./User";
import { Tournament } from "./Tournament";
import { Player } from "./Player";
import { Matches } from "./Matches";

export enum ContentStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED"
}

@Entity("blog_content")
export class BlogContent {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column("uuid", {
    name: "uuid",
    generated: "uuid",
    default: () => "uuid_generate_v4()",
  })
  uuid: string | undefined;

  @Column({ type: "varchar", nullable: false })
  title: string | undefined;

  @Column({ type: "text", nullable: false })
  content: string | undefined;

  @Column({ type: "varchar", nullable: true })
  category_uuid: string | undefined;

  @Column({
    type: "enum",
    enum: ContentStatus,
    default: ContentStatus.DRAFT
  })
  status: ContentStatus | undefined;

  @Column({ type: "int", default: 0 })
  read: number | undefined;

  @Column({ type: "timestamp", nullable: true })
  featured_at: Date | undefined | null;


  @Column({ type: "varchar", nullable: true })
  tournament_uuid: string | undefined;

  @Column({ type: "varchar", nullable: true })
  player_uuid: string | undefined;

  @Column({ type: "varchar", nullable: true })
  match_uuid: string | undefined;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date | undefined;

  @Column({ type: "varchar", nullable: true })
  createdBy: string | undefined;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date | undefined;

  @Column({ type: "varchar", nullable: true })
  updatedBy: string | undefined;

  @Column({ type: "varchar", nullable: true })
  deletedBy: string | undefined;

  @OneToMany(() => BlogContentTag, (tag) => tag.content)
  tags: BlogContentTag[] | undefined;

  @OneToMany(() => BlogContentReaction, (reaction) => reaction.content)
  reactions: BlogContentReaction[] | undefined;

  @OneToMany(() => Gallery, (gallery) => gallery.blog)
  galleries: Gallery[] | undefined;

  @ManyToOne(() => User, (user) => user.blogPosts)
  @JoinColumn({ name: 'createdBy', referencedColumnName: 'uuid' })
  author: User | undefined;

  @ManyToOne(() => Tournament, (tournament) => tournament.blogContents)
  @JoinColumn({ name: 'tournament_uuid', referencedColumnName: 'uuid' })
  tournament: Tournament | undefined;

  @ManyToOne(() => Player, (player) => player.blogContents)
  @JoinColumn({ name: 'player_uuid', referencedColumnName: 'uuid' })
  player: Player | undefined;

  @ManyToOne(() => Matches, (matches) => matches.blogContents)
  @JoinColumn({ name: 'match_uuid', referencedColumnName: 'uuid' })
  match: Matches | undefined;
}
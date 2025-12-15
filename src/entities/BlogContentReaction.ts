import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from "typeorm";
import { BlogContent } from "./BlogContents";

export enum Reaction {
  LIKE = "LIKE",
  DISLIKE = "DISLIKE"
}

@Entity("blog_content_reaction")
export class BlogContentReaction {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column("uuid", {
    name: "uuid",
    generated: "uuid",
    default: () => "uuid_generate_v4()",
  })
  uuid: string | undefined;

  @Column({ type: "varchar", nullable: false })
  content_uuid: string | undefined;

  @Column({ type: "varchar", nullable: false })
  player_uuid: string | undefined;

  @Column({
    type: "enum",
    enum: Reaction,
    default: Reaction.LIKE
  })
  reaction: Reaction | undefined;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date | undefined;

  @Column({ type: "varchar", nullable: true })
  createdBy: string | undefined;

  @Column({ type: "varchar", nullable: true })
  deletedBy: string | undefined;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | undefined;

  @ManyToOne(() => BlogContent, (content) => content.reactions)
  @JoinColumn({ name: "content_uuid", referencedColumnName: "uuid" })
  content: BlogContent | undefined;
}
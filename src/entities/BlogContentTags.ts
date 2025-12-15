import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from "typeorm";
import { BlogContent } from "./BlogContents";
import { Tags } from "./Tags";

@Entity("blog_content_tags")
export class BlogContentTag {
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
  tag_uuid: string | undefined;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date | undefined;

  @Column({ type: "varchar", nullable: true })
  createdBy: string | undefined;

  @Column({ type: "varchar", nullable: true })
  deletedBy: string | undefined;

  @Column({ type: "timestamp", nullable: true })
  deletedAt: Date | undefined;

  @ManyToOne(() => BlogContent, (content) => content.tags)
  @JoinColumn({ name: "content_uuid", referencedColumnName: "uuid" })
  content: BlogContent | undefined;

  @ManyToOne(() => Tags, (tag) => tag.blogContentTags)
  @JoinColumn({ name: "tag_uuid", referencedColumnName: "uuid" })
  tag: Tags | undefined;
}
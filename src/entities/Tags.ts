import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
  } from "typeorm";
import { GalleryTags } from "./GalleryTags";
import { BlogContentTag } from "./BlogContentTags";
  
  export enum TagsType {
    blog = "blog",
    gallery = "gallery",
    match = "match"
  };

  @Entity("tags")
  export class Tags {
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

    @Column({ type: "varchar", nullable: true, length: "48" })
    parent_uuid: string | undefined;

    @Column({ type: "enum", enum: TagsType, nullable: true })  
    type: TagsType = TagsType.blog;
  
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

    @OneToMany(() => GalleryTags, (galleryTags) => galleryTags.tag)
    galleryTags: GalleryTags[] | undefined;

    @OneToMany(() => BlogContentTag, (blogContentTag) => blogContentTag.tag)
    blogContentTags: BlogContentTag[] | undefined;
  }
  
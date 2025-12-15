import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { GalleryAlbum } from "./GalleryAlbum";
import { Gallery } from "./Gallery";
import { Tags } from "./Tags";

@Entity("gallery_tags")
export class GalleryTags {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column("uuid", {
    name: "uuid",
    generated: "uuid",
    default: "uuid_generate_v4()",
  })
  uuid: string = "uuid_generate_v4()";

  @Column({ type: "varchar", nullable: true })
  gallery_uuid: string = "";

  @Column({ type: "varchar", nullable: true })
  gallery_album_uuid: string = "";

  @Column()
  tag_uuid: string = "";

  @Column({ type: "varchar", nullable: true })
  createdBy: string | undefined;

  @Column({ type: "varchar", nullable: true })
  deletedBy: string | undefined | null;

  @Column({ type: "datetime", nullable: true })
  deletedAt: Date | undefined | null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date = new Date();

  @ManyToOne(() => Gallery, (gallery) => gallery.uuid)
  @JoinColumn({ name: 'gallery_uuid', referencedColumnName: 'uuid' })
  gallery: Gallery | undefined;

  @ManyToOne(() => GalleryAlbum, (galleryAlbum) => galleryAlbum.uuid)
  @JoinColumn({ name: 'gallery_album_uuid', referencedColumnName: 'uuid' })
  galleryAlbum: GalleryAlbum | undefined;

  @ManyToOne(() => Tags, (tags) => tags.uuid)
  @JoinColumn({ name: 'tag_uuid', referencedColumnName: 'uuid' })
  tag: Tags | undefined;
  
}

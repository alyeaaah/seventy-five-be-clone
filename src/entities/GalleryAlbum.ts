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
import { Gallery } from "./Gallery";
import { Tournament } from "./Tournament";
import { Matches } from "./Matches";
import { GalleryTags } from "./GalleryTags";
import { User } from "./User";
  
  @Entity("gallery_album")
  export class GalleryAlbum {
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
    match_uuid: string = "";

    @Column()
    tournament_uuid: string = "";

    @Column()
    pinned_gallery_uuid: string = "";

    @Column()
    description: string = "";
  
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

    @ManyToOne(() => Gallery, (gallery) => gallery.uuid)
    @JoinColumn({ name: 'pinned_gallery_uuid', referencedColumnName: 'uuid' })
    pinnedGallery: Gallery | undefined;

    @ManyToOne(() => Tournament, (tournament) => tournament.uuid)
    @JoinColumn({ name: 'tournament_uuid', referencedColumnName: 'uuid' })
    tournament: Tournament | undefined;

    @ManyToOne(() => Matches, (match) => match.uuid)
    @JoinColumn({ name: 'match_uuid', referencedColumnName: 'uuid' })
    match: Matches | undefined;

    @OneToMany(() => Gallery, (gallery) => gallery.galleryAlbum)
    galleries: Gallery[] | undefined;

    @OneToMany(() => GalleryTags, (galleryTags) => galleryTags.galleryAlbum)
    tags: GalleryTags[] | undefined;

    @ManyToOne(() => User, (user) => user.blogPosts)
    @JoinColumn({ name: 'createdBy', referencedColumnName: 'uuid' })
    author: User | undefined;
  }
  
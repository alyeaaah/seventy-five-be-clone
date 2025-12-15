import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Player } from "./Player";
import { GalleryAlbum } from "./GalleryAlbum";
import { GalleryTags } from "./GalleryTags";
import { MerchProduct } from "./MerchProducts";
import { BlogContent } from "./BlogContents";
import { PlayerGallery } from "./PlayerGallery";

@Entity("galleries")
export class Gallery {
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
  album_uuid: string = "";

  @Column()
  blog_uuid: string = "";

  @Column()
  product_uuid: string = "";

  @Column()
  player_uuid: string = "";

  @Column()
  category_uuid: string = "";

  @Column()
  match_uuid: string = "";

  @Column()
  court_uuid: string = "";

  @Column()
  court_field_uuid: string = "";

  @Column()
  tournament_uuid: string = "";

  @Column()
  type: string = "";

  @Column()
  description: string = "";

  @Column()
  link: string = "";

  @Column()
  location: string = "";
  
  @Column()
  lat: string = "";

  @Column()
  long: string = "";

  @Column({ type: "timestamp", nullable: true })
  featured_at: Date | undefined | null;

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
  
  @OneToMany(() => GalleryAlbum, (galleryAlbum) => galleryAlbum.pinned_gallery_uuid)
  pinnedGallery: GalleryAlbum[] | undefined;

  @ManyToOne(() => GalleryAlbum, (galleryAlbum) => galleryAlbum.uuid)
  @JoinColumn({ name: 'album_uuid', referencedColumnName: 'uuid' })
  galleryAlbum: GalleryAlbum | undefined;

  @OneToMany(() => GalleryTags, (galleryTags) => galleryTags.gallery)
  tags: GalleryTags[] | undefined;

  @ManyToOne(() => Player, (player) => player.uuid)
  @JoinColumn({ name: 'player_uuid', referencedColumnName: 'uuid' })
  player: Player | undefined;

  @ManyToOne(() => MerchProduct, (product) => product.uuid)
  @JoinColumn({ name: 'product_uuid', referencedColumnName: 'uuid' })
  product: MerchProduct | undefined;

  @ManyToOne(() => BlogContent, (content) => content.uuid)
  @JoinColumn({ name: 'blog_uuid', referencedColumnName: 'uuid' })
  blog: BlogContent | undefined;

  @OneToMany(() => MerchProduct, (product) => product.pinned_image_uuid)
  pinnedProductImage: MerchProduct[] | undefined;

  @OneToMany(() => PlayerGallery, (playerGallery) => playerGallery.gallery)
  playerGalleries: PlayerGallery[] | undefined;
}

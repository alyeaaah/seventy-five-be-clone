import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { BlogContent } from "./BlogContents";
import { GalleryAlbum } from "./GalleryAlbum";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number = 0;

  @Column({ unique: true })
  uuid: string = "uuid_generate_v4()";

  @Column()
  name: string = "";

  @Column({ unique: true })
  username: string = "";

  @Column()
  password: string = "";

  @Column({ nullable: true })
  lastLogin?: Date;

  @Column({ default: false })
  isBlocked: boolean = false;

  @Column()
  role: string = "admin";

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @OneToMany(() => BlogContent, (blog) => blog.author)
  blogPosts: BlogContent[] | undefined;
  @OneToMany(() => GalleryAlbum, (album) => album.author)
  galleryAlbums: GalleryAlbum[] | undefined;
}

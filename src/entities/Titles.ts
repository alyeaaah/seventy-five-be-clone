import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { PlayerTitles } from "./PlayerTitles";

export enum TitleScale {
  INTERNAL = "internal",
  CITY = "city", 
  NATION = "nation",
  PROVINCE = "province",
}

export enum TitleLevel {
  ROOKIE = "rookie",
  BEGINNER = "beginner",
  NOVICE = "novice",
  INTERMEDIATE = "intermediate",
  ADVANCE = "advance",
}

@Entity("titles")
export class Titles {
  @PrimaryGeneratedColumn()
  id: number | undefined;

  @Column()
  title: string = "";

  @Column()
  refId: string = "";

  @Column({ type: "date" })
  date: Date = new Date();

  @Column({ type: "int" })
  rank: number = 0;

  @Column({ type: "enum", enum: TitleScale })
  scale: TitleScale = TitleScale.INTERNAL;

  @Column({ type: "enum", enum: TitleLevel })
  level: TitleLevel = TitleLevel.ROOKIE;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date = new Date();

  @CreateDateColumn({ type: "timestamp" })
  updatedAt: Date = new Date();

  @Column({ type: "datetime", nullable: true })
  deletedAt: Date | undefined | null;

  @OneToMany(() => PlayerTitles, (playerTitle) => playerTitle.title)
  playerTitles: PlayerTitles[] | undefined;
}

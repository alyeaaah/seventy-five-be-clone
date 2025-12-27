import "reflect-metadata";
import { DataSource, DataSourceOptions } from "typeorm";
import { User } from "./entities/User";
import { Player } from "./entities/Player";
import { Tournament } from "./entities/Tournament";
import { Rule } from "./entities/Rule";
import config from "./config";
import { Team } from "./entities/Team";
import { PlayerTeam } from "./entities/PlayerTeam";
import { Matches } from "./entities/Matches";
import { MatchPoint } from "./entities/MatchPoint";
import { TournamentMatchPoint } from "./entities/TournamentMatchPoint";
import { Gallery } from "./entities/Gallery";
import { GalleryAlbum } from "./entities/GalleryAlbum";
import { Game } from "./entities/Game";
import { SetLog } from "./entities/SetLog";
import { PlayerMatchPoint } from "./entities/PlayerPoint";
import { PlayerKudos } from "./entities/PlayerKudos";
import { Kudos } from "./entities/Kudos";
import { Levels } from "./entities/Levels";
import { Courts } from "./entities/Courts";
import { CourtFields } from "./entities/CourtFields";
import { Sponsors } from "./entities/Sponsors";
import { TournamentSponsors } from "./entities/TournamentSponsors";
import { Tags } from "./entities/Tags";
import { PointConfig } from "./entities/PointConfig";
import { GalleryTags } from "./entities/GalleryTags";
import { BlogContent } from "./entities/BlogContents";
import { BlogContentTag } from "./entities/BlogContentTags";
import { BlogContentReaction } from "./entities/BlogContentReaction";
import { MerchProduct } from "./entities/MerchProducts";
import { MerchProductDetail } from "./entities/MerchProductDetail";
import { MerchOrder } from "./entities/MerchOrder";
import { MerchOrderHistory } from "./entities/MerchOrderHistory";
import { MerchOrderItem } from "./entities/MerchOrderItem";
import { MatchHistories } from "./entities/MatchHistories";
import { MerchCategory } from "./entities/MerchCategory";
import { PlayerAddress } from "./entities/PlayerAddress";
import { Cities } from "./entities/Cities";
import { District } from "./entities/District";
import { Province } from "./entities/Province";
import { MerchOrderAddress } from "./entities/MerchOrderAddress";
import { PlayerGallery } from "./entities/PlayerGallery";
import { League } from "./entities/League";
import { PlayerLog } from "./entities/PlayerLog";
import { PlayerReview } from "./entities/PlayerReview";
import { TournamentGroup } from "./entities/TournamentGroups";

const dataSourceOpt: DataSourceOptions = {
  type: "mysql",
  host: config.mysql.host,
  port: config.mysql.port,
  username: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  synchronize: false,
  logging: false,
  // Connection pooling optimizations
  extra: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
  },
  poolSize: 10,
  entities: [
    User,
    Player,
    Tags,
    Tournament,
    Rule,
    Team,
    Kudos,
    Levels,
    PlayerTeam,
    PlayerKudos,
    PlayerAddress,
    PlayerGallery,
    Province,
    Cities,
    District,
    Courts,
    CourtFields,
    Matches,
    MatchPoint,
    TournamentMatchPoint,
    TournamentSponsors,
    Sponsors,
    Gallery,
    GalleryAlbum,
    GalleryTags,
    Game,
    SetLog,
    PlayerMatchPoint,
    PointConfig,
    BlogContent,
    BlogContentTag,
    BlogContentReaction,
    MerchCategory,
    MerchProduct,
    MerchProductDetail,
    MerchOrder,
    MerchOrderItem,
    MerchOrderHistory,
    MerchOrderAddress,
    MatchHistories,
    League,
    PlayerLog,
    PlayerReview,
    TournamentGroup,
  ],
  migrationsRun: true,
  migrationsTableName: "migrations",
  migrations: [["production", "staging", "development"].includes(config.nodeEnv) ? "dist/database/migrations/**/*.js" : "src/database/migrations/**/*.ts"],
  subscribers: [],
};
export const AppDataSource = new DataSource(dataSourceOpt);

import { Request, Response, Router } from 'express';
import multer from 'multer';
import authMiddleware from '../middlewares/auth.middleware';
import logMiddleware from '../middlewares/logging.middleware';

import UserController from '../controllers/user.controller';
import AuthController from '../controllers/auth.controller';
import PlayerController from '../controllers/player.controller';
import TournamentController from '../controllers/tournament.controller';
import RuleController from '../controllers/rule.controller';
import TeamController from '../controllers/team.controller';
import MatchController from '../controllers/match.controller';
import PointController from '../controllers/point.controller';
import MediaController from '../controllers/media.controller';
import KudosController from '../controllers/kudos.controller';
import TagsController from '../controllers/tags.controller';
import LevelsController from '../controllers/levels.controller';
import CourtsController from '../controllers/courts.controller';
import SponsorsController from '../controllers/sponsors.controller';
import PointConfigController from '../controllers/pointConfig.controller';
import BlogContentController from '../controllers/blog.controller';
import ProductController from '../controllers/products.controller';
import ShopController from '../controllers/shop.controller';
import AddressController from '../controllers/address.controller';
import { MatchStatus } from '../entities/Matches';
import OrderController from '../controllers/order.controller';
import LeagueController from '../controllers/league.controller';
import PlayerBasedController from '../controllers/player-based.controller';
import GeneralController from '../controllers/general.controller';
import ChallengerController from '../controllers/challenger.controller';
import EmailVerificationController from '../controllers/emailVerification.controller';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize controllers once - lebih efisien daripada lazy loading per request
const authCon = new AuthController();
const generalCon = new GeneralController();
const challengerCon = new ChallengerController();
const userCon = new UserController();
const playerCon = new PlayerController();
const tourCon = new TournamentController();
const ruleCon = new RuleController();
const teamCon = new TeamController();
const matchCon = new MatchController();
const pointCon = new PointController();
const kudosCon = new KudosController();
const tagsCon = new TagsController();
const levelsCon = new LevelsController();
const courtsCon = new CourtsController();
const mediaCon = new MediaController();
const sponsorsCon = new SponsorsController();
const pointConfigCon = new PointConfigController();
const blogCon = new BlogContentController();
const productCon = new ProductController();
const shopCon = new ShopController();
const addressCon = new AddressController();
const orderCon = new OrderController();
const leagueCon = new LeagueController();
const playerBasedCon = new PlayerBasedController();
const emailVerificationCon = new EmailVerificationController();


export const route = (router: Router) => {
  router.get("/api/health", (req: Request, res: Response) => { res.send("OK") });
  router.get("/api/general/report", logMiddleware, authMiddleware, generalCon.report);
  router.get("/api/general/top-players", logMiddleware, authMiddleware, generalCon.topPlayer);
  router.get("/api/general/upcoming-tournaments", logMiddleware, authMiddleware, generalCon.upcomingTournament);

  // Gallery
  router.post("/api/gallery/upload", logMiddleware, authMiddleware, upload.single('image'), mediaCon.upload);
  router.post("/api/gallery/list", logMiddleware, authMiddleware, mediaCon.list);

  // Gallery Category
  router.post("/api/gallery/category/create", logMiddleware, authMiddleware, mediaCon.categoryCreate);
  router.get("/api/gallery/category/list", logMiddleware, authMiddleware, mediaCon.categoryList);
  router.get("/api/gallery/list", logMiddleware, authMiddleware, mediaCon.list);
  router.put("/api/gallery/players/:uuid", logMiddleware, authMiddleware, mediaCon.updateGalleryPlayers);
  router.post("/api/gallery/create", logMiddleware, authMiddleware, mediaCon.create);
  router.put("/api/gallery-albums/:uuid", logMiddleware, authMiddleware, mediaCon.updateAlbum);
  router.post("/api/gallery-albums", logMiddleware, authMiddleware, mediaCon.createAlbum);
  router.get("/api/gallery-albums", logMiddleware, authMiddleware, mediaCon.listAlbums);
  router.delete("/api/gallery-albums/:uuid", logMiddleware, authMiddleware, mediaCon.deleteAlbum);
  router.get("/api/gallery-albums/:uuid", logMiddleware, authMiddleware, mediaCon.detailAlbum);
  router.put("/api/gallery-albums/toggle-featured/:uuid", logMiddleware, authMiddleware, mediaCon.toggleFeatured);
  router.get("/api/gallery/players/:player_uuid", logMiddleware, authMiddleware, mediaCon.listGalleryByPlayer);

  // Auth
  router.post("/api/auth/login", logMiddleware, authCon.login);

  // User 
  router.get("/api/user/get", logMiddleware, authMiddleware, userCon.get);

  // Player
  // router.post("/api/player/signup", logMiddleware, playerCon.create);
  router.post("/api/player/create", logMiddleware, authMiddleware, playerCon.create);
  router.post("/api/player/quick-add", logMiddleware, authMiddleware, playerCon.quickCreate);
  router.get("/api/player/list", logMiddleware, authMiddleware, playerCon.list);
  router.get("/api/player/address", logMiddleware, authMiddleware, addressCon.detail);
  router.put("/api/player/address", logMiddleware, authMiddleware, addressCon.update);
  router.get("/api/player/ranking", logMiddleware, playerCon.rank);
  router.get("/api/player/detail/:uuid", logMiddleware, authMiddleware, playerCon.detail);
  router.put("/api/player/edit/:uuid", logMiddleware, authMiddleware, playerCon.update);
  router.put("/api/player/role/:uuid", logMiddleware, authMiddleware, playerCon.updateRole);
  router.put("/api/player/verify/:uuid", logMiddleware, authMiddleware, playerCon.update);
  router.delete("/api/player/delete/:uuid", logMiddleware, authMiddleware, playerCon.delete);

  // Tournament
  router.get("/api/tournament/list", logMiddleware, authMiddleware, tourCon.list);
  router.post("/api/tournament/create", logMiddleware, authMiddleware, tourCon.create);
  router.get("/api/tournament/detail/:uuid", logMiddleware, authMiddleware, tourCon.detail);
  router.put("/api/tournament/edit/status/:uuid", logMiddleware, authMiddleware, tourCon.updateStatus);
  router.put("/api/tournament/edit/:uuid", logMiddleware, authMiddleware, tourCon.update);
  router.put("/api/tournament/publish/:uuid", logMiddleware, authMiddleware, tourCon.publish);
  router.delete("/api/tournament/delete/:uuid", logMiddleware, authMiddleware, tourCon.delete);
  
  // Rule
  router.post("/api/rule/create", logMiddleware, authMiddleware, ruleCon.create);
  router.put("/api/rule/edit/:uuid", logMiddleware, authMiddleware, ruleCon.update);
  router.delete("/api/rule/delete/:uuid", logMiddleware, authMiddleware, ruleCon.delete);
  
  // Team
  router.put("/api/tournament/edit/participant/:uuid", logMiddleware, authMiddleware, teamCon.generateTeams);
  router.put("/api/tournament/edit/groups/:uuid", logMiddleware, authMiddleware, matchCon.updateTournamentGroup);
  router.get("/api/tournament/detail/participants/:uuid", logMiddleware, authMiddleware, teamCon.listPlayerTeam);
  router.get("/api/tournament/detail/teams/:uuid", logMiddleware, authMiddleware, teamCon.listTeams);
  router.get("/api/tournament/:uuid/sponsors", logMiddleware, authMiddleware, tourCon.listSponsors);
  router.put("/api/tournament/:uuid/sponsors", logMiddleware, authMiddleware, tourCon.updateTournamentSponsor);
  router.post("/api/team/create", logMiddleware, authMiddleware, teamCon.create);
  router.get("/api/team/list", logMiddleware, authMiddleware, teamCon.list);
  router.get("/api/team/detail/:uuid", logMiddleware, authMiddleware, teamCon.detail);
  router.put("/api/team/edit/:uuid", logMiddleware, authMiddleware, teamCon.update);
  router.delete("/api/team/delete/:uuid", logMiddleware, authMiddleware, teamCon.delete);

  // Match
  router.post("/api/match/create", logMiddleware, authMiddleware, matchCon.create);
  router.post("/api/match/generate", logMiddleware, authMiddleware, matchCon.createMultiple);
  // router.post("/api/match/update", logMiddleware, authMiddleware, matchCon.updateMultiple);
  router.put("/api/match/update/:uuid", logMiddleware, authMiddleware, matchCon.updateMatch);
  router.post("/api/match/update", logMiddleware, authMiddleware, matchCon.updateMultipleMatches);
  router.post("/api/match/custom", logMiddleware, authMiddleware, matchCon.createMultipleCustom);
  router.get("/api/match/list", logMiddleware, authMiddleware, matchCon.list);
  router.get("/api/match/detail/:uuid", logMiddleware, authMiddleware, matchCon.detail);
  router.get("/api/match/player", logMiddleware, authMiddleware, (req, res) => matchCon.playerMatches(req, res));
  router.put("/api/match/custom/:uuid", logMiddleware, authMiddleware, matchCon.updateCustom);
  router.put("/api/match/score-update/:uuid", logMiddleware, authMiddleware, matchCon.updateScore);
  router.put("/api/match/status/:uuid", logMiddleware, authMiddleware, matchCon.updateMatchStatus);
  router.put("/api/match/video-url/:uuid", logMiddleware, authMiddleware, matchCon.updateVideoURL);
  router.delete("/api/match/:uuid", logMiddleware, authMiddleware, matchCon.delete);
  // router.put("/api/match/end/:uuid", logMiddleware, authMiddleware, matchCon.endMatch); // unused
  // router.put("/api/set/scoreupdate/:uuid", logMiddleware, authMiddleware, matchCon.updateSetScore);  // unused
  // router.put("/api/set/end/:uuid", logMiddleware, authMiddleware, matchCon.endSet);  // unused

  // Point Config
  router.get("/api/point-config", logMiddleware, authMiddleware, pointConfigCon.list);
  router.get("/api/point-config/dropdown", logMiddleware, authMiddleware, pointConfigCon.dropdown);
  router.post("/api/point-config/create", logMiddleware, authMiddleware, pointConfigCon.create);
  router.get("/api/point-config/detail/:uuid", logMiddleware, authMiddleware, pointConfigCon.detail);
  router.put("/api/point-config/edit/:uuid", logMiddleware, authMiddleware, pointConfigCon.update);
  router.delete("/api/point-config/delete/:uuid", logMiddleware, authMiddleware, pointConfigCon.delete);
  router.put("/api/point-config/:uuid/set-default", logMiddleware, authMiddleware, pointConfigCon.setDefaultPointConfig);
  router.get("/api/point-config/get-default", logMiddleware, authMiddleware, pointConfigCon.getDefaultPointConfig);

  // Point
  router.get("/api/point/list", logMiddleware, authMiddleware, pointCon.list);
  router.post("/api/point/create", logMiddleware, authMiddleware, pointCon.create);
  router.put("/api/point/edit/:uuid", logMiddleware, authMiddleware, pointCon.update);

  // Tournament Point
  router.get("/api/tpoint/:tournament_uuid/list", logMiddleware, authMiddleware, pointCon.tlist);
  router.post("/api/tpoint/:tournament_uuid/create", logMiddleware, authMiddleware, pointCon.tcreate);
  router.put("/api/tpoint/:tournament_uuid/edit/:uuid", logMiddleware, authMiddleware, pointCon.tupdate);

  // Kudos
  router.post("/api/kudos", logMiddleware, authMiddleware, kudosCon.create);
  router.get("/api/kudos", logMiddleware, authMiddleware, kudosCon.list);
  router.get("/api/kudos/:uuid", logMiddleware, authMiddleware, kudosCon.detail);
  router.put("/api/kudos/:uuid", logMiddleware, authMiddleware, kudosCon.update);
  router.delete("/api/kudos/:uuid", logMiddleware, authMiddleware, kudosCon.delete);

  // Tag
  router.post("/api/tags", logMiddleware, authMiddleware, tagsCon.create);
  router.get("/api/tags", logMiddleware, authMiddleware, tagsCon.list);
  router.get("/api/tags/:uuid", logMiddleware, authMiddleware, tagsCon.detail);
  router.put("/api/tags/:uuid", logMiddleware, authMiddleware, tagsCon.update);
  router.delete("/api/tags/:uuid", logMiddleware, authMiddleware, tagsCon.delete);

  // Sponsors
  router.post("/api/sponsors", logMiddleware, authMiddleware, sponsorsCon.create);
  router.get("/api/sponsors", logMiddleware, authMiddleware, sponsorsCon.list);
  router.get("/api/sponsors/slot", logMiddleware, authMiddleware, sponsorsCon.listSlot);
  router.get("/api/sponsors/:uuid", logMiddleware, authMiddleware, sponsorsCon.detail);
  router.put("/api/sponsors/:uuid", logMiddleware, authMiddleware, sponsorsCon.update);
  router.delete("/api/sponsors/:uuid", logMiddleware, authMiddleware, sponsorsCon.delete);

  // Level
  router.post("/api/levels", logMiddleware, authMiddleware, levelsCon.create);
  router.get("/api/levels", logMiddleware, authMiddleware, levelsCon.list);
  router.get("/api/levels/:uuid", logMiddleware, authMiddleware, levelsCon.detail);
  router.put("/api/levels/:uuid", logMiddleware, authMiddleware, levelsCon.update);
  router.delete("/api/levels/:uuid", logMiddleware, authMiddleware, levelsCon.delete);

  // League
  router.post("/api/leagues", logMiddleware, authMiddleware, leagueCon.create);
  router.get("/api/leagues", logMiddleware, authMiddleware, leagueCon.list);
  router.get("/api/leagues/:id", logMiddleware, authMiddleware, leagueCon.detail);
  router.put("/api/leagues/:id", logMiddleware, authMiddleware, leagueCon.update);
  router.delete("/api/leagues/:id", logMiddleware, authMiddleware, leagueCon.delete);

  // Court
  router.post("/api/courts", logMiddleware, authMiddleware, courtsCon.create);
  router.get("/api/courts", logMiddleware, authMiddleware, courtsCon.list);
  router.get("/api/courts/:uuid", logMiddleware, authMiddleware, courtsCon.detail);
  router.put("/api/courts/:uuid", logMiddleware, authMiddleware, courtsCon.update);
  router.delete("/api/courts/:uuid", logMiddleware, authMiddleware, courtsCon.delete);

  // Blog API
  router.post("/api/blogs/:uuid/publish", logMiddleware, authMiddleware, blogCon.publish);
  router.delete("/api/blogs/:uuid", logMiddleware, authMiddleware, blogCon.delete);
  router.get("/api/blogs/:uuid", logMiddleware, authMiddleware, blogCon.detail);
  router.put("/api/blogs/:uuid", logMiddleware, authMiddleware, blogCon.update);
  router.post("/api/blogs", logMiddleware, authMiddleware, blogCon.create);
  router.get("/api/blogs", logMiddleware, authMiddleware, blogCon.list);
  router.put("/api/blogs/toggle-featured/:uuid", logMiddleware, authMiddleware, blogCon.toggleFeatured);

  // Product
  router.post("/api/products", logMiddleware, authMiddleware, productCon.create);
  router.get("/api/products/:uuid", logMiddleware, authMiddleware, productCon.detail);
  router.put("/api/products/:uuid", logMiddleware, authMiddleware, productCon.update);
  router.delete("/api/products/:uuid", logMiddleware, authMiddleware, productCon.delete);
  router.get("/api/products", logMiddleware, authMiddleware, productCon.list);
  router.put("/api/products/toggle-featured/:uuid", logMiddleware, authMiddleware, productCon.toggleFeatured);

  // Orders
  router.get("/api/orders", logMiddleware, authMiddleware, orderCon.list);
  router.get("/api/orders/:uuid", logMiddleware, authMiddleware, orderCon.detail);
  router.put("/api/orders/:uuid", logMiddleware, authMiddleware, orderCon.updateStatus);

  // Player Based
  router.get("/api/public/matches/player/:player_uuid", logMiddleware, matchCon.playerMatches);
  router.get("/api/public/tournament/player/upcoming/:player_uuid", logMiddleware, playerBasedCon.getUpcomingTournamentByPlayer);
  router.get("/api/public/tournament/player/joined/:player_uuid", logMiddleware, playerBasedCon.getTournamentsByPlayer);
  router.get("/api/public/tournament/groups/:uuid", logMiddleware, matchCon.publicTournamentGroup);
  router.get("/api/player/tournament/joined", logMiddleware, authMiddleware, playerBasedCon.getTournamentsByPlayer);
  router.get("/api/player/tournament/upcoming", logMiddleware, authMiddleware, playerBasedCon.getUpcomingTournamentByPlayer);
  router.get("/api/public/kudos", logMiddleware, authMiddleware, kudosCon.playerKudosList);
  router.post("/api/match/kudos", logMiddleware, authMiddleware, kudosCon.givePlayerKudos);
  // Public API
  // Home
  router.get("/api/public/kudos-list", logMiddleware, kudosCon.list);
  router.get("/api/public/match/upcoming", logMiddleware, (req: Request, res: Response) => matchCon.publicMatchList(req, res, MatchStatus.UPCOMING));
  router.get("/api/public/match/ongoing", logMiddleware, (req: Request, res: Response) => matchCon.publicMatchList(req, res, MatchStatus.ONGOING));
  router.get("/api/public/match/:uuid", logMiddleware, (req: Request, res: Response) => matchCon.publicMatchDetail(req, res));
  router.get("/api/public/match/point-config/:uuid", logMiddleware, (req: Request, res: Response) => pointConfigCon.publicDetail(req, res));
  router.get("/api/public/matches", logMiddleware, (req: Request, res: Response) => matchCon.publicMatchList(req, res));
  router.get("/api/public/sponsors", logMiddleware, sponsorsCon.listSponsorBySlot);

  // Merchandise
  router.get("/api/public/merchandise/shipping-fee", logMiddleware, shopCon.publicShippingFee);
  router.get("/api/public/merchandise/category", logMiddleware, productCon.listCategories);
  router.get("/api/public/merchandise/featured", logMiddleware, productCon.featured);
  router.get("/api/public/merchandise/cart", logMiddleware, authMiddleware, shopCon.getCart);
  router.put("/api/public/merchandise/cart", logMiddleware, authMiddleware, shopCon.updateCart);
  router.get("/api/public/merchandise/order-history", logMiddleware, authMiddleware, shopCon.orderHistory);
  router.get("/api/public/merchandise/order-history/:uuid", logMiddleware, authMiddleware, shopCon.orderDetail);
  router.post("/api/public/merchandise/checkout", logMiddleware, authMiddleware, shopCon.checkoutCart);
  router.get("/api/public/merchandise/:uuid", logMiddleware, productCon.publicDetail);
  
  // Gallery
  router.get("/api/public/gallery/featured", logMiddleware, mediaCon.featured);
  router.get("/api/public/gallery/:uuid", logMiddleware, mediaCon.publicDetailAlbum);
  router.get("/api/public/gallery", logMiddleware, mediaCon.publicAlbums);
  // Player
  router.post("/api/public/register", logMiddleware, playerCon.publicRegistration);
  router.post("/api/public/email-verification/send", logMiddleware, emailVerificationCon.sendVerification);
  router.post("/api/public/email-verification/verify", logMiddleware, emailVerificationCon.verifyEmail);
  router.post("/api/public/email-verification/resend", logMiddleware, emailVerificationCon.resendVerification);
  router.get("/api/player/detail/:uuid/:attr", logMiddleware, playerCon.detail);
  router.get("/api/public/player/featured", logMiddleware, playerCon.featured);
  router.get("/api/public/player/standings", logMiddleware, playerCon.publicStandings);
  router.get("/api/public/player/rank-position/:player_uuid", logMiddleware, playerCon.publicRank);
  router.get("/api/public/player/:uuid", logMiddleware, playerCon.publicDetail);
  router.get("/api/public/levels", logMiddleware, levelsCon.list);
  router.get("/api/public/leagues", logMiddleware, leagueCon.list);
  
  
  
  // Blog
  router.get("/api/public/blog/featured", logMiddleware, blogCon.featured);
  router.get("/api/public/blog/:uuid", logMiddleware, blogCon.publicDetail);
  router.get("/api/public/blog", logMiddleware, blogCon.list);

  // Tournament
  router.get("/api/public/tournament/featured", logMiddleware, tourCon.featured);
  router.get("/api/public/tournament/:tournament_uuid/matches", logMiddleware, matchCon.publicTournamentMatchList);
  router.get("/api/public/tournament/:tournament_uuid/sponsors", logMiddleware, tourCon.listSponsors);
  router.get("/api/public/tournament/:uuid", logMiddleware, tourCon.publicDetail);
  router.get("/api/tournament/list/:attr", logMiddleware, tourCon.list);
  router.get("/api/tournament/detail/:uuid/:attr", logMiddleware, tourCon.detail);

  router.get("/api/address/province", logMiddleware, addressCon.province);
  router.get("/api/address/city", logMiddleware, addressCon.city);
  router.get("/api/address/district", logMiddleware, addressCon.district);

  // Challenger
  router.get("/api/public/challenger", logMiddleware, challengerCon.listOpenChallengers);
  router.post("/api/challenger/open", logMiddleware, authMiddleware, challengerCon.openChallenge);
  router.post("/api/challenger/accept", logMiddleware, authMiddleware, challengerCon.acceptChallenger);


  router.all('*', function (req, res) {
    res.status(404).json({ message: "Not found!" });
  });
};

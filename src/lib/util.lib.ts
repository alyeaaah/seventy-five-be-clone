import * as log4js from "log4js";
import axios from "axios";

export default class Util {
  private static instance: Util;
  private logConf: any;
  private logger: any;
  private loggerError: any;

  private constructor() {
    this.logConf = {
      appenders: {
        api: {
          type: "console",
          layout: {
            type: "colored",
            pattern: "%d{yyyy-MM-dd hh:mm:ss} [%p] %m",
          },
        },
        error: {
          type: "console",
          layout: {
            type: "colored",
            pattern: "%d{yyyy-MM-dd hh:mm:ss} [%p] %m",
          },
        },
      },
      categories: {
        default: { appenders: ["api"], level: "info" },
        error: { appenders: ["error"], level: "error" },
      },
    };
    log4js.configure(this.logConf);
    this.logger = log4js.getLogger("api");
    this.loggerError = log4js.getLogger("error");
  }
  loggingReq(data: any) {
    this.logger.info(
      `[REQUEST]:`,
      JSON.stringify({
        request_method: data.method,
        header: data.headers,
        request_url: data.url,
        request_body: data.body,
        client_ip: data.ip,
      })
    );
  }
  loggingRes(req: any, data: any) {
    this.logger.info(
      `[RESPONSE]:`,
      JSON.stringify({
        request_method: req.method,
        request_url: req.url,
        request_body: req.body,
        client_ip: req.ip,
        data,
      })
    );
  }
  loggingError(req: any, data: any) {
    this.loggerError.error(
      `[ERROR]:`,
      JSON.stringify({
        request_method: req.method,
        request_url: req.url,
        request_body: req.body,
        client_ip: req.ip,
        error: data,
      })
    );
  }

  // Redis methods dihapus - gunakan RedisLib.getInstance() untuk akses Redis
  // Method ini dihapus untuk menghindari duplikasi dengan RedisLib

  getNextSeed(currentMatch: { round: number; seedIndex: number }): {round:number, seedIndex:number, teamPosition: "home" | "away"} {
    const nextRound = currentMatch.round + 1;
    const nextSeedIndex = Math.ceil(currentMatch.seedIndex / 2);
    // Determine if this should be home or away position
    const teamPosition = currentMatch.seedIndex % 2 === 1 ? 'home' : 'away';
    return {
      round: nextRound,
      seedIndex: nextSeedIndex,
      teamPosition
    };
  }

  // Singleton pattern untuk reuse instance
  static getInstance(): Util {
    if (!Util.instance) {
      Util.instance = new Util();
    }
    return Util.instance;
  }

  // Redis methods dihapus - gunakan RedisLib.getInstance() untuk akses Redis
}

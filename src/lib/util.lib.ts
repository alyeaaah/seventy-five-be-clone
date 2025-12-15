import * as log4js from "log4js";
import axios from "axios";
import { Container } from "typedi";

export default class Util {
  private logConf: any;
  private logger: any;
  private loggerError: any;
  private redis: any;

  constructor() {
    this.redis = Container.get("redis");
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

  async redisget(key:string) : Promise<object> {
    return JSON.parse(await this.redis.get(key));
  }
  async redisset(key:string, value:any){
    await this.redis.set(key, JSON.stringify(value));
  }
  async redisdel(key:string){
    await this.redis.del(key);
  }

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
}

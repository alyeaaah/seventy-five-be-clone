import Util from "../lib/util.lib";

export default function loggingMiddleware(req: any, res: any, next: any) {
  const util = Util.getInstance();
  util.loggingReq(req);
  next();
}
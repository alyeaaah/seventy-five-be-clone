import Util from "../lib/util.lib";

export default function (req: any, res: any, next: any) {
  const util = new Util();
  util.loggingReq(req);
  next();
}
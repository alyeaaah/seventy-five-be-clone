
export const playerTBD = {
  uuid: "TBD",
  name: "TBD",
  username: "TBD",
  nickname: "TBD",
  city: "TBD",
  address: "TBDTBD",
  phone: "123456789",
  media_url: "TBD",
  gender: "m" as const,
  isVerified: false,
  level_uuid: "TBD",
};
export const playerBYE = {
  uuid: "BYE",
  name: "---",
  username: "BYE",
  nickname: "BYE",
  city: "BYE",
  address: "BYEBYE",
  phone: "123456789",
  media_url: "BYE",
  gender: "m" as const,
  isVerified: false,
  level_uuid: "BYE",
};
export const playerDummy:any  = {
  TBD: [playerTBD, playerTBD],
  BYE: [playerBYE, playerBYE],
};

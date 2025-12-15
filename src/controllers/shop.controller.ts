import { MerchProductDetail } from "../entities/MerchProductDetail";
import { AppDataSource } from "../data-source";
import { v4 as uuidv4 } from "uuid";
import { In } from "typeorm";
import RedisLib from "../lib/redis.lib";
import { MerchOrder } from "../entities/MerchOrder";
import { MerchOrderItem } from "../entities/MerchOrderItem";
import { MerchOrderHistory } from "../entities/MerchOrderHistory";
import { OrderStatus } from "../entities/MerchOrder";
import { checkoutPayloadSchema } from "../schemas/checkout.schema";
import { CartProductDetailSchema, CartProductSchema, cartProductSchema } from "../schemas/product.schema";
import { Player } from "../entities/Player";
import { MerchOrderAddress } from "../entities/MerchOrderAddress";
import Util from "../lib/util.lib";
import config from "../config";

const REDIS_CART_TTL = 60 * 60 * 24 * 14; // 2 weeks
const getUpdatedCart = (body: CartProductSchema[], detailsDB: MerchProductDetail[]) => {
    const newCart: CartProductSchema[] = []
    let cartIndex = 0;
    for (const item of body) {
      let cartDetailIndex = 0;
      for (const detail of item.details) {
        const detailProductDB = detailsDB.find(d => d.uuid === detail.uuid);
        if (!detailProductDB || !detailProductDB.product) continue;

        const newItemDetail: CartProductDetailSchema = {
          ...detail,
          price: detailProductDB.price,
          size: detailProductDB.size,
          quantity: detailProductDB.quantity,
          qty: detail.qty > detailProductDB.quantity ? detailProductDB.quantity : detail.qty,
        }

        const existingIndex = newCart.findIndex(
          (cartItem) => cartItem.uuid === item.uuid
        );
        const existingDetailIndex = existingIndex > -1 ? newCart[existingIndex].details.findIndex(
          (detailItem) => detailItem.uuid === detail.uuid
        ) : -1;

        if (existingIndex > -1 && existingDetailIndex > -1) {
          newCart[existingIndex].details[cartDetailIndex] = newItemDetail;
        } else if (existingIndex > -1 && existingDetailIndex === -1) {
          newCart[existingIndex].details.push(newItemDetail);
        } else if (existingIndex === -1) {
          newCart.push({
            ...item,
            details: [newItemDetail]
          })
        }

        cartDetailIndex++;
      }
      cartIndex++;
    }
    return newCart;
}
  
const transformOrderData = (input: { data: MerchOrder[] }) => {
  return input.data.map((order: MerchOrder) => {
    const productMap = new Map<string, any>();

    for (const item of order?.items || []) {
      const productDetail = item.product_detail || undefined;
      const product = productDetail?.product || undefined;

      if (!productMap.has(product?.uuid || "")) {
        productMap.set(product?.uuid || "", {
          ...product,
          media_url: product?.pinnedImage?.link || undefined,
          details: [],
        });
      }

      const productEntry = productMap.get(product?.uuid || "");

      productEntry.details.push({
        uuid: productDetail?.uuid || "",
        product_uuid: productDetail?.product_uuid || "",
        size: productDetail?.size || "",
        price: productDetail?.price || 0,
        qty: item.quantity,
        sub_total: item.sub_total,
        createdAt: productDetail?.createdAt || "",
        updatedAt: productDetail?.updatedAt || "",
        id: productDetail?.id || 0,
        createdBy: productDetail?.createdBy || "",
        updatedBy: productDetail?.updatedBy || "",
        deletedBy: productDetail?.deletedBy || "",
      });
    }

    const { items, ...restOrder } = order;

    return {
      ...restOrder,
      address: order?.address ? {
        ...order.address,
        district: order.address.district?.name || undefined,
        city: order.address.district?.city?.name || undefined,
        province: order.address.district?.city?.province?.name || undefined,
      } : undefined,
      products: Array.from(productMap.values()),
    };
  });
}
 const getDomesticCost = async ({
  origin,
  destination,
  weight,
}: {
  origin: string;
  destination: string;
  weight: string | number;
}) => {
  const baseUrl = config.rajaongkir.baseUrl || "";
   const url = `${baseUrl}/calculate/district/domestic-cost`;

  const params = new URLSearchParams();
    params.append("origin", origin);
    params.append("destination", destination);
    params.append("weight", String(weight));
    params.append("courier", "jne:jnt:ide");
    params.append("price", 'lowest');
    
  const response = await fetch(url, {
    method: "POST",
    headers: {
      key: config.rajaongkir.apiKey || "",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
   if (!response.ok) {
     console.error("[DomesticCost] HTTP error!",response);
    throw new Error(`[DomesticCost] HTTP error! status: ${response.status}`);
   }
  return response.json();
};
export default class ShopController {
  async getCart(req: any, res: any) {
    const utilLib = new Util();
    const redis = new RedisLib();
    const playerUuid = req.data?.uuid;
    const cartKey = `cart:${playerUuid}`;
    let cart = await redis.redisget(cartKey);
    const validatedCart = cartProductSchema.array().safeParse(cart);
    if (!cart || validatedCart.error) {
      cart = []; // default jika kosong
      await redis.redisset(cartKey, cart, REDIS_CART_TTL);
    }
    utilLib.loggingRes(req, { data: cart });
    res.json(cart);
  }
  async updateCart(req: any, res: any) {
    const utilLib = new Util();
    const redis = new RedisLib();
    const playerUuid = req.data?.uuid;
    const cartKey = `cart:${playerUuid}`;
    const validatedBody = cartProductSchema.array().safeParse(req.body);
    if (validatedBody.error) {
      return res.status(400).json({ message: "Invalid request body. Expected array of { product_detail_uuid: string, quantity: number >= 0 }" });
    }
    const body = validatedBody.data;

    const repo = AppDataSource.getRepository(MerchProductDetail);
    const detailsDB = await repo.find({
      where: { uuid: In(body.map((item) => item.details.map((detail) => detail.uuid)).flat()) },
      relations: ["product", "product.category"]
    });

    if (detailsDB.length !== body.map((item) => item.details.length).reduce((a, b) => a + b)) {
      return res.status(404).json({ message: "One or more product details not found" });
    }
    const newCart = getUpdatedCart(body, detailsDB);
    
    await redis.redisset(cartKey, newCart, REDIS_CART_TTL);
    utilLib.loggingRes(req, { message: "Cart updated", cart: newCart });
    res.json({ message: "Cart updated", cart: newCart });
  }
  async checkoutCart(req: any, res: any) {
    const utilLib = new Util();
    const redis = new RedisLib();
    const playerUuid = req.data?.uuid || undefined;
    const validatedBody = checkoutPayloadSchema.safeParse(req.body);
    if (validatedBody.error) {
      return res.status(400).json({ message: "Invalid checkout data", errors: validatedBody.error?.issues.map((e) => e.path + ': ' + e.message) });
    }
    const body = validatedBody.data;

    const detailUuids = body.carts.map((item) => item.uuid);

    const detailRepo = AppDataSource.getRepository(MerchProductDetail);
    const detailsDB = await detailRepo.find({
      where: { uuid: In(detailUuids) },
      relations: {
        product:true
      }
    });
    let hasPriceMismatch = false;
    let subTotal = 0;

    for (const item of body.carts) {
      const dbDetail = detailsDB.find((d) => d.uuid === item.uuid);
      if (!dbDetail) {
        return res.status(404).json({ message: `Product detail not found: ${item.uuid}` });
      }

      if (item.price !== dbDetail.price) {
        hasPriceMismatch = true;
      }
      if (item.qty > dbDetail.quantity) {
        return res.status(400).json({ message: `Product quantity not enough: ${dbDetail.product?.name} (${dbDetail.quantity} available)` });
      }

      subTotal += dbDetail.price * item.qty;
    }

    if (hasPriceMismatch) {
      if (playerUuid) {
        const cartKey = `cart:${playerUuid}`;
        let cart = await redis.redisget(cartKey);
        let updatedCart: CartProductSchema[] = [];
        const validatedCart = cartProductSchema.array().safeParse(cart);
        if (!cart || validatedCart.error) {
          cart = []; // default jika kosong
          await redis.redisset(cartKey, cart, REDIS_CART_TTL);
        } else {
          updatedCart = getUpdatedCart(validatedCart.data, detailsDB);
          await redis.redisset(cartKey, updatedCart, REDIS_CART_TTL);
        }
        return res.status(400).json({
          message: "Cart contains outdated prices. Cart has been refreshed.",
          cart: updatedCart
        });
      } else {
        return res.status(400).json({
          message: "Cart contains outdated prices. Please refresh your cart.",
          cart: []
        });
      }
    }

    AppDataSource.transaction(async (entityManager) => {
      const orderItemRepo = AppDataSource.getRepository(MerchOrderItem);
      const orderHistoryRepo = AppDataSource.getRepository(MerchOrderHistory);
      const playerRepo = AppDataSource.getRepository(Player);
      if (!body.email) {
        const player = await playerRepo.findOneBy({ uuid: playerUuid });
        if (!player) {
          return res.status(404).json({ message: "Email not found!" });
        }
        body.email = player.email;
      }

      const order = new MerchOrder();
      order.uuid = uuidv4();
      order.name = req.data?.name || "Guest";
      order.phone = req.data?.phone || "";
      order.player_uuid = playerUuid;
      order.email = body.email;
      order.grand_total = body.total;
      order.sub_total = body.subtotal;
      order.discount = body.point_used * 100;
      order.point_used = body.point_used;
      order.status = OrderStatus.ORDERED;
      order.createdBy = req.data?.uuid || undefined;
      order.note = body.note || "";

      const savedOrder = await entityManager.save(order);

      const items:MerchOrderItem[] = body.carts.map((item) => {
        const price = item.price || 0;
        const subTotal = price * (item.qty || 0);
        const newItem = new MerchOrderItem();
        newItem.uuid = uuidv4();
        newItem.order_uuid = savedOrder.uuid || "";
        newItem.product_detail_uuid = item.uuid || "";
        newItem.product_name = item.product_name || "";
        newItem.product_image = item.product_image || "";
        newItem.product_size = item.product_size || "";
        newItem.product_unit = item.product_unit || "";
        newItem.quantity = item.qty || 0;
        newItem.price = price;
        newItem.sub_total = subTotal;
        newItem.createdBy = req.data?.uuid + "";
        return newItem;
      });

      await entityManager.save(items);

      const orderAddress = new MerchOrderAddress();
      orderAddress.uuid = uuidv4();
      orderAddress.order_uuid = savedOrder.uuid || "";
      orderAddress.receiver_name = body.address.receiver_name || "";
      orderAddress.phone = body.address.phone || "";
      orderAddress.address = body.address.address || "";
      orderAddress.province_id = body.address.province_id || 0;
      orderAddress.city_id = body.address.city_id || 0;
      orderAddress.district_id = body.address.district_id || 0;
      orderAddress.note = body.address.note || "";
      orderAddress.lat = body.address.lat || undefined;
      orderAddress.long = body.address.long || undefined;

      await entityManager.save(orderAddress);

      const history = orderHistoryRepo.create({
        order_uuid: savedOrder.uuid,
        status: OrderStatus.ORDERED
      });

      await entityManager.save(history);

      // Clear cart from Redis
      await redis.redisdel(`cart:${playerUuid}`);

      utilLib.loggingRes(req, { message: "Checkout successful", order_uuid: order.uuid });
      res.json({ message: "Checkout successful", order_uuid: order.uuid });
    }).catch((error) => {
      console.error("Transaction failed:", error);
      utilLib.loggingError(req, error.message);
      res.status(500).json({ message: "Checkout failed" });
    });
  }

  async orderHistory(req: any, res: any) {
    const utilLib = new Util();
    const playerUuid = req.data?.uuid;
    try {
      const merchOrderRepo = AppDataSource.getRepository(MerchOrder);
      const orders = await merchOrderRepo.find({
        where: { player_uuid: playerUuid },
        relations: {
          items: {
            product_detail: {
              product: {
                pinnedImage: true,
              }
            }
          },
          address: {
            district: {
              city: {
                province: true,
              }
            }
          }
        },
        order: {
          createdAt: "DESC"
        }
      });
      utilLib.loggingRes(req, { data: transformOrderData({ data: orders }) });
      return res.json({ data: transformOrderData({ data: orders }) });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async orderDetail(req: any, res: any) { 
    const utilLib = new Util();
    const { uuid } = req.params;
    try {
      const merchOrderRepo = AppDataSource.getRepository(MerchOrder);
      const order = await merchOrderRepo.findOne({ where: { uuid },  relations: {
          items: {
            product_detail: {
              product: {
                pinnedImage: true,
              }
            }
          },
          address: {
            district: {
              city: {
                province: true,
              }
            }
          }
        }
      });
      if (!order) throw new Error(`Order not found`);
      utilLib.loggingRes(req, { data: transformOrderData({ data: [order] })[0] });
      return res.json({ data: transformOrderData({ data: [order] })[0] });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async publicShippingFee(req: any, res: any) {
    const utilLib = new Util();
    try {
      const { destination, weight } = req.query;
      const source = "5902";
      const redis = new RedisLib();
      // round the weight to 1000
      const roundedWeight = Math.ceil(Number(weight) / 1000) * 1000;
      const redisKey = `shipping-fee:${source}:${destination}:${roundedWeight}`;
      const cachedShipping = await redis.redisget(redisKey);
      if (cachedShipping) {
        utilLib.loggingRes(req, { data: cachedShipping, cached: true });
        return res.json({ data: cachedShipping, cached: true });
      }
      if ( !destination || !weight ) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const shipping = await getDomesticCost({
        origin: source,
        destination: destination,
        weight: weight,
      }).catch((error: any) => {
        console.error("[DomesticCost] Error on fetching!", error);
      });
      if (!shipping) {
        return res.status(400).json({ message: "Shipping not found" });
      }
      let resultShipping = shipping?.data?.filter((item: any) => (item.service === "REG" && item.code === "jne") || (item.service === "EZ" && item.code === "jnt") || (item.service === "STD" && item.code === "ide"));
      if (!resultShipping?.length) {
        return res.status(400).json({ message: "Shipping not found" });
      }
      resultShipping = resultShipping.sort((a: any, b: any) => a.cost - b.cost);
      resultShipping = resultShipping.length > 0 ? resultShipping[0] : null;

      await redis.redisset(redisKey, resultShipping, 60 * 60 * 24);
      utilLib.loggingRes(req, { data: resultShipping });
      return res.json({ data: resultShipping });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}
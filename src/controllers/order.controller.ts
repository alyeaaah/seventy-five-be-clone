import { MerchOrderHistory } from "../entities/MerchOrderHistory";
import { AppDataSource } from "../data-source";
import { MerchOrder } from "../entities/MerchOrder";
import Util from "../lib/util.lib";
import { IsNull } from "typeorm";
import { v4 as uuidv4 } from "uuid";

export default class OrderController {
  async list(req: any, res: any) {
    const utilLib = new Util();
    const { page = 1, limit = 10, status } = req.query;
    try {
      const orderRepo = AppDataSource.getRepository(MerchOrder);
      const data = await orderRepo.find({
        where: {
          deletedBy: IsNull(),
          status: status || undefined
        },
        relations: {
          player: true,
          items: {
            product_detail: true
          },
          address : true
        },
        take: Number(limit),
        skip: (Number(page) - 1) * Number(limit),
      });
      const orderList = data?.map((order) => {
        return {
          ...order,
          player: {
            uuid: order.player?.uuid || "",
            name: order.player?.name || "",
            nickname: order.player?.nickname || "",
            username: order.player?.username || "",
            email: order.player?.email || "",
            phone: order.player?.phoneNumber || "",
            city: order.player?.city || "",
            media_url: order.player?.media_url || "",
            gender: order.player?.gender || "",
          },
          items: order.items?.map((item) => {
            return {
              ...item,
              product_uuid: item.product_detail?.product_uuid || "",
            };
          })
        };
      });
      const totalRecords = await orderRepo.count({ where: { status: status || undefined, deletedBy: IsNull() } });
      utilLib.loggingRes(req, { data: orderList, message: "Order list fetched successfully", totalRecords });
      return res.json({ data: orderList, message: "Order list fetched successfully", totalRecords });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async detail(req: any, res: any) {
    const utilLib = new Util();
    const { uuid } = req.params;
    try {
      const orderRepo = AppDataSource.getRepository(MerchOrder);
      const data = await orderRepo.findOne({
        where: { uuid, deletedBy: IsNull() },
        relations: {
          player: true,
          items: {
            product_detail: true
          },
          address: {
            province: true,
            city: true,
            district: true
          }
        }
      });
      if (!data) {
        throw new Error("Order not found!");
      }
      const orderData = {
        ...data,
        player: {
          uuid: data.player?.uuid || "",
          name: data.player?.name || "",
          nickname: data.player?.nickname || "",
          username: data.player?.username || "",
          email: data.player?.email || "",
          phone: data.player?.phoneNumber || "",
          city: data.player?.city || "",
          media_url: data.player?.media_url || "",
          gender: data.player?.gender || "",
        },
        items: data.items?.map((item) => {
          return {
            ...item,
            product_uuid: item.product_detail?.product_uuid || "",
          };
        }),
        address: {
          ...data.address,
          province: data.address?.province?.name || "",
          city: data.address?.city?.name || "",
          district: data.address?.district?.name || ""
        }
      };
      utilLib.loggingRes(req, { data: orderData, message: "Order detail fetched successfully" });
      return res.json({ data: orderData, message: "Order detail fetched successfully" });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
  async updateStatus(req: any, res: any) {  
    const utilLib = new Util();
    const { uuid } = req.params;
    const { status, note, shipping_code } = req.body;
    try {
      if (!uuid || !status) {
        throw new Error("All fields are required!");
      }
      await AppDataSource.transaction(async (entityManager) => {
        const orderRepo = entityManager.getRepository(MerchOrder);
        const orderData = await orderRepo.findOneBy({ uuid, deletedBy: IsNull() });
        if (!orderData) {
          throw new Error("Order not found!");
        }
        orderData.status = status;
        if (!!shipping_code?.length) {
          orderData.shipping_code = shipping_code;
        }
        orderData.updatedBy = req.data?.uuid || undefined;
        const savedOrder = await entityManager.save(orderData);

        const newHistory = new MerchOrderHistory();
        newHistory.uuid = uuidv4();
        newHistory.order_uuid = uuid;
        newHistory.status = status;
        newHistory.notes = note || undefined;
        newHistory.createdBy = req.data?.uuid || undefined;
        await entityManager.save(newHistory);

        utilLib.loggingRes(req, { data: savedOrder, message: "Order status updated successfully" });
        return res.json({ data: savedOrder, message: "Order status updated successfully" });
      });
    } catch (error: any) {
      utilLib.loggingError(req, error.message);
      return res.status(400).json({ message: error.message });
    }
  }
}

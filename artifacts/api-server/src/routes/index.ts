import { Router, type IRouter } from "express";
import healthRouter from "./health";
import imagesRouter from "./images";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(imagesRouter);
router.use(chatRouter);

export default router;

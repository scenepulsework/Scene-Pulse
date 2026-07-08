import { Router, type IRouter } from "express";
import healthRouter from "./health";
import venuesRouter from "./venues";
import commentsRouter from "./comments";
import reportsRouter from "./reports";
import marketsRouter from "./markets";
import marketGapsRouter from "./marketGaps";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(venuesRouter);
router.use(commentsRouter);
router.use(reportsRouter);
router.use(marketsRouter);
router.use(marketGapsRouter);
router.use(statsRouter);

export default router;

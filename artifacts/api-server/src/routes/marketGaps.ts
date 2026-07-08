import { Router, type IRouter } from "express";
import { ListMarketGapsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const MARKET_GAPS = [
  {
    id: "stale-discovery-data",
    title: "Stale discovery data",
    description:
      "Google and review sites show yesterday's photos and last month's hours. Guests decide where to go using conditions that are already out of date.",
  },
  {
    id: "waitlist-leakage",
    title: "Waitlist leakage",
    description:
      "Guests who see a long line walk away and never rejoin the list. Venues lose the booking with no record it almost happened.",
  },
  {
    id: "unseen-capacity",
    title: "Unseen capacity",
    description:
      "A patio or back room can be wide open while the front door looks slammed, so walk-up traffic never finds the open seats.",
  },
  {
    id: "staffing-blind-spots",
    title: "Staffing blind spots",
    description:
      "Managers learn they're understaffed for a surge only after the wait time has already spiraled and reviews start mentioning it.",
  },
  {
    id: "promo-timing-gaps",
    title: "Promo timing gaps",
    description:
      "Happy hour and drop promotions fire on a fixed clock instead of the actual lull, missing the exact window when they'd fill seats.",
  },
  {
    id: "vibe-mismatch",
    title: "Vibe mismatch",
    description:
      "A quiet wine bar and a packed sports bar can look identical on a map pin, sending guests to a room that doesn't match what they wanted tonight.",
  },
];

router.get("/market-gaps", async (_req, res): Promise<void> => {
  res.json(ListMarketGapsResponse.parse(MARKET_GAPS));
});

export default router;

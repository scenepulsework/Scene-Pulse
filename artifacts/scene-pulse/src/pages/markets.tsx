import { MarketsSection } from "@/components/home-sections";
import { PageIntro } from "@/components/page-intro";
import { useGetHeroStats } from "@workspace/api-client-react";

export default function Markets() {
  const { data: stats } = useGetHeroStats();

  return (
    <div className="min-h-screen">
      <PageIntro
        eyebrow="Markets"
        blurb={
          stats
            ? `${stats.totalVenues} venues tracked live across ${stats.marketsCovered} North American markets.`
            : "Live coverage across North American markets."
        }
      />
      <MarketsSection />
    </div>
  );
}

import { OperatorsSection } from "@/components/home-sections";
import { PageIntro } from "@/components/page-intro";

export default function Operators() {
  return (
    <div className="min-h-screen">
      <PageIntro
        eyebrow="For Operators"
        blurb="The market gaps we're closing for bars, restaurants, retail, and venues."
      />
      <OperatorsSection />
    </div>
  );
}

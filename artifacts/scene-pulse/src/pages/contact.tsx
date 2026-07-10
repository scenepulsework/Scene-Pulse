import { ContactSection } from "@/components/home-sections";
import { PageIntro } from "@/components/page-intro";

export default function Contact() {
  return (
    <div className="min-h-screen">
      <PageIntro eyebrow="Contact" blurb="Get your venue on the map or flag a bad signal." />
      <ContactSection />
    </div>
  );
}

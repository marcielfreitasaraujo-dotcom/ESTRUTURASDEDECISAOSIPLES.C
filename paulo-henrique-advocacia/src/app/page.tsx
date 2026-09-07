import { About } from "@/components/sections/About";
import { Areas } from "@/components/sections/Areas";
import { Articles } from "@/components/sections/Articles";
import { Contact } from "@/components/sections/Contact";
import { Differentials } from "@/components/sections/Differentials";
import { Faq } from "@/components/sections/Faq";
import { FinalCta } from "@/components/sections/FinalCta";
import { Hero } from "@/components/sections/Hero";
import { HighlightCta } from "@/components/sections/HighlightCta";
import { Process } from "@/components/sections/Process";
import { SocialProof } from "@/components/sections/SocialProof";
import { Testimonials } from "@/components/sections/Testimonials";
import { TrustBar } from "@/components/sections/TrustBar";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustBar />
      <Areas />
      <HighlightCta />
      <About />
      <Differentials />
      <Process />
      <Testimonials />
      <SocialProof />
      <Articles />
      <Faq />
      <FinalCta />
      <Contact />
    </>
  );
}

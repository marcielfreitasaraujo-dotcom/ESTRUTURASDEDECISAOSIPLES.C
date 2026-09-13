import Header from "./components/Header";
import Hero from "./components/Hero";
import Intro from "./components/Intro";
import About from "./components/About";
import Services from "./components/Services";
import Projects from "./components/Projects";
import Process from "./components/Process";
import Differentials from "./components/Differentials";
import Technology from "./components/Technology";
import FAQ from "./components/FAQ";
import CTA from "./components/CTA";
import Footer from "./components/Footer";

export default function App() {
  return (
    <>
      <div className="grain" aria-hidden="true" />
      <Header />
      <main>
        <Hero />
        <Intro />
        <About />
        <Services />
        <Projects />
        <Process />
        <Differentials />
        <Technology />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

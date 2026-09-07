import { About } from './components/About'
import { Brasa } from './components/Brasa'
import { CTA } from './components/CTA'
import { Experience } from './components/Experience'
import { Footer } from './components/Footer'
import { Gallery } from './components/Gallery'
import { Hero } from './components/Hero'
import { Location } from './components/Location'
import { Menu } from './components/Menu'
import { Navbar } from './components/Navbar'
import { Reviews } from './components/Reviews'
import { WhatsAppButton } from './components/WhatsAppButton'

export default function App() {
  return (
    <div className="min-h-screen bg-ink text-mist pb-24 md:pb-8">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-gold focus:px-4 focus:py-2 focus:text-ink"
      >
        Pular para o conteúdo
      </a>
      <Navbar />
      <main id="conteudo">
        <Hero />
        <About />
        <Brasa />
        <Menu />
        <Experience />
        <Gallery />
        <Reviews />
        <Location />
        <CTA />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}

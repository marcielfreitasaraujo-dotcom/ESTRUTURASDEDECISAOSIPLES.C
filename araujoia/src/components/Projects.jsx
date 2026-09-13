import Reveal from "./Reveal";
import ProjectMock from "./ProjectMock";
import { projects } from "../data/site";

export default function Projects() {
  return (
    <section id="projetos" className="pad-x bg-alt py-24 md:py-32">
      <Reveal>
        <p className="text-xs font-semibold tracking-[0.22em] text-accent">03 — PROJETOS</p>
        <h2 className="mt-4 max-w-[14ch] font-display text-[clamp(2rem,5vw,3.6rem)] font-bold tracking-[-0.03em]">
          Ideias que ganharam vida.
        </h2>
      </Reveal>
      <ul className="mt-12 grid gap-6 md:grid-cols-2">
        {projects.map((project, i) => {
          const inner = (
            <>
              <ProjectMock name={project.name} accent={project.accent} tone={project.tone} />
              <div className="p-6">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-accent">{project.category}</p>
                <h3 className="mt-2 font-display text-2xl font-bold">{project.name}</h3>
                <p className="mt-2 text-muted">{project.text}</p>
                {project.href ? (
                  <span className="mt-5 inline-flex text-sm font-semibold text-accent">Ver projeto</span>
                ) : (
                  <span className="mt-5 inline-flex text-sm font-semibold text-muted">Em breve</span>
                )}
              </div>
            </>
          );

          return (
            <Reveal key={project.name} delay={i * 0.06}>
              <li className="overflow-hidden border border-white/10 bg-bg transition duration-300 hover:-translate-y-1 hover:border-accent/40">
                {project.href ? (
                  <a
                    href={project.href}
                    {...(project.href.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="block"
                  >
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </li>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}

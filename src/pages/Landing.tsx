import { FileCheck, Landmark, ShieldCheck } from "lucide-react";
import { Link } from "@/lib/router-compat";
import PublicShell from "@/components/public/PublicShell";
import ProjectCard from "@/components/project/ProjectCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FEE_SENTENCE } from "@/lib/fee";
import { useProjectListings } from "@/hooks/useProjectListings";

const css = `
  .lp{font-family:'Inter',sans-serif;color:var(--foreground);background:var(--background);line-height:1.55;-webkit-font-smoothing:antialiased}
  .lp h1,.lp h2,.lp h3,.lp h4,.lp h5,.lp .display{font-family:'Space Grotesk',sans-serif;letter-spacing:0;line-height:1.1}
  .lp a:not([data-variant]){color:inherit;text-decoration:none}
  .lp .wrap{max-width:1180px;margin:0 auto;padding:0 28px}
  .lp .eyebrow{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--info)}


  .lp .hero{background:var(--hero-gradient);color:var(--card);padding:96px 0 72px;position:relative;overflow:hidden}
  .lp .hero:before{content:"";position:absolute;inset:0;background-image:var(--grid-overlay);background-size:46px 46px;mask-image:radial-gradient(800px 400px at 70% 20%,var(--foreground),transparent 75%)}
  .lp .hero-in{position:relative}
  .lp .hero h1{max-width:704px}
  .lp :is(.hero,.snapshot,.cta) .eyebrow{color:var(--accent)}
  .lp .hero h1{font-size:60px;font-weight:600;margin-bottom:22px}
  .lp .hero h1 .hl{color:var(--accent)}
  .lp .hero p.lead{font-size:20px;color:var(--inverse-muted);max-width:600px;margin-bottom:34px}
  .lp .hero-cta{display:flex;gap:14px;flex-wrap:wrap}
  .lp .hero-note{max-width:640px;margin-top:22px;font-size:13.5px;color:var(--inverse-subtle)}
  @media(max-width:680px){.lp .hero h1{font-size:40px}}

  .lp .stats-band{background:var(--card);border-bottom:1px solid var(--border)}
  .lp .stats-band .wrap{display:grid;grid-template-columns:repeat(3,1fr);padding-top:46px;padding-bottom:46px}
  .lp .sb-stat{text-align:center;border-right:1px solid var(--border)}
  .lp .sb-stat:last-child{border-right:0}
  .lp .sb-stat svg{width:24px;height:24px;margin:0 auto 12px;color:var(--primary)}
  .lp .sb-stat .assurance-label{font-family:var(--font-display);font-weight:600;font-size:20px;color:var(--foreground)}
  .lp .sb-stat .l{font-size:14px;color:var(--muted-foreground);margin-top:6px;font-family:'Space Grotesk',sans-serif;font-weight:500}
  @media(max-width:680px){.lp .stats-band .wrap{grid-template-columns:1fr;gap:28px}.lp .sb-stat{border-right:0;border-bottom:1px solid var(--border);padding-bottom:24px}.lp .sb-stat:last-child{border-bottom:0}}

  .lp .problem{background:var(--card);padding:74px 0;border-bottom:1px solid var(--border)}
  .lp .problem-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:54px;align-items:center}
  .lp .problem h2{font-weight:600;margin-bottom:8px}
  .lp .problem .big{font-size:19px;line-height:1.6;color:var(--muted-foreground)}
  .lp .problem .big b{color:var(--foreground);font-weight:600}
  .lp .stat-row{display:flex;gap:36px;margin-top:30px;flex-wrap:wrap}
  .lp .stat .n{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:34px;color:var(--primary)}
  .lp .stat .l{font-size:13.5px;color:var(--muted-foreground)}
  @media(max-width:767px){.lp .stat .n{font-size:26px}}
  @media(max-width:820px){.lp .problem-grid{grid-template-columns:1fr;gap:30px}}

  .lp .pillars{padding:80px 0;background:var(--background)}
  .lp .sec-head{text-align:center;max-width:640px;margin:0 auto 48px}
  .lp .sec-head h2{font-weight:600;margin:12px 0 10px}
  .lp .sec-head p{color:var(--muted-foreground);font-size:16.5px}
  .lp .pillar-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
  .lp .pillar{background:var(--card);border:1px solid var(--border);border-radius:var(--radius-xl);padding:30px 26px;transition:.2s}
  .lp .pillar:hover{transform:translateY(-3px);box-shadow:var(--shadow-card-hover);border-color:var(--border)}
  .lp .pillar .ic{width:46px;height:46px;border-radius:11px;background:color-mix(in srgb,var(--primary) 12%,transparent);display:flex;align-items:center;justify-content:center;margin-bottom:18px}
  .lp .pillar .ic svg{width:23px;height:23px;stroke:var(--primary);fill:none;stroke-width:1.7}
  .lp .pillar h3{font-weight:600;margin-bottom:9px}
  .lp .pillar p{color:var(--muted-foreground);font-size:15px}
  .lp .pillar .tag{display:inline-block;margin-top:14px;font-size:12px;font-weight:600;font-family:'Space Grotesk',sans-serif;color:var(--info);background:color-mix(in srgb,var(--primary) 12%,transparent);padding:4px 10px;border-radius:20px}
  @media(max-width:820px){.lp .pillar-grid{grid-template-columns:1fr}}

  .lp .snapshot{padding:84px 0;background:var(--navy-900);color:var(--card);position:relative;overflow:hidden}
  .lp .snapshot:before{content:"";position:absolute;top:-120px;right:-80px;width:420px;height:420px;background:radial-gradient(circle,color-mix(in srgb,var(--primary) 18%,transparent),transparent 65%)}
  .lp .snap-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;position:relative}
  .lp .snapshot h2{font-weight:600;margin:12px 0 14px}
  .lp .snapshot p.l{color:var(--inverse-subtle);font-size:16.5px;margin-bottom:18px}
  .lp .snapshot ul{list-style:none;display:grid;gap:12px}
  .lp .snapshot li{display:flex;gap:11px;align-items:flex-start;color:var(--inverse-muted);font-size:15px}
  .lp .snapshot li svg{width:18px;height:18px;stroke:var(--accent);flex:none;margin-top:3px;fill:none;stroke-width:2}
  .lp .snap-card{background:var(--navy-700);border:1px solid var(--sidebar-border);border-radius:var(--radius-xl);padding:24px;display:grid;grid-template-columns:1fr 1fr;gap:24px}
  .lp .snapshot .snap-card h3{font-size:18px;margin-bottom:10px;color:var(--inverse-foreground)}
  .lp .snap-card ul{gap:0}
  .lp .snap-card li{display:block;padding:8px 0;border-bottom:1px solid var(--sidebar-border);font-size:13.5px;color:var(--inverse-muted)}
  .lp .snap-card li:last-child{border-bottom:0}
  .lp .tz-grid > article{border-radius:var(--radius-xl)}
  @media(max-width:480px){.lp .snap-card{grid-template-columns:1fr}}
  @media(max-width:820px){.lp .snap-grid{grid-template-columns:1fr;gap:28px}}

  .lp .tz-sec{padding:80px 0;background:var(--background)}
  .lp .tz-head{text-align:center;max-width:640px;margin:0 auto 40px}
  .lp .tz-head h2{font-weight:600;color:var(--foreground);margin-bottom:12px}
  .lp .tz-head p{color:var(--muted-foreground);font-size:16px;line-height:1.55}
  .lp .tz-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:1080px;margin:0 auto}
  @media(max-width:900px){.lp .tz-grid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:620px){.lp .tz-grid{grid-template-columns:1fr}}
  .lp .tz-cta{text-align:center;margin-top:40px}
  .lp .tz-note{font-size:13px;color:var(--muted-foreground);margin-top:14px}

  .lp .how{padding:80px 0;background:var(--surface-2)}
  .lp .how-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:40px}
  .lp .track{background:var(--card);border:1px solid var(--border);border-radius:var(--radius-xl);padding:30px}
  .lp .track h3{font-weight:600;margin-bottom:18px}
  .lp .step{display:flex;gap:14px;padding:11px 0}
  .lp .step .num{width:26px;height:26px;border-radius:50%;background:var(--navy-800);color:var(--card);font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;flex:none}
  .lp .step p{font-size:14.5px;color:var(--muted-foreground)}
  @media(max-width:820px){.lp .how-grid{grid-template-columns:1fr}}

  .lp .traction{padding:64px 0;background:var(--card);border-top:1px solid var(--border);border-bottom:1px solid var(--border);text-align:center}
  .lp .traction h3{font-weight:600;max-width:680px;margin:0 auto 12px}
  .lp .traction p{color:var(--muted-foreground);max-width:560px;margin:0 auto 22px;font-size:16px}

  .lp .frames{padding:70px 0;background:var(--background)}
  .lp .frames h2{font-weight:600;text-align:center;margin-bottom:8px}
  .lp .frames .sub{text-align:center;color:var(--muted-foreground);margin-bottom:34px;font-size:15.5px}
  .lp .frame-row{display:flex;flex-wrap:wrap;gap:14px;justify-content:center}
  .lp .chip{background:var(--card);border:1px solid var(--border);border-radius:var(--radius-xl);padding:14px 20px;font-family:'Space Grotesk',sans-serif;font-weight:500;font-size:14.5px;color:var(--foreground);display:flex;flex-direction:column;gap:2px;min-width:150px}
  .lp .chip small{font-family:'Inter',sans-serif;font-weight:400;font-size:12px;color:var(--muted-foreground)}
  .lp .disclaimer{text-align:center;color:var(--muted-foreground);font-size:12.5px;margin-top:24px;max-width:640px;margin-left:auto;margin-right:auto}

  .lp .cta{padding:90px 0;background:var(--cta-gradient);color:var(--card);text-align:center}
  .lp .cta h2{font-weight:600;margin-bottom:14px}
  .lp .cta p{color:var(--inverse-muted);max-width:560px;margin:0 auto 30px;font-size:17px}
  .lp .cta-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
  .lp section h2{font-size:30px}
  .lp section h3{font-size:24px}
  @media(min-width:768px){.lp section h2{font-size:36px}}
`;

const Check = () => (
  <svg viewBox="0 0 24 24">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const Landing = () => {
  const { projects, loading, error } = useProjectListings();
  return (
    <PublicShell>
      <div className="lp">
        <style>{css}</style>

        {/* HERO */}
        <section className="hero">
          <div className="wrap hero-in">
            <h1>
              Where district heating <br />
              and cooling meets <span className="hl">capital.</span>
            </h1>
            <p className="lead">
              A pan-European marketplace connecting DHC project developers with private investors,
              public co-financing, and the advisors who structure bankable deals.
            </p>
            <div className="hero-cta">
              <Button variant="hero" size="lg" asChild><Link to="/sign-in?redirect=/app/opportunities">
                Explore projects →
              </Link></Button>
              <Button variant="outline" size="lg" className="public-secondary" asChild><Link to="/for-developers">
                For developers
              </Link></Button>
            </div>
            <p className="hero-note">{FEE_SENTENCE}</p>
          </div>
        </section>

        {/* STATS BAND */}
        <section className="stats-band">
          <div className="wrap">
            <div className="sb-stat">
              <FileCheck aria-hidden="true" />
              <div className="assurance-label">NDA</div>
              <div className="l">Gated data rooms and logged introductions</div>
            </div>
            <div className="sb-stat">
              <Landmark aria-hidden="true" />
              <div className="assurance-label">Weekly</div>
              <div className="l">Public-funding updates from official sources</div>
            </div>
            <div className="sb-stat">
              <ShieldCheck aria-hidden="true" />
              <div className="assurance-label">Private</div>
              <div className="l">Listings stay anonymous until you grant access</div>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="problem">
          <div className="wrap problem-grid">
            <div>
              <span className="eyebrow">The financing gap</span>
              <h2>Capital is available. Comparable information is not.</h2>
            </div>
            <div>
              <p className="big">
                Heating and cooling is roughly <b>half of Europe's energy use</b>, yet DHC
                investment stays fragmented, locally idiosyncratic, and over-reliant on public
                budgets. Every project is evaluated from scratch, in a different format, under a
                different national regime. <b>DHC Market closes that gap</b> by presenting projects
                in one standard, comparable structure, and connecting them to the capital and
                expertise to deliver.
              </p>
              <div className="stat-row">
                <div className="stat">
                  <div className="n">~50%</div>
                  <div className="l">of EU energy use is heating &amp; cooling</div>
                </div>
                <div className="stat">
                  <div className="n">~25%</div>
                  <div className="l">renewable share in H&amp;C (2022)</div>
                </div>
                <div className="stat">
                  <div className="n">3 layers</div>
                  <div className="l">private · public · advisory</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PILLARS */}
        <section className="pillars">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow">What the platform does</span>
              <h2>One marketplace, three connections</h2>
              <p>
                We don't invest, underwrite, or advise. We standardize information and make the
                right introductions.
              </p>
            </div>
            <div className="pillar-grid">
              <div className="pillar">
                <div className="ic">
                  <svg viewBox="0 0 24 24">
                    <path d="M4 12h16M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l-4 4" />
                  </svg>
                </div>
                <h3>Connect</h3>
                <p>
                  Standardized, comparable projects matched to private capital across the EU, with
                  controlled, step-by-step disclosure.
                </p>
                <span className="tag">Core marketplace</span>
              </div>
              <div className="pillar">
                <div className="ic">
                  <svg viewBox="0 0 24 24">
                    <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />
                  </svg>
                </div>
                <h3>De-risk with public capital</h3>
                <p>
                  Route projects to EIB, EU programmes, and national development funds (EIFO, IFU)
                  so public co-financing lowers risk and draws in private investment.
                </p>
                <span className="tag">Free</span>
              </div>
              <div className="pillar">
                <div className="ic">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3l2.5 5 5.5.8-4 4 1 5.5L12 21l-5-2.7 1-5.5-4-4 5.5-.8z" />
                  </svg>
                </div>
                <h3>Structure with experts</h3>
                <p>
                  Access vetted financial, legal, and technical advisors to bring projects to
                  bankable standard, including aggregation into investable portfolios.
                </p>
                <span className="tag">Ecosystem</span>
              </div>
            </div>
          </div>
        </section>

        {/* SNAPSHOT */}
        <section className="snapshot">
          <div className="wrap snap-grid">
            <div>
              <span className="eyebrow">Why comparable matters</span>
              <h2>Every project follows the same structure.</h2>
              <p className="l">
                So you spend your time evaluating opportunities, not deciphering them. Each listing
                presents the same standardized technical, financial, regulatory, and sustainability
                fields, with European benchmarks for context.
              </p>
              <ul>
                <li>
                  <Check />
                  Technical: heat source, network efficiency, contracted connections
                </li>
                <li>
                  <Check />
                  Financial: capital stack, revenue model, regulatory revenue caps
                </li>
                <li>
                  <Check />
                  Regulatory: national tariff regime, concession framework, EU comparison
                </li>
                <li>
                  <Check />
                  Sustainability: Taxonomy, EED, RED III, DNSH, verified by named bodies
                </li>
              </ul>
            </div>
            <div className="snap-card" aria-label="Standardized project fields">
              {([
                ["Technical", ["Heat source", "Network efficiency", "Offtake commitment"]],
                ["Financial", ["Capital stack", "Revenue model", "Tariff basis"]],
                ["Regulatory", ["National tariff regime", "Concession framework", "Permitting"]],
                ["Sustainability", ["Emissions baseline", "EU Taxonomy", "EED alignment", "DNSH evidence"]],
              ] as const).map(([heading, fields]) => (
                <div key={heading}>
                  <h3>{heading}</h3>
                  <ul>{fields.map((field) => <li key={field}>{field}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MARKETPLACE PREVIEW */}
        <section className="tz-sec">
          <div className="wrap">
            <div className="tz-head">
              <h2>A glimpse of the marketplace</h2>
              <p>
                A sample of live opportunities, shown anonymized. Create a free account to explore
                the full marketplace and see standardized project detail.
              </p>
            </div>
            {loading ? (
              <div className="tz-grid" role="status" aria-label="Loading listings">
                {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-80 w-full rounded-xl" />)}
              </div>
            ) : error || !projects.length ? (
              <p role="status" className="text-center text-muted-foreground">Listings are loading slowly. Browse the marketplace instead.</p>
            ) : (
              <div className="tz-grid">
                {projects.slice(0, 3).map((project) => <ProjectCard key={project.id} project={project} context="public" />)}
              </div>
            )}
            <div className="tz-cta">
              <Button variant="hero" size="lg" asChild><Link to="/sign-in?redirect=/app/opportunities">
                Start Exploring →
              </Link></Button>
              <div className="tz-note">
                Free to join. Browsing is anonymized; identities reveal only when you choose to
                connect.
              </div>
            </div>
          </div>
        </section>

        {/* HOW */}
        <section className="how" id="how">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow">How it works</span>
              <h2>Two sides, one process</h2>
            </div>
            <div className="how-grid">
              <div className="track">
                <h3>For developers</h3>
                <div className="step">
                  <div className="num">1</div>
                  <p>List your project at no cost, in the standard format investors expect.</p>
                </div>
                <div className="step">
                  <div className="num">2</div>
                  <p>
                    Surface eligible public co-financing and connect with advisors to reach bankable
                    standard.
                  </p>
                </div>
                <div className="step">
                  <div className="num">3</div>
                  <p>
                    Receive qualified interest from investors and manage Q&amp;A from one dashboard.
                  </p>
                </div>
                <div className="step">
                  <div className="num">4</div>
                  <p>Engage directly and progress toward financial close.</p>
                </div>
              </div>
              <div className="track">
                <h3>For investors</h3>
                <div className="step">
                  <div className="num">1</div>
                  <p>Browse anonymized opportunities and filter to your mandate.</p>
                </div>
                <div className="step">
                  <div className="num">2</div>
                  <p>Open a standardized overview to assess fit before committing time.</p>
                </div>
                <div className="step">
                  <div className="num">3</div>
                  <p>
                    Express interest to see full project identity and detail after developer acceptance. The data room requires separate approval.
                  </p>
                </div>
                <div className="step">
                  <div className="num">4</div>
                  <p>Engage the developer directly; we facilitate, you decide.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRACTION */}
        <section className="traction">
          <div className="wrap">
            <span className="eyebrow">Early access</span>
            <h2>We're onboarding our first cohort of projects and investors now.</h2>
            <p>
              DHC Market is built on European energy data and the regulatory frameworks that govern
              district-energy finance. If you're developing or financing DHC, you can help shape the
              standard.
            </p>
            <div className="cta-btns">
              <Button variant="outline" size="lg" className="public-secondary" asChild><Link to="/for-developers">
                For developers
              </Link></Button>
              <Button variant="outline" size="lg" className="public-secondary" asChild><Link to="/for-investors">
                For investors
              </Link></Button>
            </div>
          </div>
        </section>

        {/* FRAMEWORKS */}
        <section className="frames">
          <div className="wrap">
            <h2>Aligned with the frameworks that govern DHC finance</h2>
            <p className="sub">
              Project data is structured around the European standards investors are required to
              assess against.
            </p>
            <div className="frame-row">
              <div className="chip">
                EU Taxonomy <small>Climate mitigation</small>
              </div>
              <div className="chip">
                Energy Efficiency Directive <small>Efficient DHC (Arts. 24-26)</small>
              </div>
              <div className="chip">
                Renewable Energy Directive III <small>DHC targets</small>
              </div>
              <div className="chip">
                SFDR <small>Article 8 / 9 classification</small>
              </div>
              <div className="chip">
                DNSH <small>Do No Significant Harm</small>
              </div>
            </div>
            <p className="disclaimer">
              DHC Market structures projects around these frameworks. Compliance for any individual
              project is assessed and stated by the developer or named third-party assessors, not by
              DHC Market.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="cta">
          <div className="wrap">
            <h2>Raising capital, or deploying it?</h2>
            <p>Start with a clearer view of the European DHC pipeline.</p>
            <div className="cta-btns">
              <Button variant="hero" size="lg" asChild><Link to="/sign-in?redirect=/app/opportunities">
                Explore projects →
              </Link></Button>
              <Button variant="outline" size="lg" className="public-secondary" asChild><Link to="/for-developers">
                For developers
              </Link></Button>
            </div>
          </div>
        </section>
      </div>
    </PublicShell>
  );
};

export default Landing;

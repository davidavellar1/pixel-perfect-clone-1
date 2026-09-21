import { Link } from "@/lib/router-compat";
import PublicShell from "@/components/public/PublicShell";
import ProjectCard from "@/components/project/ProjectCard";
import { previewProjects } from "@/components/ProjectsSection";

const css = `
  .lp{font-family:'Inter',sans-serif;color:#0f1b2d;background:#f4f6f9;line-height:1.55;-webkit-font-smoothing:antialiased}
  .lp h1,.lp h2,.lp h3,.lp h4,.lp h5,.lp .display{font-family:'Space Grotesk',sans-serif;letter-spacing:-.02em;line-height:1.1}
  .lp a{color:inherit;text-decoration:none}
  .lp .wrap{max-width:1180px;margin:0 auto;padding:0 28px}
  .lp .btn{display:inline-flex;align-items:center;gap:8px;font-family:'Space Grotesk',sans-serif;font-weight:500;font-size:15px;padding:13px 22px;border-radius:8px;border:1px solid transparent;cursor:pointer;transition:.18s}
  .lp .btn-primary{background:#2f80ed;color:#fff}
  .lp .btn-primary:hover{background:#2670d6;transform:translateY(-1px)}
  .lp .btn-ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.25)}
  .lp .btn-ghost:hover{border-color:rgba(255,255,255,.55)}
  .lp .btn-dark{background:#0b1b2e;color:#fff}
  .lp .btn-dark:hover{background:#0f2740}
  .lp .eyebrow{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;color:#2f80ed}

  .lp header.nav{position:sticky;top:0;z-index:50;background:rgba(8,19,32,.86);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.07)}
  .lp .nav-in{display:flex;align-items:center;justify-content:space-between;height:68px}
  .lp .logo{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:21px;color:#fff;letter-spacing:-.03em}
  .lp .logo span{color:#3ea0ff}
  .lp .nav-links{display:flex;gap:30px;align-items:center}
  .lp .nav-links a{color:#c5cedb;font-size:14.5px;font-weight:500;transition:.15s}
  .lp .nav-links a:hover{color:#fff}
  .lp .nav-cta{display:flex;gap:12px;align-items:center}
  .lp .nav-cta .signin{color:#fff;font-weight:500;font-size:14.5px;padding:9px 14px}
  @media(max-width:940px){.lp .nav-links{display:none}}

  .lp .hero{background:radial-gradient(1200px 500px at 75% -10%,rgba(47,128,237,.22),transparent 60%),linear-gradient(160deg,#0b1b2e,#081320);color:#fff;padding:96px 0 110px;position:relative;overflow:hidden}
  .lp .hero:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px);background-size:46px 46px;mask-image:radial-gradient(800px 400px at 70% 20%,#000,transparent 75%)}
  .lp .hero-in{position:relative;max-width:760px}
  .lp .hero h1{font-size:60px;font-weight:600;margin-bottom:22px}
  .lp .hero h1 .hl{color:#3ea0ff}
  .lp .hero p.lead{font-size:20px;color:#bcc8d8;max-width:600px;margin-bottom:34px}
  .lp .hero-cta{display:flex;gap:14px;flex-wrap:wrap}
  .lp .hero-note{margin-top:22px;font-size:13.5px;color:#8b9bb0}
  @media(max-width:680px){.lp .hero h1{font-size:40px}}

  .lp .stats-band{background:#fff;border-bottom:1px solid #e4e9ef}
  .lp .stats-band .wrap{display:grid;grid-template-columns:repeat(3,1fr);padding-top:46px;padding-bottom:46px}
  .lp .sb-stat{text-align:center;border-right:1px solid #e4e9ef}
  .lp .sb-stat:last-child{border-right:0}
  .lp .sb-stat .n{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:46px;letter-spacing:-.02em;color:#0f1b2d}
  .lp .sb-stat .n .u{color:#2f80ed}
  .lp .sb-stat .l{font-size:14px;color:#65748a;margin-top:6px;font-family:'Space Grotesk',sans-serif;font-weight:500}
  .lp .sb-stat .note{font-size:11.5px;color:#8a98ab;margin-top:3px;font-style:italic}
  @media(max-width:680px){.lp .stats-band .wrap{grid-template-columns:1fr;gap:28px}.lp .sb-stat{border-right:0;border-bottom:1px solid #e4e9ef;padding-bottom:24px}.lp .sb-stat:last-child{border-bottom:0}}

  .lp .problem{background:#fff;padding:74px 0;border-bottom:1px solid #e4e9ef}
  .lp .problem-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:54px;align-items:center}
  .lp .problem h2{font-size:32px;font-weight:600;margin-bottom:8px}
  .lp .problem .big{font-size:19px;line-height:1.6;color:#33425a}
  .lp .problem .big b{color:#0f1b2d;font-weight:600}
  .lp .stat-row{display:flex;gap:36px;margin-top:30px;flex-wrap:wrap}
  .lp .stat .n{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:34px;color:#2f80ed}
  .lp .stat .l{font-size:13.5px;color:#65748a}
  @media(max-width:820px){.lp .problem-grid{grid-template-columns:1fr;gap:30px}}

  .lp .pillars{padding:80px 0;background:#f4f6f9}
  .lp .sec-head{text-align:center;max-width:640px;margin:0 auto 48px}
  .lp .sec-head h2{font-size:34px;font-weight:600;margin:12px 0 10px}
  .lp .sec-head p{color:#65748a;font-size:16.5px}
  .lp .pillar-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
  .lp .pillar{background:#fff;border:1px solid #e4e9ef;border-radius:14px;padding:30px 26px;transition:.2s}
  .lp .pillar:hover{transform:translateY(-3px);box-shadow:0 18px 40px -22px rgba(15,27,45,.28);border-color:#d4dde7}
  .lp .pillar .ic{width:46px;height:46px;border-radius:11px;background:rgba(47,128,237,.12);display:flex;align-items:center;justify-content:center;margin-bottom:18px}
  .lp .pillar .ic svg{width:23px;height:23px;stroke:#2f80ed;fill:none;stroke-width:1.7}
  .lp .pillar h3{font-size:20px;font-weight:600;margin-bottom:9px}
  .lp .pillar p{color:#65748a;font-size:15px}
  .lp .pillar .tag{display:inline-block;margin-top:14px;font-size:12px;font-weight:600;font-family:'Space Grotesk',sans-serif;color:#2f80ed;background:rgba(47,128,237,.12);padding:4px 10px;border-radius:20px}
  @media(max-width:820px){.lp .pillar-grid{grid-template-columns:1fr}}

  .lp .snapshot{padding:84px 0;background:#081320;color:#fff;position:relative;overflow:hidden}
  .lp .snapshot:before{content:"";position:absolute;top:-120px;right:-80px;width:420px;height:420px;background:radial-gradient(circle,rgba(47,128,237,.18),transparent 65%)}
  .lp .snap-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;position:relative}
  .lp .snapshot h2{font-size:32px;font-weight:600;margin:12px 0 14px}
  .lp .snapshot p.l{color:#aebbcd;font-size:16.5px;margin-bottom:18px}
  .lp .snapshot ul{list-style:none;display:grid;gap:12px}
  .lp .snapshot li{display:flex;gap:11px;align-items:flex-start;color:#cdd7e4;font-size:15px}
  .lp .snapshot li svg{width:18px;height:18px;stroke:#3ea0ff;flex:none;margin-top:3px;fill:none;stroke-width:2}
  .lp .snap-card{background:linear-gradient(180deg,#0f2740,#0c2036);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:8px;box-shadow:0 30px 60px -30px rgba(0,0,0,.6)}
  .lp .snap-tabs{display:flex;gap:4px;padding:8px 10px;font-size:12.5px;color:#8fa0b6;border-bottom:1px solid rgba(255,255,255,.08)}
  .lp .snap-tabs span{padding:5px 9px;border-radius:6px}
  .lp .snap-tabs span.on{background:rgba(47,128,237,.2);color:#fff}
  .lp .snap-rows{padding:14px}
  .lp .srow{display:flex;justify-content:space-between;padding:10px 4px;border-bottom:1px solid rgba(255,255,255,.06);font-size:13.5px}
  .lp .srow:last-child{border:0}
  .lp .srow .k{color:#90a0b6}.lp .srow .v{color:#eaf0f7;font-weight:600;font-family:'Space Grotesk',sans-serif}
  @media(max-width:820px){.lp .snap-grid{grid-template-columns:1fr;gap:28px}}

  .lp .tz-sec{padding:80px 0;background:#f4f6f9}
  .lp .tz-head{text-align:center;max-width:640px;margin:0 auto 40px}
  .lp .tz-head h2{font-size:34px;font-weight:600;color:#0f1b2d;margin-bottom:12px}
  .lp .tz-head p{color:#65748a;font-size:16px;line-height:1.55}
  .lp .tz-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:1080px;margin:0 auto}
  @media(max-width:900px){.lp .tz-grid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:620px){.lp .tz-grid{grid-template-columns:1fr}}
  .lp .tz-card{background:#fff;border:1px solid #e4e9ef;border-radius:14px;overflow:hidden;cursor:pointer;transition:.16s;display:flex;flex-direction:column}
  .lp .tz-card:hover{transform:translateY(-3px);box-shadow:0 18px 40px -26px rgba(15,27,45,.35);border-color:#d4dde7}
  .lp .tz-stripe{height:5px}
  .lp .tz-pad{padding:16px 18px;display:flex;flex-direction:column;flex:1}
  .lp .tz-badges{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:11px}
  .lp .tz-b{font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px}
  .lp .tz-amber{background:#fdf3e2;color:#b7791f}.lp .tz-blue{background:#e8effb;color:#2f80ed}.lp .tz-green{background:#e6f5ec;color:#1f9d63}
  .lp .tz-stage{background:#eef2f6;color:#3a4961}.lp .tz-gen{background:rgba(31,157,99,.12);color:#1f9d63;font-weight:700}
  .lp .tz-pub{margin-left:auto;display:inline-flex;align-items:center;gap:4px;font-family:'Space Grotesk',sans-serif;font-size:10.5px;font-weight:600;color:#1f9d63;background:#e6f5ec;border:1px solid #c9e8d5;border-radius:20px;padding:4px 9px}.lp .tz-pub svg{width:12px;height:12px;stroke:#1f9d63;fill:none;stroke-width:2.2}
  .lp .tz-title{font-size:17px;font-weight:600;color:#0f1b2d;font-family:'Space Grotesk',sans-serif;margin-bottom:4px}
  .lp .tz-loc{font-size:12.5px;color:#65748a;margin-bottom:14px}
  .lp .tz-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
  .lp .tz-m .l{font-family:'Space Grotesk',sans-serif;font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#65748a}
  .lp .tz-m .v{font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:14px;color:#0f1b2d;margin-top:3px}.lp .tz-m .v.early{font-size:11.5px;color:#8a98ab}
  .lp .tz-foot{margin-top:auto;border-top:1px solid #e4e9ef;padding-top:12px;display:flex;justify-content:space-between;align-items:center;font-size:12.5px}
  .lp .tz-foot .vw{color:#2f80ed;font-family:'Space Grotesk',sans-serif;font-weight:600}
  .lp .tz-foot .lk{display:flex;align-items:center;gap:5px;color:#8a98ab}.lp .tz-foot .lk svg{width:13px;height:13px;stroke:#8a98ab;fill:none;stroke-width:2}
  .lp .tz-cta{text-align:center;margin-top:40px}
  .lp .tz-btn{display:inline-flex;align-items:center;gap:9px;font-family:'Space Grotesk',sans-serif;font-weight:600;font-size:16px;padding:15px 32px;border-radius:11px;background:#2f80ed;color:#fff;border:0;cursor:pointer;transition:.15s}.lp .tz-btn:hover{background:#2670d6}
  .lp .tz-note{font-size:13px;color:#8a98ab;margin-top:14px}

  .lp .how{padding:80px 0;background:#eef1f5}
  .lp .how-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:40px}
  .lp .track{background:#fff;border:1px solid #e4e9ef;border-radius:14px;padding:30px}
  .lp .track h3{font-size:20px;font-weight:600;margin-bottom:18px}
  .lp .step{display:flex;gap:14px;padding:11px 0}
  .lp .step .num{width:26px;height:26px;border-radius:50%;background:#0b1b2e;color:#fff;font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;flex:none}
  .lp .step p{font-size:14.5px;color:#3a4961}
  @media(max-width:820px){.lp .how-grid{grid-template-columns:1fr}}

  .lp .traction{padding:64px 0;background:#fff;border-top:1px solid #e4e9ef;border-bottom:1px solid #e4e9ef;text-align:center}
  .lp .traction h3{font-size:25px;font-weight:600;max-width:680px;margin:0 auto 12px}
  .lp .traction p{color:#65748a;max-width:560px;margin:0 auto 22px;font-size:16px}

  .lp .frames{padding:70px 0;background:#f4f6f9}
  .lp .frames h2{font-size:27px;font-weight:600;text-align:center;margin-bottom:8px}
  .lp .frames .sub{text-align:center;color:#65748a;margin-bottom:34px;font-size:15.5px}
  .lp .frame-row{display:flex;flex-wrap:wrap;gap:14px;justify-content:center}
  .lp .chip{background:#fff;border:1px solid #e4e9ef;border-radius:10px;padding:14px 20px;font-family:'Space Grotesk',sans-serif;font-weight:500;font-size:14.5px;color:#2b3a52;display:flex;flex-direction:column;gap:2px;min-width:150px}
  .lp .chip small{font-family:'Inter',sans-serif;font-weight:400;font-size:12px;color:#8a98ab}
  .lp .disclaimer{text-align:center;color:#8a98ab;font-size:12.5px;margin-top:24px;max-width:640px;margin-left:auto;margin-right:auto}

  .lp .cta{padding:90px 0;background:radial-gradient(900px 400px at 50% -20%,rgba(47,128,237,.2),transparent 60%),linear-gradient(160deg,#0b1b2e,#081320);color:#fff;text-align:center}
  .lp .cta h2{font-size:38px;font-weight:600;margin-bottom:14px}
  .lp .cta p{color:#bcc8d8;max-width:560px;margin:0 auto 30px;font-size:17px}
  .lp .cta-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
  .lp footer{background:#081320;color:#9fb0c4;padding:56px 0 34px;border-top:1px solid rgba(255,255,255,.07)}
  .lp .foot-grid{display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:30px}
  .lp .foot-grid h5{font-family:'Space Grotesk',sans-serif;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#6f819a;margin-bottom:16px;font-weight:600}
  .lp .foot-grid a{display:block;color:#b3c1d2;font-size:14px;padding:5px 0;transition:.15s}
  .lp .foot-grid a:hover{color:#fff}
  .lp .foot-logo{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:20px;color:#fff;margin-bottom:12px}
  .lp .foot-logo span{color:#3ea0ff}
  .lp .foot-desc{font-size:14px;max-width:260px;color:#8295ac}
  .lp .foot-bottom{margin-top:40px;padding-top:22px;border-top:1px solid rgba(255,255,255,.08);text-align:center;font-size:13px;color:#6f819a}
  @media(max-width:820px){.lp .foot-grid{grid-template-columns:1fr 1fr}}
`;

const tzProjects = [
  { tech: "Waste heat", type: "Modernization", tc: "tz-amber", sc: "#d6a23a", stage: "Development", gen: "4G", loc: "France · Auvergne-Rhône-Alpes", cap: "5-10 MW", capex: "€10-15M", off: "87%", pub: true },
  { tech: "Geothermal", type: "Expansion", tc: "tz-blue", sc: "#2f80ed", stage: "Construction", gen: "4G", loc: "Denmark · Hovedstaden", cap: "25-50 MW", capex: "€40-50M", off: "91%", pub: true },
  { tech: "Heat pump", type: "New construction", tc: "tz-green", sc: "#1d9e75", stage: "Development", gen: "5G", loc: "Netherlands · Noord-Holland", cap: "10-25 MW", capex: "€35-40M", off: "44%", pub: false },
  { tech: "Biomass", type: "Expansion", tc: "tz-blue", sc: "#2f80ed", stage: "Construction", gen: "3G", loc: "Sweden · Stockholm", cap: "25-50 MW", capex: "€30-35M", off: "88%", pub: true },
  { tech: "Solar thermal", type: "New construction", tc: "tz-green", sc: "#1f9d63", stage: "Concept", gen: "4G", loc: "Finland · Uusimaa", cap: "25-50 MW", capex: "€50-60M", off: "Early stage", pub: true },
  { tech: "Waste heat", type: "Modernization", tc: "tz-amber", sc: "#d6a23a", stage: "Construction", gen: "3G", loc: "Germany · North Rhine-Westphalia", cap: "10-25 MW", capex: "€20-25M", off: "92%", pub: true },
];

const Check = () => (
  <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg>
);

const Landing = () => {
  return (
    <PublicShell>
      <div className="lp">
        <style>{css}</style>

      {/* HERO */}
      <section className="hero">
        <div className="wrap hero-in">
          <h1>Where district heating <br />and cooling meets <span className="hl">capital.</span></h1>
          <p className="lead">A pan-European marketplace connecting DHC project developers with private investors, public co-financing, and the advisors who structure bankable deals.</p>
          <div className="hero-cta">
            <Link className="btn btn-primary" to="/sign-in?redirect=/app/opportunities">Explore projects →</Link>
            <Link className="btn btn-ghost" to="/for-developers">For developers</Link>
          </div>
          <p className="hero-note">The project marketplace is open to verified members. Creating an account takes a minute.</p>
        </div>
      </section>

      {/* STATS BAND */}
      <section className="stats-band">
        <div className="wrap">
          <div className="sb-stat"><div className="n"><span className="u">€</span>2.4B<span className="u">+</span></div><div className="l">Pipeline value</div><div className="note">illustrative - wire to live data</div></div>
          <div className="sb-stat"><div className="n">120<span className="u">+</span></div><div className="l">Projects listed</div><div className="note">illustrative - wire to live data</div></div>
          <div className="sb-stat"><div className="n">45<span className="u">+</span></div><div className="l">Active investors</div><div className="note">illustrative - wire to live data</div></div>
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
            <p className="big">Heating and cooling is roughly <b>half of Europe's energy use</b>, yet DHC investment stays fragmented, locally idiosyncratic, and over-reliant on public budgets. Every project is evaluated from scratch, in a different format, under a different national regime. <b>DHC Market closes that gap</b> by presenting projects in one standard, comparable structure, and connecting them to the capital and expertise to deliver.</p>
            <div className="stat-row">
              <div className="stat"><div className="n">~50%</div><div className="l">of EU energy use is heating &amp; cooling</div></div>
              <div className="stat"><div className="n">~25%</div><div className="l">renewable share in H&amp;C (2022)</div></div>
              <div className="stat"><div className="n">3 layers</div><div className="l">private · public · advisory</div></div>
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
            <p>We don't invest, underwrite, or advise. We standardize information and make the right introductions.</p>
          </div>
          <div className="pillar-grid">
            <div className="pillar">
              <div className="ic"><svg viewBox="0 0 24 24"><path d="M4 12h16M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l-4 4" /></svg></div>
              <h3>Connect</h3>
              <p>Standardized, comparable projects matched to private capital across the EU, with controlled, step-by-step disclosure.</p>
              <span className="tag">Core marketplace</span>
            </div>
            <div className="pillar">
              <div className="ic"><svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" /></svg></div>
              <h3>De-risk with public capital</h3>
              <p>Route projects to EIB, EU programmes, and national development funds (EIFO, IFU) so public co-financing lowers risk and draws in private investment.</p>
              <span className="tag">Free</span>
            </div>
            <div className="pillar">
              <div className="ic"><svg viewBox="0 0 24 24"><path d="M12 3l2.5 5 5.5.8-4 4 1 5.5L12 21l-5-2.7 1-5.5-4-4 5.5-.8z" /></svg></div>
              <h3>Structure with experts</h3>
              <p>Access vetted financial, legal, and technical advisors to bring projects to bankable standard, including aggregation into investable portfolios.</p>
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
            <p className="l">So you spend your time evaluating opportunities, not deciphering them. Each listing presents the same standardized technical, financial, regulatory, and sustainability fields, with European benchmarks for context.</p>
            <ul>
              <li><Check />Technical: heat source, network efficiency, contracted connections</li>
              <li><Check />Financial: capital stack, revenue model, regulatory revenue caps</li>
              <li><Check />Regulatory: national tariff regime, concession framework, EU comparison</li>
              <li><Check />Sustainability: Taxonomy, EED, RED III, DNSH, verified by named bodies</li>
            </ul>
          </div>
          <div className="snap-card">
            <div className="snap-tabs"><span className="on">Overview</span><span>Technical</span><span>Financial</span><span>Regulatory</span></div>
            <div className="snap-rows">
              <div className="srow"><span className="k">Technology</span><span className="v">Waste-heat recovery</span></div>
              <div className="srow"><span className="k">Location</span><span className="v">France · Auvergne-Rhône-Alpes</span></div>
              <div className="srow"><span className="k">Capacity</span><span className="v">5-10 MW</span></div>
              <div className="srow"><span className="k">Contracted connections</span><span className="v">87%</span></div>
              <div className="srow"><span className="k">Heat-source type</span><span className="v">Industrial waste heat</span></div>
              <div className="srow"><span className="k">Financial case</span><span className="v">Unlock after approval</span></div>
              <div className="srow"><span className="k">Public co-financing</span><span className="v" style={{ color: "#5bc88a" }}>Committed</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* MARKETPLACE PREVIEW */}
      <section className="tz-sec">
        <div className="wrap">
          <div className="tz-head">
            <h2>A glimpse of the marketplace</h2>
            <p>A sample of live opportunities, shown anonymized. Create a free account to explore the full marketplace and unlock standardized project detail.</p>
          </div>
          <div className="tz-grid">{previewProjects.map((project) => <ProjectCard key={project.id} project={project} context="public" />)}</div>
          <div className="tz-cta">
            <Link className="tz-btn" to="/sign-in?redirect=/app/opportunities">Start Exploring →</Link>
            <div className="tz-note">Free to join. Browsing is anonymized; identities reveal only when you choose to connect.</div>
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
              <div className="step"><div className="num">1</div><p>List your project at no cost, in the standard format investors expect.</p></div>
              <div className="step"><div className="num">2</div><p>Surface eligible public co-financing and connect with advisors to reach bankable standard.</p></div>
              <div className="step"><div className="num">3</div><p>Receive qualified interest from investors and manage Q&amp;A from one dashboard.</p></div>
              <div className="step"><div className="num">4</div><p>Engage directly and progress toward financial close.</p></div>
            </div>
            <div className="track">
              <h3>For investors</h3>
              <div className="step"><div className="num">1</div><p>Browse anonymized opportunities and filter to your mandate.</p></div>
              <div className="step"><div className="num">2</div><p>Open a standardized overview to assess fit before committing time.</p></div>
              <div className="step"><div className="num">3</div><p>Express interest to unlock full project identity, detail, and the data room.</p></div>
              <div className="step"><div className="num">4</div><p>Engage the developer directly; we facilitate, you decide.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* TRACTION */}
      <section className="traction">
        <div className="wrap">
          <span className="eyebrow">Early access</span>
          <h3>We're onboarding our first cohort of projects and investors now.</h3>
          <p>DHC Market is built on European energy data and the regulatory frameworks that govern district-energy finance. If you're developing or financing DHC, you can help shape the standard.</p>
          <div className="cta-btns">
            <Link className="btn btn-primary" to="/for-developers">For developers</Link>
            <Link className="btn btn-dark" to="/for-investors">For investors</Link>
          </div>
        </div>
      </section>

      {/* FRAMEWORKS */}
      <section className="frames">
        <div className="wrap">
          <h2>Aligned with the frameworks that govern DHC finance</h2>
          <p className="sub">Project data is structured around the European standards investors are required to assess against.</p>
          <div className="frame-row">
            <div className="chip">EU Taxonomy <small>Climate mitigation</small></div>
            <div className="chip">Energy Efficiency Directive <small>Efficient DHC (Arts. 24-26)</small></div>
            <div className="chip">Renewable Energy Directive III <small>DHC targets</small></div>
            <div className="chip">SFDR <small>Article 8 / 9 classification</small></div>
            <div className="chip">DNSH <small>Do No Significant Harm</small></div>
          </div>
          <p className="disclaimer">DHC Market structures projects around these frameworks. Compliance for any individual project is assessed and stated by the developer or named third-party assessors, not by DHC Market.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="wrap">
          <h2>Raising capital, or deploying it?</h2>
          <p>Start with a clearer view of the European DHC pipeline.</p>
          <div className="cta-btns">
            <Link className="btn btn-primary" to="/sign-in?redirect=/app/opportunities">Explore projects →</Link>
            <Link className="btn btn-ghost" to="/for-developers">For developers</Link>
          </div>
        </div>
      </section>

      </div>
    </PublicShell>
  );
};

export default Landing;

import { useState } from "react";
import { COLOR, FONT, SPACE, RADIUS, SHADOW } from "../constants/tokens.js";
import { Card } from "../components/ui/index.js";

const PHASES = [
  {
    emoji: "🎯", title: "Week 1–2: Validate & Set Up",
    color: COLOR.brand500,
    steps: [
      {
        icon: "1",
        head: "Deploy your stack (zero upfront cost)",
        body: "Push this app to Vercel (free tier — takes 3 minutes). Register a domain on Namecheap (~$10/yr). Set up Lemon Squeezy for subscriptions (no monthly fee — only 5% + $0.50 per transaction, so you pay nothing until you earn). Get your Anthropic API key at console.anthropic.com. Total Day 1 cost: ~$10.",
      },
      {
        icon: "2",
        head: "Define your ICP with surgical precision",
        body: "Your ideal customer: solo freelancers (web designers, developers, copywriters) with 5–15 active clients, earning $3K–$15K/month, who currently track everything in Notion or spreadsheets. They're in pain daily. Find them on Twitter/X (#freelance), Reddit (r/freelance, r/webdev), and LinkedIn. Do not try to serve everyone — serve this person only at first.",
      },
      {
        icon: "3",
        head: "Post in 5 communities for 50 beta users",
        body: "Post in r/freelance, r/webdev, r/graphic_design, r/forhire, and Indie Hackers. Framing: 'I built a free AI CRM for freelancers that drafts your follow-up emails automatically — looking for 50 beta testers for honest feedback.' Don't pitch. Ask for feedback. Aim for 50 signups in Week 1.",
      },
      {
        icon: "4",
        head: "DM 30 target freelancers on LinkedIn",
        body: "Search 'freelance designer' or 'freelance developer'. Send: 'Hey [Name] — I built a CRM for freelancers with AI email drafting built in. Would you try it free and give me 10 min of feedback?' Close 5–10 testers. These early conversations are worth more than any marketing campaign.",
      },
    ],
  },
  {
    emoji: "💰", title: "Week 3–4: First Revenue",
    color: COLOR.success600,
    steps: [
      {
        icon: "5",
        head: "Set your 3-tier pricing",
        body: "Free: 3 clients, no AI. Pro ($39/mo): unlimited clients + full AI drafts + invoice tracking. Agency ($79/mo): 3 team members + white-label. Offer your 50 beta users a permanent 50% discount ($19.50/mo) if they convert before your launch date. You need 26 Pro users to hit $1,000 MRR.",
      },
      {
        icon: "6",
        head: "Convert beta → paid with urgency",
        body: "Email all beta users on Day 7: 'The free beta closes Friday. You've [used X features] — lock in 50% off forever as a founding member.' Expect 10–20% conversion. 50 beta users → 5–10 paying = $200–$500 MRR from week one. Every founding member is also a testimonial source.",
      },
      {
        icon: "7",
        head: "Launch on Product Hunt (Thursday)",
        body: "Schedule for Thursday 12:01 AM EST. Prepare: a 60-second screen recording GIF, 5 high-quality screenshots, and a punchy tagline ('The AI CRM freelancers actually use'). Brief your 50 beta users to upvote at launch. Top 5 Product of the Day = 500–2,000 new signups in 24 hours. This alone can take you from $0 to $1K MRR.",
      },
      {
        icon: "8",
        head: "Start a daily Twitter/X content flywheel",
        body: "Post every weekday: client management tips, invoice email templates, follow-up scripts, MRR updates (#BuildInPublic). Consistency beats volume. 500 followers → 50 warm leads/month. Share your journey openly — 'We hit $500 MRR today' posts outperform any ad. This compounds over months.",
      },
    ],
  },
  {
    emoji: "📈", title: "Month 2–3: Scale to $5K MRR",
    color: COLOR.purple500,
    steps: [
      {
        icon: "9",
        head: "Launch a referral program",
        body: "Add in-app: 'Give a friend 1 month free — get 1 month free.' Each satisfied user brings 1.2 more on average. At 50 users this nets 60 referrals. Use ReferralHero ($49/mo) to automate tracking and reward delivery. This is the highest-ROI growth channel at this stage — don't skip it.",
      },
      {
        icon: "10",
        head: "Start YouTube Shorts / TikTok tutorials",
        body: "'How I follow up with 20 clients in 10 minutes using AI' — record a 3-min screen share. Post on YouTube Shorts and TikTok with #freelance #productivity hashtags. Freelancer content gets 5K–100K views organically. One viral video = 100–500 new signups. Batch-record 10 videos in one sitting.",
      },
      {
        icon: "11",
        head: "Partner with freelance educators",
        body: "Find 5 freelance coaches on YouTube/Twitter with 10K+ followers. Offer 30% recurring affiliate commission. One good partner can bring 50–200 paid users. Use Lemon Squeezy's built-in affiliate tracking — zero extra work. This is your biggest lever at this stage.",
      },
      {
        icon: "12",
        head: "Add real invoice sending + Stripe payments",
        body: "Integrate Stripe so users can send real invoices and collect payment inside ClientPulse. This is your biggest retention feature — users who collect money inside the tool have 3× lower churn. You can also charge a 0.5% platform fee on payments processed, creating a second revenue stream.",
      },
    ],
  },
  {
    emoji: "🚀", title: "Month 4–6: $10K+ MRR",
    color: COLOR.warning600,
    steps: [
      {
        icon: "★",
        head: "SEO content machine",
        body: "Write 20 blog posts targeting: 'crm for freelancers', 'how to follow up with clients', 'freelance invoice template', 'client management software'. Each post brings 50–500 free monthly visitors. Use Ahrefs (7-day free trial) to find keywords with low competition. SEO compounds — by month 6 it's your largest traffic source.",
      },
      {
        icon: "★",
        head: "Public changelog + user roadmap voting",
        body: "Users stay when they feel heard. Post every feature update publicly. Ask users to vote on what to build next via Canny.io (free plan). Users who submit feature requests have 4× lower churn. Ship one user-requested feature per week — post about it every time. This is community-building disguised as product work.",
      },
      {
        icon: "★",
        head: "Move upmarket: agency plan",
        body: "Small agencies manage 20–100 clients and pay $149–$299/month without blinking. Add: shared client workspace, role-based permissions, team AI credits, client portal (read-only view for clients). One agency = 5–8× the revenue of one solo user. Your first 3 agency customers take you from $5K to $8K MRR instantly.",
      },
      {
        icon: "★",
        head: "AppSumo marketplace deal",
        body: "Apply at appsumo.com/sell. AppSumo promotes you to their 1M+ buyer list. Typical deal: $69–$99 lifetime access, 30–40% goes to you. Target 300 sales = $6K–$12K in one week + 300 vocal advocates who spread your product. This is the fastest path to escaping the early trough and building momentum toward $10K MRR.",
      },
    ],
  },
];

const METRICS = [
  { month: "Month 1",  mrr: "$500",     users: "13 paid",  cac: "$0",   action: "Beta → paid conversion" },
  { month: "Month 2",  mrr: "$1,500",   users: "38 paid",  cac: "$12",  action: "Product Hunt + referrals" },
  { month: "Month 3",  mrr: "$3,500",   users: "90 paid",  cac: "$18",  action: "Content flywheel + affiliates" },
  { month: "Month 6",  mrr: "$10,000",  users: "256 paid", cac: "$25",  action: "SEO + agency plan" },
  { month: "Month 12", mrr: "$30,000+", users: "750+ paid", cac: "$30", action: "Self-serve + expansion revenue" },
];

const STACK = [
  { tool: "Vercel",       use: "Hosting",                 cost: "Free"           },
  { tool: "Supabase",     use: "Database + auth",         cost: "Free"           },
  { tool: "Anthropic API",use: "AI email drafts",         cost: "~$0.003/draft"  },
  { tool: "Lemon Squeezy",use: "Subscriptions",           cost: "5% fee only"    },
  { tool: "Resend",       use: "Transactional email",     cost: "Free to 3K/mo"  },
  { tool: "PostHog",      use: "Analytics",               cost: "Free to 1M/mo"  },
  { tool: "Canny",        use: "Feature roadmap",         cost: "Free"           },
  { tool: "ReferralHero", use: "Referral program",        cost: "$49/mo"         },
];

export function LaunchGuidePage() {
  const [openPhase, setOpenPhase] = useState(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: SPACE[6] }}>

      {/* Hero */}
      <div style={{
        background:   `linear-gradient(135deg, ${COLOR.slate900} 0%, #1e1b4b 100%)`,
        borderRadius: RADIUS.xxl,
        padding:      `${SPACE[8]}px`,
        color:        COLOR.white,
        boxShadow:    SHADOW.xl,
      }}>
        <div style={{ fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.5, marginBottom: SPACE[3] }}>
          Your step-by-step playbook
        </div>
        <div style={{ fontSize: FONT.size.hero + 4, fontWeight: FONT.weight.extrabold, letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: SPACE[4] }}>
          From $0 to $10K MRR<br />in 6 months.
        </div>
        <div style={{ fontSize: FONT.size.base, opacity: 0.65, lineHeight: FONT.lineHeight.relaxed, maxWidth: 560 }}>
          A realistic, no-fluff launch roadmap built specifically for ClientPulse. Follow each phase in order.{" "}
          <strong style={{ color: COLOR.brand200 }}>
            The #1 mistake founders make is trying to scale before they have 10 paying customers.
          </strong>{" "}
          Don't skip ahead.
        </div>
      </div>

      {/* Phases */}
      <div style={{ display: "flex", flexDirection: "column", gap: SPACE[3] }}>
        {PHASES.map((phase, pi) => (
          <Card key={pi} style={{ overflow: "hidden" }}>
            <button
              onClick={() => setOpenPhase(openPhase === pi ? -1 : pi)}
              style={{
                width:      "100%",
                display:    "flex",
                alignItems: "center",
                gap:        SPACE[4],
                padding:    `${SPACE[4]}px ${SPACE[6]}px`,
                background: "none",
                border:     "none",
                cursor:     "pointer",
                fontFamily: FONT.family,
                textAlign:  "left",
              }}
            >
              <span style={{ fontSize: 22 }}>{phase.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: FONT.size.md, fontWeight: FONT.weight.bold, color: COLOR.slate900 }}>
                  {phase.title}
                </div>
              </div>
              <div style={{
                width:          28, height: 28, borderRadius: "50%",
                background:     phase.color + "18",
                color:          phase.color,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontSize:       FONT.size.md,
                fontWeight:     FONT.weight.bold,
                flexShrink:     0,
              }}>
                {openPhase === pi ? "−" : "+"}
              </div>
            </button>

            {openPhase === pi && (
              <div style={{ borderTop: `1px solid ${COLOR.slate100}`, padding: `${SPACE[5]}px ${SPACE[6]}px`, display: "flex", flexDirection: "column", gap: SPACE[5] }}>
                {phase.steps.map((step, si) => (
                  <div key={si} style={{ display: "flex", gap: SPACE[4] }}>
                    <div style={{
                      width:          32, height: 32, borderRadius: "50%",
                      background:     phase.color + "15",
                      color:          phase.color,
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                      fontSize:       FONT.size.sm,
                      fontWeight:     FONT.weight.extrabold,
                      flexShrink:     0,
                      marginTop:      2,
                    }}>
                      {step.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: FONT.weight.bold, fontSize: FONT.size.md, color: COLOR.slate900, marginBottom: SPACE[1] }}>
                        {step.head}
                      </div>
                      <div style={{ fontSize: FONT.size.base, color: COLOR.slate600, lineHeight: FONT.lineHeight.relaxed }}>
                        {step.body}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Revenue projections */}
      <Card>
        <div style={{ padding: `${SPACE[4]}px ${SPACE[6]}px`, borderBottom: `1px solid ${COLOR.slate100}`, fontWeight: FONT.weight.bold, fontSize: FONT.size.md, color: COLOR.slate900 }}>
          📊 Realistic revenue projections
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLOR.slate50 }}>
                {["Month", "MRR Target", "Paid Users", "Avg CAC", "Key lever"].map((h) => (
                  <th key={h} style={{ padding: `${SPACE[3]}px ${SPACE[5]}px`, fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, color: COLOR.slate400, textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((r, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${COLOR.slate100}` }}>
                  <td style={{ padding: `${SPACE[4]}px ${SPACE[5]}px`, fontSize: FONT.size.base, fontWeight: FONT.weight.bold, color: COLOR.slate900 }}>{r.month}</td>
                  <td style={{ padding: `${SPACE[4]}px ${SPACE[5]}px`, fontSize: FONT.size.base, fontWeight: FONT.weight.extrabold, color: COLOR.success600 }}>{r.mrr}</td>
                  <td style={{ padding: `${SPACE[4]}px ${SPACE[5]}px`, fontSize: FONT.size.base, color: COLOR.slate700 }}>{r.users}</td>
                  <td style={{ padding: `${SPACE[4]}px ${SPACE[5]}px`, fontSize: FONT.size.base, color: COLOR.slate500 }}>{r.cac}</td>
                  <td style={{ padding: `${SPACE[4]}px ${SPACE[5]}px`, fontSize: FONT.size.sm, color: COLOR.slate600 }}>{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Tool stack */}
      <Card style={{ padding: `${SPACE[5]}px ${SPACE[6]}px` }}>
        <div style={{ fontWeight: FONT.weight.bold, fontSize: FONT.size.md, color: COLOR.slate900, marginBottom: SPACE[4] }}>
          🛠 Essential tool stack (mostly free)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: SPACE[3] }}>
          {STACK.map((t) => (
            <div key={t.tool} style={{
              display:        "flex",
              justifyContent: "space-between",
              alignItems:     "center",
              background:     COLOR.slate50,
              borderRadius:   RADIUS.md,
              padding:        `${SPACE[3]}px ${SPACE[4]}px`,
              border:         `1px solid ${COLOR.slate200}`,
            }}>
              <div>
                <div style={{ fontSize: FONT.size.base, fontWeight: FONT.weight.bold, color: COLOR.slate900 }}>{t.tool}</div>
                <div style={{ fontSize: FONT.size.xs, color: COLOR.slate500 }}>{t.use}</div>
              </div>
              <span style={{
                fontSize:   FONT.size.xs, fontWeight: FONT.weight.bold,
                color:      COLOR.success600, background: COLOR.success100,
                padding:    "3px 9px", borderRadius: RADIUS.full,
              }}>
                {t.cost}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

<div align="center">
  <h1>⚡ ClientPulse</h1>
  <p><strong>AI-powered CRM for freelancers and consultants</strong></p>
  <p>Track clients · Send invoices · Auto-draft follow-ups with AI · Visualise your pipeline</p>

  ![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
  ![Claude AI](https://img.shields.io/badge/Claude-Sonnet_4.6-6366f1?style=flat-square)
  ![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
  ![Status](https://img.shields.io/badge/Status-Active-success?style=flat-square)
</div>

---

## ✨ What is ClientPulse?

ClientPulse is a glassmorphic, AI-powered CRM built specifically for freelancers who are tired of:

- Forgetting to follow up with clients for weeks
- Awkwardly chasing overdue invoices
- Tracking everything in a Notion doc they kind of hate
- Writing the same "just checking in" email for the 50th time

**ClientPulse fixes all of that** — with AI that drafts the perfect email in one click.

---

## 🚀 Features

| Feature | Description |
|---|---|
| **Dashboard** | Revenue chart, pipeline stats, alerts, activity feed |
| **Client CRM** | Card-based client management with payment progress tracking |
| **AI Email Drafts** | 6 quick-action prompts — invoice reminders, check-ins, upsells, wrap-ups |
| **Invoice Tracker** | Create, send, and mark invoices paid. Auto-syncs client balances |
| **Task Manager** | Priority-based tasks linked to clients with overdue detection |
| **Pipeline Board** | Kanban view across Prospect → Active → Overdue → Completed |
| **Launch Guide** | Built-in $0→$10K MRR roadmap with week-by-week action steps |

---

## 🎨 Design

Full **glassmorphism** UI — frosted glass surfaces, ambient glow orbs, translucent cards, gradient buttons with color-matched shadows. Dark-first design built for focus.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (hooks, useReducer) |
| AI | Anthropic Claude Sonnet 4.6 |
| Styling | Inline design tokens (no CSS framework) |
| State | useReducer + useMemo derived state |
| Deployment | Vercel (recommended) |
| Payments | Lemon Squeezy (recommended) |
| Database | Supabase (recommended for persistence) |

---

## ⚡ Quick Start

### 1. Clone & install

```bash
git clone https://github.com/Naveen001-max/clientpulse.git
cd clientpulse
```

### 2. Deploy to Vercel (fastest)

```bash
npm i -g vercel
vercel
```

### 3. Use the single-file version

The file `clientpulse_glass.jsx` is a fully self-contained React component. Drop it into any React project:

```jsx
import ClientPulse from './clientpulse_glass';

function App() {
  return <ClientPulse />;
}
```

### 4. Add your Anthropic API key

The AI features call the Anthropic API directly. In production, proxy this through your backend so the key is never exposed client-side:

```js
// In a Next.js API route or Express server
const response = await fetch('https://api.anthropic.com/v1/messages', {
  headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY }
  // ...
});
```

---

## 📁 Project Structure

```
clientpulse/
├── src/
│   ├── constants/
│   │   ├── tokens.js          # Design tokens (colors, spacing, typography)
│   │   ├── domain.js          # Business constants (statuses, nav, AI actions)
│   │   └── seed.js            # Demo data
│   ├── utils/
│   │   └── index.js           # Pure utility functions
│   ├── services/
│   │   └── aiService.js       # Anthropic API service layer
│   ├── hooks/
│   │   ├── useAIChat.js       # AI chat state hook
│   │   └── useFilter.js       # Reusable search + filter hook
│   ├── store/
│   │   └── useAppStore.js     # Central useReducer store
│   ├── components/
│   │   ├── ui/                # Design system primitives
│   │   ├── layout/            # Sidebar, Topbar
│   │   └── features/          # AI Panel, Client components
│   └── pages/                 # Dashboard, Clients, Invoices, Tasks, Pipeline, Launch
├── clientpulse_glass.jsx      # Single-file deployable build
└── README.md
```

---

## 💰 Monetisation Roadmap

| Month | Target | Strategy |
|---|---|---|
| 1 | $500 MRR | Beta users → paid ($39/mo Pro) |
| 2 | $1,500 MRR | Product Hunt + referral program |
| 3 | $3,500 MRR | Content flywheel + affiliate partners |
| 6 | $10,000 MRR | SEO + agency plan ($79/mo) |
| 12 | $30,000+ MRR | Self-serve + expansion revenue |

---

## 🗺 Roadmap

- [ ] Supabase auth + persistent storage
- [ ] Real invoice sending (PDF generation + email)
- [ ] Stripe payment collection inside app
- [ ] Email automation sequences
- [ ] Client portal (read-only view for clients)
- [ ] Team workspace (agency plan)
- [ ] Mobile app (React Native)
- [ ] Zapier / Make integrations

---

## 📄 License

MIT — free to use, modify, and commercialise.

---

<div align="center">
  <p>Built with ⚡ and AI · <a href="https://github.com/Naveen001-max/clientpulse">Star this repo</a> if it helped you</p>
</div>

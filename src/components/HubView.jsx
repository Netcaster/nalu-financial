import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, AlertTriangle, ArrowRight, Bell, Bot, Brain,
  Building2, CheckCircle2, Coins, Eye, FileText, Filter,
  Globe2, KeyRound, LineChart, Lock, PlugZap, Search,
  ShieldCheck, Sparkles, Users, Wallet, Zap,
} from 'lucide-react';

const modules = [
  {
    title: 'Personal Command Center',
    icon: Eye,
    status: 'Build first',
    text: 'A private dashboard for Carl to view crypto, stocks, ETFs, watchlists, AI research, DeFAI opportunities, and portfolio risk in one place.',
  },
  {
    title: 'Wallet Intelligence',
    icon: Wallet,
    status: 'Read-only MVP',
    text: 'MetaMask and WalletConnect will be added later in read-only mode. No passwords, seed phrases, or private keys are ever collected.',
  },
  {
    title: 'Exchange Import Layer',
    icon: PlugZap,
    status: 'Placeholder ready',
    text: 'Kraken, Coinbase, Binance, and other crypto accounts can be supported later through CSV imports or limited-permission APIs.',
  },
  {
    title: 'Fidelity / Stock Intelligence',
    icon: LineChart,
    status: 'CSV first',
    text: 'Fidelity and stock accounts should start with CSV uploads or manual watchlists, then later support broker APIs when available and safe.',
  },
  {
    title: 'AI Research Memory',
    icon: Brain,
    status: 'Core advantage',
    text: 'A RAG-based research archive stores investment theses, token diligence, stock notes, watchlist changes, alerts, and market commentary.',
  },
  {
    title: 'Risk & Compliance Guardrails',
    icon: ShieldCheck,
    status: 'Required',
    text: 'No autonomous trading at launch. Every proposed trade, rebalance, DeFi action, or wallet interaction requires human approval.',
  },
  {
    title: 'DeFAI Opportunity Scanner',
    icon: Bot,
    status: 'Phase 2',
    text: 'Scan staking, stablecoin yield, protocol TVL, wallet flows, governance activity, token unlocks, AI-agent projects, and smart-contract risk signals.',
  },
  {
    title: 'Alert Engine',
    icon: Bell,
    status: 'Monetizable MVP',
    text: 'Send email, Telegram, Discord, SMS, or dashboard alerts when watchlist, risk, wallet, stock, or DeFAI conditions are triggered.',
  },
  {
    title: 'Commercial NaluAsk Version',
    icon: Building2,
    status: 'Phase 3',
    text: 'After the personal dashboard works, package it as a client-facing AI financial intelligence product with subscriptions, credits, and enterprise tiers.',
  },
];

const alerts = [
  { type: 'Risk',        title: 'High token concentration', detail: 'One asset is above 45% of tracked crypto exposure.',                               severity: 'High'   },
  { type: 'Opportunity', title: 'AI sector momentum',       detail: 'AI infrastructure tokens are outperforming large-cap crypto over the last 7 days.',  severity: 'Medium' },
  { type: 'DeFi',        title: 'Stablecoin yield changed', detail: 'A monitored pool APY moved outside your target range.',                              severity: 'Medium' },
  { type: 'Security',    title: 'Approval review needed',   detail: 'One wallet approval should be reviewed before additional DeFi activity.',             severity: 'High'   },
  { type: 'Stocks',      title: 'AI stock overlap',         detail: 'Traditional AI stock exposure may overlap with DeFAI crypto exposure.',               severity: 'Medium' },
];

const actionQueue = [
  { action: 'Rebalance suggestion', decision: 'Review only', note: 'AI recommends reducing concentration before adding DeFAI exposure.' },
  { action: 'Stablecoin yield scan', decision: 'Research',   note: 'Compare protocol risk before depositing funds.'                     },
  { action: 'Token diligence',       decision: 'Pending',    note: 'Review team, token utility, unlocks, GitHub, liquidity, and TVL.'   },
  { action: 'Stock exposure review', decision: 'Analyze',    note: 'Compare Fidelity AI/tech exposure with crypto AI-token exposure.'   },
];

const stack = [
  ['Frontend',       'React + Vite on Cloudflare Pages'],
  ['Backend',        'Node.js API on DigitalOcean (Docker)'],
  ['Database',       'PostgreSQL + NocoBase admin layer'],
  ['Memory',         'Qdrant vector DB for RAG research archive'],
  ['AI',             'Claude Haiku / Sonnet via NaluAsk widget'],
  ['Wallet',         'MetaMask + WalletConnect read-only first'],
  ['Exchange Data',  'Kraken/Coinbase CSV first, APIs later'],
  ['Market Data',    'CoinGecko, Binance WS, TradingView, DefiLlama'],
  ['Alerts',         'Make.com automation → email, Telegram, Discord, SMS'],
];

const roadmap = [
  {
    phase: 'Phase 1',
    title: 'Personal Dashboard',
    done: true,
    details: 'Private command center with live crypto/stock data, watchlists, DeFAI scanner, AI research notes, and TradingView charts.',
  },
  {
    phase: 'Phase 2',
    title: 'Read-Only Data Connections',
    done: false,
    details: 'MetaMask/WalletConnect public wallet reads, Kraken CSV import, Fidelity CSV import, and expanded market data feeds.',
  },
  {
    phase: 'Phase 3',
    title: 'AI Research + RAG Memory',
    done: false,
    details: 'Index notes, reports, watchlists, theses, alerts, token diligence, stock analysis, and market summaries into searchable memory.',
  },
  {
    phase: 'Phase 4',
    title: 'Alerts + Client Product',
    done: false,
    details: 'Turn personal intelligence into a commercial NaluAsk product with client dashboards, credits, alerts, and enterprise reporting.',
  },
];

const sampleWatchlists = [
  ['Crypto Core',        'BTC, ETH, SOL, stablecoins'],
  ['DeFAI / AI Tokens',  'TAO, FET/ASI, OCEAN, OLAS, AGIX, RENDER, WLD'],
  ['AI Stocks',          'NVDA, AMD, MSFT, GOOGL, AMZN, COIN, MSTR'],
  ['Infrastructure',     'Data centers, cloud, cybersecurity, energy, semiconductor ETFs'],
];

const FILTER_OPTS = ['All', 'Build', 'Read', 'CSV', 'Core', 'Required', 'Phase', 'Placeholder'];

/* ─── tiny reusable primitives ─────────────────────────────────────────── */

function HubCard({ children, style = {}, gradient = false }) {
  const base = {
    background: gradient
      ? 'linear-gradient(135deg, var(--card2) 0%, var(--bg2) 60%, color-mix(in srgb,var(--teal) 6%,transparent) 100%)'
      : 'var(--card)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '1rem',
    ...style,
  };
  return <div style={base}>{children}</div>;
}

function SeverityBadge({ severity }) {
  const isHigh = severity === 'High';
  return (
    <span style={{
      padding: '2px 10px',
      borderRadius: '999px',
      fontSize: '11px',
      background: isHigh ? 'rgba(255,69,96,0.15)' : 'rgba(251,191,36,0.15)',
      color:      isHigh ? '#ff8fa0'               : '#fde68a',
    }}>
      {severity}
    </span>
  );
}

function DecisionBadge({ label }) {
  return (
    <span style={{
      padding: '2px 10px',
      borderRadius: '999px',
      fontSize: '11px',
      background: 'rgba(20,188,189,0.12)',
      color: 'var(--teal)',
    }}>
      {label}
    </span>
  );
}

/* ─── main view ─────────────────────────────────────────────────────────── */

export default function HubView({ theme }) {
  const [filter, setFilter] = useState('All');

  const filteredModules = useMemo(() => {
    if (filter === 'All') return modules;
    return modules.filter(m => m.status.toLowerCase().includes(filter.toLowerCase()));
  }, [filter]);

  return (
    <div style={{ padding: '24px 28px 48px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          borderRadius: '2rem',
          border: '1px solid rgba(20,188,189,0.18)',
          background: 'linear-gradient(135deg, var(--bg2) 0%, var(--bg) 60%, color-mix(in srgb,var(--teal) 7%,transparent) 100%)',
          padding: '40px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '32px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: '999px',
            border: '1px solid rgba(20,188,189,0.25)',
            background: 'rgba(20,188,189,0.1)',
            width: 'fit-content',
            fontSize: '13px',
            color: 'var(--teal)',
          }}>
            <Sparkles size={14} /> Nalu Financial Intelligence
          </div>
          <h1 style={{ fontSize: 'clamp(26px,4vw,48px)', fontWeight: 700, lineHeight: 1.15, color: 'var(--txt)', margin: 0 }}>
            Your AI command center for crypto, stocks, DeFAI, and financial memory.
          </h1>
          <p style={{ fontSize: '16px', color: 'var(--txt2)', margin: 0, maxWidth: '600px', lineHeight: 1.7 }}>
            Built first as Carl's personal dashboard, then expandable into a commercial NaluAsk financial intelligence product for clients.
          </p>
        </div>

        <HubCard style={{ flex: '0 0 300px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
            <KeyRound size={28} color="var(--teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontWeight: 600, margin: '0 0 4px', color: 'var(--txt)' }}>Security Rule #1</p>
              <p style={{ fontSize: '13px', color: 'var(--txt2)', margin: 0 }}>
                No seed phrases. No private keys. No broker passwords. Ever.
              </p>
            </div>
          </div>
          <button style={{
            width: '100%',
            padding: '10px',
            borderRadius: '12px',
            border: 'none',
            background: 'var(--teal)',
            color: '#040d14',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}>
            Dashboard is Live <ArrowRight size={15} />
          </button>
        </HubCard>
      </motion.div>

      {/* ── Status tiles ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Starting Mode',   value: 'Personal dashboard',    Icon: Eye       },
          { label: 'Commercial Path', value: 'NaluAsk client product', Icon: Users     },
          { label: 'Connections',     value: 'Placeholders ready',    Icon: PlugZap   },
          { label: 'Execution',       value: 'Human approval only',   Icon: Lock      },
        ].map(({ label, value, Icon }) => (
          <HubCard key={label} style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Icon size={26} color="var(--teal)" style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '11px', color: 'var(--txt3)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</p>
              <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--txt)', margin: 0 }}>{value}</p>
            </div>
          </HubCard>
        ))}
      </div>

      {/* ── Build Modules ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--txt)', margin: 0 }}>Build Modules</h2>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          borderRadius: '14px',
          border: '1px solid rgba(255,255,255,0.07)',
          background: 'var(--card)',
        }}>
          <Filter size={13} color="var(--txt3)" />
          {FILTER_OPTS.map(x => (
            <button
              key={x}
              onClick={() => setFilter(x)}
              style={{
                padding: '4px 12px',
                borderRadius: '10px',
                border: 'none',
                fontSize: '12px',
                cursor: 'pointer',
                background: filter === x ? 'var(--teal)' : 'transparent',
                color:      filter === x ? '#040d14'     : 'var(--txt2)',
                fontWeight: filter === x ? 600            : 400,
                transition: 'all .15s',
              }}
            >
              {x}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '14px', marginBottom: '24px' }}>
        {filteredModules.map((m, i) => (
          <motion.div key={m.title} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
            <HubCard style={{ padding: '22px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <m.icon size={26} color="var(--teal)" />
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  background: 'rgba(255,255,255,0.08)',
                  color: 'var(--txt2)',
                }}>
                  {m.status}
                </span>
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--txt)', margin: 0 }}>{m.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--txt2)', lineHeight: 1.65, margin: 0 }}>{m.text}</p>
            </HubCard>
          </motion.div>
        ))}
      </div>

      {/* ── Alerts + Approval Queue ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: '16px', marginBottom: '24px' }}>

        {/* Sample AI Alerts */}
        <HubCard style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="var(--teal)" />
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt)', margin: 0 }}>Sample AI Alerts</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.map(a => (
              <div key={a.title} style={{
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'var(--card2)',
                padding: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--txt)', margin: 0 }}>{a.title}</p>
                  <SeverityBadge severity={a.severity} />
                </div>
                <p style={{ fontSize: '12px', color: 'var(--txt2)', margin: '0 0 6px', lineHeight: 1.55 }}>{a.detail}</p>
                <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--txt3)', margin: 0 }}>{a.type}</p>
              </div>
            ))}
          </div>
        </HubCard>

        {/* Human Approval Queue */}
        <HubCard style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={20} color="var(--teal)" />
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt)', margin: 0 }}>Human Approval Queue</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {actionQueue.map(a => (
              <div key={a.action} style={{
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.07)',
                background: 'var(--card2)',
                padding: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                  <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--txt)', margin: 0 }}>{a.action}</p>
                  <DecisionBadge label={a.decision} />
                </div>
                <p style={{ fontSize: '12px', color: 'var(--txt2)', margin: 0, lineHeight: 1.55 }}>{a.note}</p>
              </div>
            ))}
          </div>
          <div style={{
            borderRadius: '12px',
            border: '1px solid rgba(251,191,36,0.2)',
            background: 'rgba(251,191,36,0.08)',
            padding: '14px',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}>
            <AlertTriangle size={16} color="#fde68a" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '12px', color: '#fde68a', margin: 0, lineHeight: 1.6 }}>
              No autonomous trading, no private-key custody, no exchange withdrawal permission, and no AI wallet signing in the MVP.
            </p>
          </div>
        </HubCard>
      </div>

      {/* ── Starter Watchlists ───────────────────────────────────────────── */}
      <HubCard style={{ padding: '22px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Coins size={20} color="var(--teal)" />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt)', margin: 0 }}>Starter Watchlists</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '10px' }}>
          {sampleWatchlists.map(([k, v]) => (
            <div key={k} style={{
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'var(--card2)',
              padding: '14px',
            }}>
              <p style={{ fontSize: '11px', color: 'var(--txt3)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.05em' }}>{k}</p>
              <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--txt)', margin: 0 }}>{v}</p>
            </div>
          ))}
        </div>
      </HubCard>

      {/* ── Technical Stack ──────────────────────────────────────────────── */}
      <HubCard style={{ padding: '22px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Globe2 size={20} color="var(--teal)" />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt)', margin: 0 }}>Technical Stack</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '10px' }}>
          {stack.map(([k, v]) => (
            <div key={k} style={{
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'var(--card2)',
              padding: '14px',
            }}>
              <p style={{ fontSize: '11px', color: 'var(--txt3)', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.05em' }}>{k}</p>
              <p style={{ fontWeight: 600, fontSize: '13px', color: 'var(--txt)', margin: 0 }}>{v}</p>
            </div>
          ))}
        </div>
      </HubCard>

      {/* ── Build Roadmap ────────────────────────────────────────────────── */}
      <HubCard gradient style={{ padding: '22px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Zap size={20} color="var(--teal)" />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--txt)', margin: 0 }}>Build Roadmap</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '12px' }}>
          {roadmap.map(r => (
            <div key={r.phase} style={{
              borderRadius: '12px',
              border: `1px solid ${r.done ? 'rgba(0,211,149,0.25)' : 'rgba(255,255,255,0.07)'}`,
              background: r.done ? 'rgba(0,211,149,0.07)' : 'var(--card2)',
              padding: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <p style={{ fontSize: '12px', color: 'var(--teal)', margin: 0, fontWeight: 600 }}>{r.phase}</p>
                {r.done && <span style={{ fontSize: '11px', color: 'var(--green)', background: 'rgba(0,211,149,0.12)', padding: '2px 8px', borderRadius: '999px' }}>✓ Live</span>}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--txt)', margin: '0 0 8px' }}>{r.title}</h3>
              <p style={{ fontSize: '12px', color: 'var(--txt2)', lineHeight: 1.65, margin: 0 }}>{r.details}</p>
            </div>
          ))}
        </div>
      </HubCard>

      {/* ── Bottom 3-col summary ─────────────────────────────────────────── */}
      <HubCard style={{ padding: '22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '20px' }}>
          {[
            { Icon: Search,   title: 'Immediate Build',   body: 'Personal dashboard, sample data, watchlists, alerts, research notes, and risk cards.' },
            { Icon: Wallet,   title: 'Later Connections',  body: 'MetaMask, WalletConnect, Kraken, Fidelity, and other accounts added only when you are ready.' },
            { Icon: FileText, title: 'Commercial Path',    body: 'Package into a NaluAsk subscription/credits product for crypto, stock, and enterprise finance clients.' },
          ].map(({ Icon, title, body }) => (
            <div key={title} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Icon size={24} color="var(--teal)" />
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--txt)', margin: 0 }}>{title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--txt2)', lineHeight: 1.65, margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </HubCard>

    </div>
  );
}

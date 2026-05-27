export const CFG = {
  COINGECKO:    'https://api.coingecko.com/api/v3',
  BINANCE_REST: 'https://api.binance.com/api/v3',
  BINANCE_WS:   'wss://stream.binance.com:9443/ws',
  FEAR_GREED:   'https://api.alternative.me/fng/?limit=1',
  REFRESH_MS:   30000,
};

export const CG_TO_BINANCE = {
  bitcoin:'btcusdt', ethereum:'ethusdt', solana:'solusdt',
  binancecoin:'bnbusdt', ripple:'xrpusdt', cardano:'adausdt',
  'avalanche-2':'avaxusdt', dogecoin:'dogeusdt', polkadot:'dotusdt',
  chainlink:'linkusdt', 'matic-network':'maticusdt', uniswap:'uniusdt',
  litecoin:'ltcusdt', cosmos:'atomusdt', tron:'trxusdt', stellar:'xlmusdt',
  near:'nearusdt', aave:'aaveusdt', 'shiba-inu':'shibusdt', filecoin:'filusdt',
  aptos:'aptusdt', arbitrum:'arbusdt', optimism:'opusdt', 'injective-protocol':'injusdt',
  // DeFAI
  bittensor:'taousdt', 'fetch-ai':'fetusdt', 'ocean-protocol':'oceanusdt',
  autonolas:'olasusdt', singularitynet:'agixusdt', 'render-token':'renderusdt',
  'worldcoin-org':'wldusdt',
};

export const CG_TO_TV = {
  bitcoin:'BINANCE:BTCUSDT', ethereum:'BINANCE:ETHUSDT', solana:'BINANCE:SOLUSDT',
  binancecoin:'BINANCE:BNBUSDT', ripple:'BINANCE:XRPUSDT', cardano:'BINANCE:ADAUSDT',
  'avalanche-2':'BINANCE:AVAXUSDT', dogecoin:'BINANCE:DOGEUSDT', polkadot:'BINANCE:DOTUSDT',
  chainlink:'BINANCE:LINKUSDT', 'matic-network':'BINANCE:MATICUSDT', uniswap:'BINANCE:UNIUSDT',
  litecoin:'BINANCE:LTCUSDT', cosmos:'BINANCE:ATOMUSDT', tron:'BINANCE:TRXUSDT',
  near:'BINANCE:NEARUSDT', aave:'BINANCE:AAVEUSDT',
  aptos:'BINANCE:APTUSDT', arbitrum:'BINANCE:ARBUSDT',
  // DeFAI
  bittensor:'BINANCE:TAOUSDT', 'fetch-ai':'BINANCE:FETUSDT', 'ocean-protocol':'BINANCE:OCEANUSDT',
  autonolas:'BINANCE:OLASUSDT', singularitynet:'BINANCE:AGIXUSDT',
  'render-token':'BINANCE:RENDERUSDT', 'worldcoin-org':'BINANCE:WLDUSDT',
};

export const DEFAULT_WATCHLIST = [
  'bitcoin','ethereum','solana','binancecoin','ripple','cardano','dogecoin','avalanche-2',
];

export const DEFAI_TOKENS = [
  { id:'bittensor',               sym:'TAO',    name:'Bittensor',           tag:'AI Infrastructure' },
  { id:'fetch-ai',                sym:'FET',    name:'Fetch.ai / ASI',      tag:'AI Agents' },
  { id:'ocean-protocol',          sym:'OCEAN',  name:'Ocean Protocol',      tag:'Data Markets' },
  { id:'autonolas',               sym:'OLAS',   name:'Autonolas',           tag:'AI Agents' },
  { id:'singularitynet',          sym:'AGIX',   name:'SingularityNET',      tag:'AI Marketplace' },
  { id:'render-token',            sym:'RENDER', name:'Render Network',      tag:'GPU Compute' },
  { id:'worldcoin-org',           sym:'WLD',    name:'Worldcoin',           tag:'AI Identity' },
];

export const STOCKS = [
  { sym:'AAPL',  name:'Apple Inc.',          tv:'NASDAQ:AAPL',  sector:'Technology',    pe:28.5, eps:6.42, beta:1.24, div:'0.92%', avgvol:'55M',  float:'15.3B', short:'0.8%', mcap:'2.89T', high52:'236.09', low52:'164.08' },
  { sym:'MSFT',  name:'Microsoft',           tv:'NASDAQ:MSFT',  sector:'Technology',    pe:35.2, eps:11.45,beta:0.90, div:'0.73%', avgvol:'22M',  float:'7.4B',  short:'0.6%', mcap:'3.10T', high52:'468.35', low52:'309.72' },
  { sym:'NVDA',  name:'NVIDIA Corp',         tv:'NASDAQ:NVDA',  sector:'Semiconductors',pe:42.1, eps:2.53, beta:1.72, div:'0.03%', avgvol:'210M', float:'24.3B', short:'0.9%', mcap:'1.71T', high52:'974.00', low52:'405.25' },
  { sym:'TSLA',  name:'Tesla Inc.',          tv:'NASDAQ:TSLA',  sector:'Auto',          pe:48.7, eps:3.21, beta:2.31, div:'0%',    avgvol:'95M',  float:'3.1B',  short:'3.2%', mcap:'784B',  high52:'299.29', low52:'138.80' },
  { sym:'AMZN',  name:'Amazon.com',          tv:'NASDAQ:AMZN',  sector:'Consumer',      pe:44.2, eps:4.13, beta:1.15, div:'0%',    avgvol:'42M',  float:'10.2B', short:'0.7%', mcap:'2.01T', high52:'229.00', low52:'151.61' },
  { sym:'GOOGL', name:'Alphabet Inc.',       tv:'NASDAQ:GOOGL', sector:'Technology',    pe:23.8, eps:7.81, beta:1.05, div:'0%',    avgvol:'25M',  float:'12.1B', short:'0.5%', mcap:'2.11T', high52:'208.70', low52:'130.67' },
  { sym:'META',  name:'Meta Platforms',      tv:'NASDAQ:META',  sector:'Technology',    pe:26.4, eps:19.60,beta:1.18, div:'0.40%', avgvol:'15M',  float:'2.5B',  short:'0.8%', mcap:'1.62T', high52:'638.40', low52:'353.58' },
  { sym:'JPM',   name:'JPMorgan Chase',      tv:'NYSE:JPM',     sector:'Financials',    pe:12.1, eps:18.22,beta:1.11, div:'2.1%',  avgvol:'11M',  float:'2.8B',  short:'0.6%', mcap:'670B',  high52:'263.67', low52:'182.22' },
  { sym:'BRK.B', name:'Berkshire Hathaway',  tv:'NYSE:BRK.B',   sector:'Financials',    pe:21.5, eps:17.90,beta:0.88, div:'0%',    avgvol:'4M',   float:'1.3B',  short:'0.3%', mcap:'976B',  high52:'479.56', low52:'345.63' },
  { sym:'SPY',   name:'S&P 500 ETF',         tv:'AMEX:SPY',     sector:'ETF',           pe:22.4, eps:24.00,beta:1.00, div:'1.3%',  avgvol:'75M',  float:'N/A',   short:'0.2%', mcap:'535B',  high52:'614.37', low52:'480.72' },
  { sym:'QQQ',   name:'Nasdaq-100 ETF',      tv:'NASDAQ:QQQ',   sector:'ETF',           pe:30.1, eps:16.20,beta:1.05, div:'0.6%',  avgvol:'50M',  float:'N/A',   short:'0.3%', mcap:'225B',  high52:'540.81', low52:'391.80' },
  { sym:'GLD',   name:'Gold ETF (SPDR)',      tv:'AMEX:GLD',     sector:'Commodities',   pe:0,    eps:0,    beta:0.03, div:'0%',    avgvol:'10M',  float:'N/A',   short:'0.1%', mcap:'75B',   high52:'303.11', low52:'187.77' },
];

export const STOCK_PRICES = {
  AAPL:185.92, MSFT:415.32, NVDA:875.43, TSLA:248.50, AMZN:195.18,
  GOOGL:172.45, META:512.60, JPM:225.85, 'BRK.B':422.10, SPY:560.22,
  QQQ:480.55, GLD:222.85,
};

export const STOCK_CHANGES = {
  AAPL:1.24, MSFT:-0.32, NVDA:2.87, TSLA:-1.55, AMZN:0.78,
  GOOGL:0.45, META:1.22, JPM:-0.18, 'BRK.B':0.56, SPY:0.34,
  QQQ:0.62, GLD:-0.11,
};

export const SECTORS = [
  { name:'Technology',     chg: 1.42 }, { name:'Financials',     chg:-0.28 },
  { name:'Healthcare',     chg: 0.68 }, { name:'Consumer Disc.', chg: 0.95 },
  { name:'Energy',         chg:-1.15 }, { name:'Industrials',    chg: 0.37 },
  { name:'Utilities',      chg:-0.52 }, { name:'Real Estate',    chg:-0.83 },
  { name:'Materials',      chg: 0.19 }, { name:'Comm. Services', chg: 1.12 },
];

export const ECON_EVENTS = [
  { time:'14:00', event:'Fed Chair Speech',       impact:'high' },
  { time:'15:30', event:'Initial Jobless Claims', impact:'med'  },
  { time:'16:00', event:'CPI Data Release',       impact:'high' },
  { time:'18:00', event:'Treasury Auction',       impact:'low'  },
  { time:'20:30', event:'FOMC Minutes',           impact:'high' },
  { time:'22:00', event:'GDP Preliminary',        impact:'med'  },
];

export const NEWS_SUBREDDITS = {
  '':           'CryptoCurrency+CryptoMarkets+binance+CoinBase',
  'BTC':        'Bitcoin+btc',
  'ETH':        'ethereum+ethfinance',
  'DeFi':       'defi+UniSwap+0xPolygon',
  'NFT':        'NFT+NFTsMarketplace',
  'Regulation': 'CryptoCurrency+BitcoinMarkets',
  'Trading':    'CryptoMarkets+algotrading+Daytrading',
  'DeFAI':      'defi+artificial+CryptoCurrency',
};

export const APPROVAL_QUEUE = [
  { action:'Rebalance suggestion',  decision:'Review only', note:'AI recommends reducing concentration before adding DeFAI exposure.' },
  { action:'Stablecoin yield scan', decision:'Research',    note:'Compare protocol risk before depositing funds.' },
  { action:'Token diligence',       decision:'Pending',     note:'Review team, token utility, unlocks, GitHub, liquidity, and TVL.' },
  { action:'Stock overlap review',  decision:'Analyze',     note:'Compare Fidelity AI/tech exposure with crypto AI-token exposure.' },
];

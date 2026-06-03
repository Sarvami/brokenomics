/**
 * useTopics — fetches all topics from the API and enriches
 * them with local design data (colors, teasers, sub-topics).
 * Falls back to local static data when API is unavailable.
 */

import { useState, useEffect } from 'react';
import { topicsAPI } from '../lib/api';

/**
 * Static topic design data — real Brokenomics content
 * All teasers and copy are in English only.
 */
export const TOPIC_DATA = [
  {
    id: 'mutual-funds',
    name: 'Mutual Funds',
    emoji: '📈',
    teaser: "you've heard of SIPs but what even are they fr",
    description: 'Stop letting your money rot in a savings account. Mutual funds — the lazy person\'s ticket to the stock market.',
    bgColor: '#F5F0E8',
    accentColor: '#C0392B',
    progress: 0,
    subTopics: [
      { id: 'what-are-mf', title: 'What Even Is a Mutual Fund?', description: 'If SIP is your parents\' answer to everything, time to actually understand why.' },
      { id: 'types-of-mf', title: 'Equity vs Debt vs Hybrid', description: 'Not all mutual funds slap the same. Know what you\'re buying.' },
      { id: 'sip-basics', title: 'SIP 101', description: 'Systematic Investment Plan — the "set it and forget it" of investing.' },
      { id: 'nav-explained', title: 'NAV Explained', description: 'It\'s not your network access value. It\'s what your fund is actually worth.' },
      { id: 'direct-vs-regular', title: 'Direct vs Regular Plans', description: 'One of them is literally stealing from you. We\'re not joking.' },
      { id: 'elss', title: 'ELSS — Save Tax & Build Wealth', description: 'Two birds, one stone. Save on taxes and build wealth at the same time.' },
    ],
  },
  {
    id: 'stocks-trading',
    name: 'Stocks & Trading',
    emoji: '📊',
    teaser: 'opened Zerodha once, got scared, closed it',
    description: 'The stock market is not a casino — but only if you know the rules. Time to learn them.',
    bgColor: '#EDF2F7',
    accentColor: '#1A56DB',
    progress: 0,
    subTopics: [
      { id: 'stock-basics', title: 'What Is a Stock, Actually?', description: 'You own a tiny piece of Infosys. No, really. That\'s what a stock is.' },
      { id: 'nse-bse', title: 'NSE vs BSE — What\'s the Diff?', description: 'India has two stock exchanges. Both matter. Here\'s why.' },
      { id: 'demat-trading', title: 'Demat & Trading Accounts', description: 'Before you buy your first share, you need these two things.' },
      { id: 'fundamental-analysis', title: 'Reading a Company\'s Report Card', description: 'P/E ratio, EPS, balance sheet — less scary than they sound.' },
      { id: 'technical-analysis', title: 'Charts & Candlesticks', description: 'The art of reading stock charts without losing your mind.' },
      { id: 'indices', title: 'Sensex & Nifty Decoded', description: 'Why do people freak out when Sensex drops 500 points?' },
    ],
  },
  {
    id: 'banking',
    name: 'Banking',
    emoji: '🏦',
    teaser: 'your savings account is literally losing value rn',
    description: 'Your bank account is just the beginning. FDs, RDs, UPI, and the stuff your banker won\'t tell you.',
    bgColor: '#F0FFF4',
    accentColor: '#276749',
    progress: 0,
    subTopics: [
      { id: 'savings-vs-current', title: 'Savings vs Current Account', description: 'One earns interest, one doesn\'t. Guess which one your business needs.' },
      { id: 'fd-rd', title: 'FDs & RDs — Still Worth It?', description: 'Your grandma swears by FDs. Is she wrong, or are you missing out?' },
      { id: 'upi-neft-rtgs', title: 'UPI, NEFT, RTGS, IMPS', description: 'We use UPI daily but most of us have no clue how it actually works.' },
      { id: 'credit-score-banking', title: 'How Banks See Your Credit Score', description: 'That three-digit number decides if you get a loan or a no.' },
      { id: 'digital-banking', title: 'Neo Banks & Digital Banking', description: 'Fi, Jupiter, Niyo — are these actually better than HDFC?' },
      { id: 'rbi-basics', title: 'What Does RBI Actually Do?', description: 'The boss of all Indian banks. More powerful than your CA.' },
    ],
  },
  {
    id: 'loans-credit',
    name: 'Loans & Credit',
    emoji: '💳',
    teaser: 'EMIs sound fine until they don\'t',
    description: 'Debt is not always bad — but bad debt is always debt. Know the difference before you sign anything.',
    bgColor: '#FFF8F0',
    accentColor: '#C05621',
    progress: 0,
    subTopics: [
      { id: 'credit-score', title: 'CIBIL Score — Your Financial Identity', description: '750+ and lenders will chase you. Below 650? Good luck getting approved.' },
      { id: 'credit-cards', title: 'Credit Cards Done Right', description: 'Free flights, cashback, and zero interest — if you play by the rules.' },
      { id: 'home-loan', title: 'Home Loan 101', description: '30 years of EMIs. Is it an asset or a trap? Let\'s find out.' },
      { id: 'personal-loan', title: 'Personal Loans — When to Say No', description: 'Easy to get, hard to repay. The fine print nobody reads.' },
      { id: 'bnpl', title: 'BNPL — Buy Now, Cry Later?', description: 'Zomato Pay Later, LazyPay, Simpl — harmless convenience or a debt spiral?' },
      { id: 'debt-management', title: 'Getting Out of Debt', description: 'Avalanche vs snowball methods, and why small expenses add up fast.' },
    ],
  },
  {
    id: 'taxes-saving',
    name: 'Taxes & Saving',
    emoji: '🧾',
    teaser: 'filing ITR at midnight crying is not a personality',
    description: 'Tax isn\'t theft if you know how to get most of it back. Legally. No CA required (kinda).',
    bgColor: '#FFFFF0',
    accentColor: '#6B21A8',
    progress: 0,
    subTopics: [
      { id: 'income-tax-slabs', title: 'Income Tax Slabs Explained', description: 'Old regime vs new regime — which one actually saves you more money?' },
      { id: '80c-deductions', title: '80C — Your Tax-Saving Toolkit', description: 'PPF, ELSS, LIC, NPS — all the 80C options ranked honestly.' },
      { id: 'itr-filing', title: 'Filing ITR Without a CA', description: 'It\'s not as scary as it looks. We walk through every section.' },
      { id: 'gst-basics', title: 'GST — Why Everything Is 18%', description: 'Understanding GST so you stop being confused by your restaurant bill.' },
      { id: 'tax-saving-fd', title: 'Tax-Saving FDs & NSC', description: 'Low risk, locked in for 5 years. Good or just boring? Depends on your goals.' },
      { id: 'advance-tax', title: 'Advance Tax & TDS', description: 'Freelancers, this one\'s for you. Don\'t get surprised at year end.' },
    ],
  },
  {
    id: 'investing-101',
    name: 'Investing 101',
    emoji: '🚀',
    teaser: 'before you yolo into stocks, read this',
    description: 'Before you drop money into anything, you need the basics. Asset classes, risk, returns — all of it.',
    bgColor: '#FFF0F6',
    accentColor: '#7C3AED',
    progress: 0,
    subTopics: [
      { id: 'asset-classes', title: 'Assets: Equity, Debt, Gold, Real Estate', description: 'Four buckets where all money goes. Know each before you invest a rupee.' },
      { id: 'risk-return', title: 'Risk vs Return — The Eternal Tradeoff', description: 'Higher return = higher risk. Always. No exceptions. Period.' },
      { id: 'compounding', title: 'Compounding — The 8th Wonder', description: 'Einstein said it. Your bank doesn\'t want you to know it. We\'ll explain it.' },
      { id: 'diversification', title: 'Don\'t Put All Eggs in One Basket', description: 'Diversification is just a fancy word for "spread your bets".' },
      { id: 'inflation', title: 'Inflation — The Silent Wealth Killer', description: 'Your ₹100 today is worth ₹96 next year. Yes, really.' },
      { id: 'emergency-fund', title: 'Emergency Fund First, Invest Later', description: '3–6 months of expenses in liquid cash. Non-negotiable.' },
    ],
  },
];

export default function useTopics() {
  const [topics, setTopics] = useState(TOPIC_DATA);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTopics = async () => {
      setLoading(true);
      try {
        const data = await topicsAPI.getAllTopics();
        if (data && Array.isArray(data)) {
          const merged = TOPIC_DATA.map((localTopic) => {
            const apiTopic = data.find(
              (t) => t.id === localTopic.id || t.slug === localTopic.id
            );
            if (apiTopic) {
              return {
                ...localTopic,
                ...apiTopic,
                // Always keep our local design + copy data
                bgColor: localTopic.bgColor,
                accentColor: localTopic.accentColor,
                emoji: localTopic.emoji,
                teaser: localTopic.teaser,
                subTopics: localTopic.subTopics,
              };
            }
            return localTopic;
          });
          setTopics(merged);
        }
      } catch {
        setTopics(TOPIC_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  return { topics, loading };
}

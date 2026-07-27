/**
 * Seed — reproduces the prototype's demo cast so the app looks identical to
 * Treax.dc.html straight after `pnpm db:seed`.
 *
 * Sources:
 *   users     — builderList()  Treax.dc.html:3161-3168, plus `me` at 2340
 *   posts     — seed()         Treax.dc.html:2847-2853, myPosts() at 2857-2860
 *   services  — serviceList()  Treax.dc.html:3185-3192
 *   learn     — learnList()    Treax.dc.html:3196-3203
 *   experts   — expertList()   Treax.dc.html:3207-3214
 *   campaigns — state.adCampaigns  Treax.dc.html:2238-2242
 *
 * Idempotent: re-running upserts by handle/email rather than duplicating.
 */
import { Prisma, PrismaClient, type PostTag } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

const PASSWORD = process.env.SEED_PASSWORD || 'treax1234';
const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

type SeedUser = {
  handle: string;
  name: string;
  email: string;
  role?: 'BUILDER' | 'EXPERT' | 'ADMIN';
  initials: string;
  avatarColor: string;
  building?: string;
  focus?: string;
  university?: string;
  tagline?: string;
  seeking?: string;
  bio?: string;
  tags?: string[];
  verified?: boolean;
  streak?: number;
  shipCount?: number;
  respectCount?: number;
};

// `me` (Treax.dc.html:2340) + meDefaults (2266-2271) — the signed-in builder.
const ME: SeedUser = {
  handle: 'tahmidbuilds',
  name: 'Tahmid Karim',
  email: 'tahmid@student.buet.ac.bd',
  role: 'ADMIN', // so the control room is reachable out of the box
  initials: 'TK',
  avatarColor: '#0e0f0c',
  building: 'RidePool',
  focus: 'CSE student · product',
  university: 'BUET',
  seeking: 'A business co-founder in Dhaka',
  tags: ['Mobility', 'Student startups', 'Dhaka builders'],
  bio: "CSE student at BUET building RidePool — split rides to campus and cut the fare. Product's live; now looking for a business co-founder in Dhaka. Building in public, learning fast.",
  verified: true,
  streak: 12,
  shipCount: 47,
  respectCount: 3200,
};

const BUILDERS: SeedUser[] = [
  {
    handle: 'nusratbuilds',
    name: 'Nusrat Jahan',
    email: 'nusrat@student.du.ac.bd',
    initials: 'NJ',
    avatarColor: '#2ead4b',
    building: 'Tuition Bridge',
    focus: 'Business / Strategy',
    university: 'Dhaka University',
    tagline: 'verified tuitions for students',
    seeking: 'a developer',
    tags: ['EdTech', 'Student startups', 'Dhaka builders'],
    bio: 'Building Tuition Bridge — verified tuitions for DU students. Every tutor is vetted by a senior student first, because trust is the whole product.',
    verified: true,
    streak: 61,
    shipCount: 210,
    respectCount: 4100,
  },
  {
    handle: 'rafiapi',
    name: 'Rafiur Rahman',
    email: 'rafiur@student.buet.ac.bd',
    initials: 'RR',
    avatarColor: '#163300',
    building: 'KrishiConnect',
    focus: 'Backend developer',
    university: 'BUET',
    tagline: 'agri supply-chain for farmers',
    seeking: 'a marketer',
    tags: ['AgriTech', 'Dhaka builders'],
    bio: 'Backend developer at BUET. KrishiConnect connects farmers to buyers across 42 districts. No investors — just buses to villages and a lot of listening.',
    verified: true,
    streak: 128,
    shipCount: 340,
    respectCount: 8600,
  },
  {
    handle: 'ayeshadesigns',
    name: 'Ayesha Siddika',
    email: 'ayesha@g.bracu.ac.bd',
    initials: 'AS',
    avatarColor: '#0e0f0c',
    building: 'Rongin',
    focus: 'Product designer',
    university: 'BRAC University',
    tagline: 'design tools for creators',
    seeking: 'a technical co-founder',
    tags: ['Design', 'Student startups'],
    bio: 'Product designer building Rongin — design tools for Bangladeshi creators. Learned the hard way that polish can wait and proof cannot.',
    streak: 22,
    shipCount: 96,
    respectCount: 1900,
  },
  {
    handle: 'sabbirbuilds',
    name: 'Sabbir Hossain',
    email: 'sabbir@northsouth.edu',
    initials: 'SH',
    avatarColor: '#d03238',
    building: 'Ledgerly BD',
    focus: 'Finance',
    university: 'North South University',
    tagline: 'invoicing for small shops',
    seeking: 'an engineer',
    tags: ['Fintech', 'Student startups'],
    bio: 'Ledgerly BD — invoicing for small shops in Dhaka. Priced it wrong twice before I learned to price for my market, not my spreadsheet.',
    streak: 14,
    shipCount: 58,
    respectCount: 1400,
  },
  {
    handle: 'tanviropen',
    name: 'Tanvir Alam',
    email: 'tanvir@student.sust.edu',
    initials: 'TA',
    avatarColor: '#38c8ff',
    building: 'CampusHire',
    focus: 'Full-stack developer',
    university: 'SUST',
    tagline: 'part-time jobs for students',
    seeking: 'a growth partner',
    tags: ['Student startups', 'AI tools'],
    bio: 'Full-stack developer at SUST. CampusHire is a part-time job board for university students. The product works; selling is the part I need help with.',
    streak: 33,
    shipCount: 121,
    respectCount: 2600,
  },
  {
    handle: 'malihamkt',
    name: 'Maliha Chowdhury',
    email: 'maliha@iub.edu.bd',
    initials: 'MC',
    avatarColor: '#b86700',
    building: 'Bloombox',
    focus: 'Marketing',
    university: 'IUB',
    tagline: 'D2C plants for the city',
    seeking: 'a technical co-founder',
    tags: ['Design', 'Dhaka builders'],
    bio: 'Marketing at IUB, building Bloombox — D2C plants for people with tiny Dhaka balconies. I can sell; I need someone who can build.',
    streak: 9,
    shipCount: 40,
    respectCount: 780,
  },
  {
    handle: 'sadianoor',
    name: 'Sadia Noor',
    email: 'sadia@student.du.ac.bd',
    initials: 'SN',
    avatarColor: '#8b7bf0',
    focus: 'Video editor',
    university: 'Dhaka University',
    tags: ['Content', 'Design'],
    bio: 'Video editor at DU. I cut product reels that people actually watch to the end.',
    streak: 7,
    shipCount: 24,
    respectCount: 410,
  },
  {
    handle: 'imrankabir',
    name: 'Imran Kabir',
    email: 'imran.k@northsouth.edu',
    initials: 'IK',
    avatarColor: '#2ead4b',
    focus: 'Tutor · Physics & Math',
    university: 'North South University',
    tags: ['EdTech'],
    bio: 'HSC and admission tutor at NSU. Physics and Math, one-on-one.',
    streak: 5,
    shipCount: 18,
    respectCount: 260,
  },
];

// expertList() — Treax.dc.html:3207-3214
const EXPERTS: Array<SeedUser & { title: string; company: string; skills: string[]; rate: string; free: boolean; availability: string; rating: number; sessions: number }> = [
  {
    handle: 'imranchowdhury',
    name: 'Imran Chowdhury',
    email: 'imran@bhalocommerce.com',
    role: 'EXPERT',
    initials: 'IC',
    avatarColor: '#0e0f0c',
    title: 'Founder & CEO',
    company: 'Bhalo Commerce',
    skills: ['Marketplaces', 'Ops', 'Fundraising'],
    rate: 'Free for students',
    free: true,
    availability: 'Thu, 7:00 PM',
    rating: 4.9,
    sessions: 210,
    bio: 'Built and scaled a marketplace in Bangladesh. Happy to talk ops, supply and the messy early days.',
  },
  {
    handle: 'nadiaislam',
    name: 'Nadia Islam',
    email: 'nadia@takapay.com',
    role: 'EXPERT',
    initials: 'NI',
    avatarColor: '#8b7bf0',
    title: 'Head of Product',
    company: 'TakaPay',
    skills: ['Product', 'Fintech', 'UX'],
    rate: '৳500 / 30 min',
    free: false,
    availability: 'Tomorrow, 6:00 PM',
    rating: 5.0,
    sessions: 88,
    bio: 'Product lead in fintech. I can help you find the one thing your product should do well.',
  },
  {
    handle: 'kamrulhasan',
    name: 'Dr. Kamrul Hasan',
    email: 'kamrul@cse.buet.ac.bd',
    role: 'EXPERT',
    initials: 'KH',
    avatarColor: '#163300',
    title: 'Professor, CSE',
    company: 'BUET',
    skills: ['Research → Product', 'AI', 'Deep tech'],
    rate: 'Free for students',
    free: true,
    availability: 'Sat, 11:00 AM',
    rating: 4.8,
    sessions: 64,
    bio: 'CSE professor at BUET. I help students turn research into something people can use.',
  },
  {
    handle: 'farhanaakter',
    name: 'Farhana Akter',
    email: 'farhana@ridenow.com',
    role: 'EXPERT',
    initials: 'FA',
    avatarColor: '#b86700',
    title: 'Head of Growth',
    company: 'RideNow',
    skills: ['Growth', 'Marketing', 'GTM'],
    rate: '৳800 / 30 min',
    free: false,
    availability: 'Fri, 5:30 PM',
    rating: 4.9,
    sessions: 132,
    bio: 'Growth lead at RideNow. Ask me about channels that work in Dhaka and the ones that never do.',
  },
  {
    handle: 'sadiarahman',
    name: 'Sadia Rahman',
    email: 'sadia@bengalseed.vc',
    role: 'EXPERT',
    initials: 'SR',
    avatarColor: '#2ead4b',
    title: 'Partner',
    company: 'Bengal Seed (VC)',
    skills: ['Fundraising', 'Pitching', 'Metrics'],
    rate: 'Free for students',
    free: true,
    availability: 'Mon, 4:00 PM',
    rating: 4.7,
    sessions: 57,
    bio: 'Early-stage investor. I will tell you honestly whether your metrics are ready to raise on.',
  },
  {
    handle: 'tanjimahmed',
    name: 'Tanjim Ahmed',
    email: 'tanjim@founders.bd',
    role: 'EXPERT',
    initials: 'TJ',
    avatarColor: '#38c8ff',
    title: 'Serial founder & angel',
    company: '2 exits',
    skills: ['0→1', 'Sales', 'Hiring'],
    rate: '৳1,000 / 30 min',
    free: false,
    availability: 'Wed, 8:00 PM',
    rating: 5.0,
    sessions: 41,
    bio: 'Two exits, plenty of scars. Best on getting your first ten customers and your first two hires.',
  },
];

async function main() {
  console.log('Seeding Treax…');
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // ── users ────────────────────────────────────────────────────────────────
  const all = [ME, ...BUILDERS, ...EXPERTS];
  const users: Record<string, string> = {};

  for (const u of all) {
    const data = {
      name: u.name,
      email: u.email,
      passwordHash,
      role: u.role ?? 'BUILDER',
      initials: u.initials,
      avatarColor: u.avatarColor,
      building: u.building ?? null,
      focus: u.focus ?? null,
      university: u.university ?? null,
      seeking: u.seeking ?? null,
      bio: u.bio ?? null,
      tags: u.tags ?? [],
      verified: u.verified ?? false,
      streak: u.streak ?? 0,
      shipCount: u.shipCount ?? 0,
      respectCount: u.respectCount ?? 0,
      onboardingDone: true,
      onboardingStep: 3,
      signupStep: 3,
    };

    const user = await db.user.upsert({
      where: { handle: u.handle },
      create: { handle: u.handle, ...data },
      update: data,
      select: { id: true },
    });
    users[u.handle] = user.id;
  }
  console.log(`  ${all.length} users`);

  // ── expert profiles ──────────────────────────────────────────────────────
  for (const e of EXPERTS) {
    const userId = users[e.handle];
    const data = {
      title: e.title,
      company: e.company,
      bio: e.bio ?? '',
      skills: e.skills,
      rate: e.rate,
      free: e.free,
      availability: e.availability,
      rating: e.rating,
      sessionCount: e.sessions,
      active: true,
    };
    await db.expert.upsert({ where: { userId }, create: { userId, ...data }, update: data });
  }
  console.log(`  ${EXPERTS.length} experts`);

  // ── follows: everyone follows the demo builder, and vice versa ───────────
  const others = [...BUILDERS, ...EXPERTS].map((u) => users[u.handle]);
  for (const otherId of others) {
    await db.follow.upsert({
      where: { followerId_followingId: { followerId: users[ME.handle], followingId: otherId } },
      create: { followerId: users[ME.handle], followingId: otherId },
      update: {},
    });
  }
  for (const otherId of others.slice(0, 5)) {
    await db.follow.upsert({
      where: { followerId_followingId: { followerId: otherId, followingId: users[ME.handle] } },
      create: { followerId: otherId, followingId: users[ME.handle] },
      update: {},
    });
  }
  await db.user.update({ where: { id: users[ME.handle] }, data: { followerCount: 5 } });

  // ── posts (seed(), Treax.dc.html:2847-2853) ─────────────────────────────
  const posts: Array<{
    key: string;
    handle: string;
    tag: PostTag;
    score: number;
    body: string;
    respects: number;
    comments: number;
    reposts: number;
    createdAt: Date;
    imageUrl?: string;
    metrics?: Array<{ value: string; label: string }>;
    comm?: Array<{ handle: string; text: string }>;
  }> = [
    {
      key: 'p1',
      handle: 'nusratbuilds',
      tag: 'shipped',
      score: 94,
      createdAt: hoursAgo(2),
      body: 'Launched Tuition Bridge — a way for DU students to find verified tuitions near campus. Went live in 3 halls this week.\n\nWithin 48 hours we had 60 students sign up and matched 14 tuitions. The hard part was never the tech, it was trust — so every tutor is vetted by a senior student first.',
      respects: 342,
      comments: 28,
      reposts: 41,
      imageUrl: '/assets/tuition-bridge.png',
      metrics: [
        { value: '60', label: 'students in 48h' },
        { value: '14', label: 'tuitions matched' },
        { value: '3 halls', label: 'live at DU' },
      ],
      comm: [{ handle: 'rafiapi', text: 'The senior-vetting idea is smart. Trust is everything in this market.' }],
    },
    {
      key: 'p2',
      handle: 'sabbirbuilds',
      tag: 'failed',
      score: 88,
      createdAt: hoursAgo(4),
      body: 'Priced Ledgerly BD at 500tk/month from day one. Zero signups in two weeks. Painful.\n\nTalked to 20 small shop owners in Karwan Bazar — most had never paid for software in their life. Dropped to a free tier with a 99tk pro plan and landed 8 paying shops in three days. Lesson: price for your market, not for your spreadsheet.',
      respects: 512,
      comments: 63,
      reposts: 88,
      comm: [{ handle: 'ayeshadesigns', text: 'Talking to 20 real shop owners is worth more than any pitch deck. Respect.' }],
    },
    {
      key: 'p3',
      handle: 'rafiapi',
      tag: 'metric',
      score: 91,
      createdAt: hoursAgo(6),
      body: 'KrishiConnect crossed 1,000 farmers this morning. 10 months from a BUET dorm-room prototype to here.\n\nNo investors. Every farmer came from us taking buses to the villages, sitting with them, and fixing the app around what they actually needed.',
      respects: 1204,
      comments: 140,
      reposts: 260,
      metrics: [
        { value: '1,000', label: 'farmers' },
        { value: '42', label: 'districts' },
        { value: '10 mo', label: 'to milestone' },
      ],
    },
    {
      key: 'p4',
      handle: 'ayeshadesigns',
      tag: 'learned',
      score: 86,
      createdAt: hoursAgo(9),
      body: 'Spent 3 weeks designing a full brand system for Rongin before we had a single user. Learned that was completely backwards.\n\nWe relaunched with a plain logo and a Google Form instead. Got 40 sign-ups and real feedback in a week. The polish can wait — proof cannot.',
      respects: 287,
      comments: 34,
      reposts: 52,
    },
    {
      key: 'p5',
      handle: 'tanviropen',
      tag: 'seeking',
      score: 83,
      createdAt: hoursAgo(12),
      body: "I'm a full-stack developer at SUST building CampusHire — a part-time job board for university students. The product works; my problem is I can't sell.\n\nLooking for a business or marketing co-founder who gets the student market and wants to own growth. Equity, not a job. If campus hiring excites you, let's talk.",
      respects: 143,
      comments: 97,
      reposts: 12,
      comm: [{ handle: 'malihamkt', text: 'This is exactly why I am on Treax. Sent you a message.' }],
    },
    // myPosts() — Treax.dc.html:2857-2860
    {
      key: 'me1',
      handle: ME.handle,
      tag: 'shipped',
      score: 90,
      createdAt: daysAgo(1),
      body: 'Launched RidePool for BUET students — pool a CNG or ride to campus and split the fare. First week: 120 rides pooled, average 55tk saved per trip.',
      respects: 88,
      comments: 12,
      reposts: 6,
    },
    {
      key: 'me2',
      handle: ME.handle,
      tag: 'seeking',
      score: 85,
      createdAt: daysAgo(3),
      body: 'RidePool is growing but I am a solo developer drowning in ops and support. Looking for a business co-founder in Dhaka who can own operations and partnerships. I bring the product and the code — you bring the hustle.',
      respects: 164,
      comments: 31,
      reposts: 9,
    },
  ];

  // Deterministic ids keep the seed idempotent across runs.
  for (const p of posts) {
    const id = `seed_post_${p.key}`;
    const data = {
      authorId: users[p.handle],
      body: p.body,
      tag: p.tag,
      shipScore: p.score,
      imageUrl: p.imageUrl ?? null,
      filterVerdict: 'ACCEPTED' as const,
      filterSource: 'heuristic',
      metrics: p.metrics ? (p.metrics as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      respectCount: p.respects,
      commentCount: p.comments,
      repostCount: p.reposts,
      createdAt: p.createdAt,
    };
    await db.post.upsert({ where: { id }, create: { id, ...data }, update: data });

    for (const [i, c] of (p.comm ?? []).entries()) {
      const commentId = `${id}_c${i}`;
      await db.comment.upsert({
        where: { id: commentId },
        create: { id: commentId, postId: id, authorId: users[c.handle], body: c.text, createdAt: p.createdAt },
        update: { body: c.text },
      });
    }
  }
  console.log(`  ${posts.length} posts`);

  // ── services (serviceList(), Treax.dc.html:3185-3192) ────────────────────
  const services = [
    { key: 's1', handle: 'ayeshadesigns', cat: 'Logo & Branding', title: "I'll design a clean, modern logo + brand kit for your startup", rating: 4.9, orders: 38, days: 2, price: '৳799' },
    { key: 's2', handle: 'tanviropen', cat: 'Landing Pages', title: "I'll build a fast, mobile-ready landing page in a weekend", rating: 4.8, orders: 21, days: 3, price: '৳1,499' },
    { key: 's3', handle: 'malihamkt', cat: 'Social Media', title: "I'll run your Facebook & Instagram for a full month", rating: 4.7, orders: 15, days: 30, price: '৳2,000' },
    { key: 's4', handle: 'sadianoor', cat: 'Video Editing', title: "I'll edit a punchy 60-second product reel for socials", rating: 5.0, orders: 29, days: 2, price: '৳1,200' },
    { key: 's5', handle: 'rafiapi', cat: 'Data & AI', title: "I'll analyze your survey data and build a clear dashboard", rating: 4.9, orders: 12, days: 4, price: '৳1,800' },
    { key: 's6', handle: 'imrankabir', cat: 'Tutoring', title: "I'll tutor HSC & admission Physics and Math, one-on-one", rating: 4.8, orders: 54, days: 1, price: '৳300/hr' },
  ];

  for (const s of services) {
    const id = `seed_svc_${s.key}`;
    const data = {
      ownerId: users[s.handle],
      title: s.title,
      description: `Delivered in ${s.days} day${s.days === 1 ? '' : 's'}. Revisions included. Message me before ordering so we can agree the scope.`,
      category: s.cat,
      price: s.price,
      cta: 'Request this',
      images: [],
      deliveryDays: s.days,
      rating: s.rating,
      orderCount: s.orders,
      active: true,
    };
    await db.service.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
  console.log(`  ${services.length} services`);

  // ── learn resources (learnList(), Treax.dc.html:3196-3203) ──────────────
  const learn = [
    { key: 'l1', type: 'Case study', title: 'How Tuition Bridge earned trust in 3 DU halls', excerpt: 'Verifying every tutor with a senior student turned a cold marketplace into 60 sign-ups in 48 hours.', worked: 'Senior-vetting as the trust layer', failed: 'Cold DMs to strangers — zero replies', author: 'Nusrat Jahan', handle: 'nusratbuilds', readTime: '8 min' },
    { key: 'l2', type: 'Playbook', title: 'Pricing for the Bangladeshi student market', excerpt: 'Why a 500tk plan got zero signups and a 99tk plan landed 8 paying shops in three days.', worked: 'Free tier plus a cheap pro plan', failed: 'Pricing for your spreadsheet, not your market', author: 'Sabbir Hossain', handle: 'sabbirbuilds', readTime: '6 min' },
    { key: 'l3', type: 'Founder story', title: 'I designed a brand before I had a single user', excerpt: 'Three weeks on a full brand system — backwards. A plain logo and a Google Form got real feedback instead.', worked: 'Ship ugly, learn fast', failed: 'Polishing before proof', author: 'Ayesha Siddika', handle: 'ayeshadesigns', readTime: '5 min' },
    { key: 'l4', type: 'Template', title: 'The cold outreach message that gets replies', excerpt: 'A copy-paste framework for reaching shop owners, tutors, and early users without sounding like a bot.', worked: 'Specific ask plus local context', failed: 'Generic “check out my app” blasts', author: 'Tanvir Alam', handle: 'tanviropen', readTime: '4 min' },
    { key: 'l5', type: 'Deep dive', title: 'Finding a co-founder on campus without losing friends', excerpt: 'How to test for complementary skills and shared commitment before you split equity.', worked: 'A two-week trial project first', failed: 'Splitting 50/50 on day one', author: 'Maliha Chowdhury', handle: 'malihamkt', readTime: '9 min' },
    { key: 'l6', type: 'Case study', title: 'Getting your first 100 users with zero ad budget', excerpt: 'Buses to villages, hall visits, and Facebook groups — the unglamorous channels that compounded.', worked: 'Showing up in person', failed: 'Waiting for organic virality', author: 'Rafiur Rahman', handle: 'rafiapi', readTime: '7 min' },
  ];

  for (const l of learn) {
    const id = `seed_learn_${l.key}`;
    const data = {
      type: l.type,
      title: l.title,
      excerpt: l.excerpt,
      body: `${l.excerpt}\n\nWhat worked: ${l.worked}.\n\nWhat did not: ${l.failed}.\n\nThe full write-up walks through the decisions week by week, the numbers behind each one, and what we would do differently starting over.`,
      worked: l.worked,
      failed: l.failed,
      readTime: l.readTime,
      authorId: users[l.handle],
      authorName: l.author,
      published: true,
    };
    await db.learnResource.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
  console.log(`  ${learn.length} learn resources`);

  // ── ad campaigns (state.adCampaigns, Treax.dc.html:2238-2242) ───────────
  const campaigns = [
    { key: 'a1', brand: 'bKash for Business', title: 'Take payments the day you launch', body: 'Student founders get merchant accounts approved in 48 hours, no trade licence required for the first six months.', cta: 'Get started', impressions: 48200, clicks: 1930, active: true, spend: 24100, budget: 60000 },
    { key: 'a2', brand: 'BRAC Incubator', title: 'Applications close in 9 days', body: 'Six months of desk space in Dhaka, a 3 lakh grant, and a mentor matched to your stage.', cta: 'Apply now', impressions: 31400, clicks: 1610, active: true, spend: 15700, budget: 40000 },
    { key: 'a3', brand: 'Hostinger Campus', title: '90% off your first year of hosting', body: 'Verified students on Treax get a domain, hosting and SSL for the price of a cup of tea a month.', cta: 'Claim offer', impressions: 12750, clicks: 388, active: false, spend: 6375, budget: 20000 },
  ];

  for (const c of campaigns) {
    const id = `seed_ad_${c.key}`;
    const data = {
      brand: c.brand,
      title: c.title,
      body: c.body,
      cta: c.cta,
      link: '',
      impressions: c.impressions,
      clicks: c.clicks,
      spend: c.spend,
      budget: c.budget,
      active: c.active,
      createdById: users[ME.handle],
    };
    await db.adCampaign.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
  console.log(`  ${campaigns.length} ad campaigns`);

  // ── billboard (single row) ───────────────────────────────────────────────
  await db.billboard.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', imageUrl: null, headline: null, cta: 'Learn more', link: '' },
    update: {},
  });

  // ── a conversation so Messages is not empty on first run ────────────────
  const convId = 'seed_conv_1';
  await db.conversation.upsert({
    where: { id: convId },
    create: { id: convId, lastMessageAt: hoursAgo(1) },
    update: {},
  });
  for (const handle of [ME.handle, 'nusratbuilds']) {
    await db.conversationMember.upsert({
      where: { conversationId_userId: { conversationId: convId, userId: users[handle] } },
      create: { conversationId: convId, userId: users[handle] },
      update: {},
    });
  }
  const messages = [
    { key: 'm1', handle: 'nusratbuilds', body: 'Saw RidePool go live — congrats. How are you handling the fare split?', at: hoursAgo(3) },
    { key: 'm2', handle: ME.handle, body: 'Thanks. Right now it is manual bKash between riders. Automating it is next.', at: hoursAgo(2) },
    { key: 'm3', handle: 'nusratbuilds', body: 'We hit the same wall with tuition payments. Happy to share what we learned.', at: hoursAgo(1) },
  ];
  for (const m of messages) {
    const id = `seed_msg_${m.key}`;
    await db.message.upsert({
      where: { id },
      create: { id, conversationId: convId, senderId: users[m.handle], body: m.body, createdAt: m.at },
      update: {},
    });
  }

  // ── notifications ────────────────────────────────────────────────────────
  const notifications = [
    { key: 'n1', type: 'RESPECT' as const, actor: 'nusratbuilds', body: 'Nusrat Jahan respected your update about RidePool.', url: '/p/seed_post_me1', at: hoursAgo(2) },
    { key: 'n2', type: 'FOLLOW' as const, actor: 'rafiapi', body: 'Rafiur Rahman started following you.', url: '/u/rafiapi', at: hoursAgo(5) },
    { key: 'n3', type: 'COMMENT' as const, actor: 'malihamkt', body: 'Maliha Chowdhury commented on your co-founder ask.', url: '/p/seed_post_me2', at: hoursAgo(9) },
  ];
  for (const n of notifications) {
    const id = `seed_notif_${n.key}`;
    await db.notification.upsert({
      where: { id },
      create: {
        id,
        recipientId: users[ME.handle],
        actorId: users[n.actor],
        type: n.type,
        body: n.body,
        targetUrl: n.url,
        read: false,
        createdAt: n.at,
      },
      update: {},
    });
  }

  // ── a Signal Rush score so the champion card has a name ─────────────────
  await db.gameScore.upsert({
    where: { id: 'seed_score_1' },
    create: { id: 'seed_score_1', userId: users['rafiapi'], score: 420, solved: 14, missed: 2 },
    update: {},
  });

  console.log(`\nDone. Sign in as ${ME.email} / ${PASSWORD} (ADMIN).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

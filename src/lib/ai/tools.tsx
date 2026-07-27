/**
 * AI Studio tool catalogue — transcribed from aiToolsMeta() (Treax.dc.html:2630-2663)
 * and aiIconEl() (Treax.dc.html:2665-2676). Copy is unchanged in both languages.
 */
import type { SVGProps } from 'react';

export type AiToolId = 'title' | 'validator' | 'matcher' | 'gigwriter' | 'summarizer' | 'bio';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/** aiIconEl() — the per-tool path sets, drawn white on the tool's accent chip. */
const ICON_PATHS: Record<AiToolId, string[]> = {
  title: [
    'M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15l-1.7-4L6 9.3l4.3-1.7z',
    'M19 14l.6 1.7 1.7.6-1.7.6L19 19l-.6-1.5-1.7-.6 1.7-.6z',
  ],
  validator: ['M4 15a8 8 0 0 1 16 0', 'M12 15l4-3.5', 'M4 15h16'],
  matcher: [
    'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-4A3.5 3.5 0 0 0 5 18.5V20',
    'M10.5 11.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4',
    'M19 20v-1.5a3.5 3.5 0 0 0-2.6-3.4',
    'M15.5 5.3a3.2 3.2 0 0 1 0 6.1',
  ],
  gigwriter: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'],
  summarizer: ['M8 6h12M8 12h12M8 18h9', 'M4 6h.01M4 12h.01M4 18h.01'],
  bio: ['M4 5h16v14H4z', 'M9 10.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4', 'M6.5 16a3 3 0 0 1 5 0', 'M14 9h4M14 13h3'],
};

function makeIcon(id: AiToolId) {
  const Icon = ({ size = 22, ...rest }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {ICON_PATHS[id].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
  Icon.displayName = `AiToolIcon_${id}`;
  return Icon;
}

export type AiTool = {
  id: AiToolId;
  name: string;
  nameBn: string;
  tagline: string;
  taglineBn: string;
  accent: string;
  cta: string;
  ctaBn: string;
  desc: string;
  descBn: string;
  demoPrompt: string;
  demoPromptBn: string;
  label: string;
  labelBn: string;
  ph: string;
  phBn: string;
  steps: string[];
  stepsBn: string[];
  prefill: string;
  Icon: ReturnType<typeof makeIcon>;
};

export const AI_TOOLS: AiTool[] = [
  {
    id: 'title',
    name: 'Idea Title Generator',
    nameBn: 'আইডিয়া টাইটেল জেনারেটর',
    tagline: 'Messy words in, a clean pitch out',
    taglineBn: 'এলোমেলো শব্দ থেকে পরিষ্কার পিচ',
    accent: '#8b7bf0',
    cta: 'Generate pitches',
    ctaBn: 'পিচ জেনারেট করুন',
    desc: 'Type your idea in messy, half-formed words. The AI hands back a clean product name, a one-line pitch, and a few alternative directions to pick from.',
    descBn: 'এলোমেলো, অগোছালো শব্দে আপনার আইডিয়া লিখুন। এআই একটি পরিষ্কার প্রোডাক্ট নাম, এক লাইনের পিচ ও কয়েকটি বিকল্প দিক ফিরিয়ে দেয়।',
    demoPrompt: 'app for students to share rides…',
    demoPromptBn: 'শিক্ষার্থীদের রাইড শেয়ারের অ্যাপ…',
    label: 'Describe your idea — however messy',
    labelBn: 'আপনার আইডিয়া লিখুন — যত এলোমেলো হোক',
    ph: 'e.g. app thing where students share rides to uni and split the cost so its cheaper',
    phBn: 'যেমন: শিক্ষার্থীরা ক্যাম্পাসে রাইড শেয়ার করে খরচ ভাগ করে সস্তা করে',
    steps: [
      'Type your idea in plain, messy words — no polish needed',
      'Tap Generate to get a name, tagline and directions',
      'Tap any line to copy it into your post',
    ],
    stepsBn: [
      'সহজ, এলোমেলো শব্দে আপনার আইডিয়া লিখুন',
      'জেনারেট চাপুন — নাম, ট্যাগলাইন ও দিক পাবেন',
      'যেকোনো লাইনে ট্যাপ করে কপি করুন',
    ],
    prefill: '',
    Icon: makeIcon('title'),
  },
  {
    id: 'validator',
    name: 'Idea Validator',
    nameBn: 'আইডিয়া ভ্যালিডেটর',
    tagline: 'Score market potential, spot the risks',
    taglineBn: 'মার্কেট সম্ভাবনা স্কোর, ঝুঁকি চিহ্নিত',
    accent: '#2ead4b',
    cta: 'Validate idea',
    ctaBn: 'যাচাই করুন',
    desc: 'Describe what you are building and get an honest market-potential score, the reasons it can work, the risks to watch, and your single next move.',
    descBn: 'আপনি কী বানাচ্ছেন লিখুন — সৎ মার্কেট-সম্ভাবনা স্কোর, কেন কাজ করবে, কোন ঝুঁকি খেয়াল রাখবেন ও পরবর্তী পদক্ষেপ পান।',
    demoPrompt: 'RidePool — split CNG fares…',
    demoPromptBn: 'রাইডপুল — সিএনজি ভাড়া ভাগ…',
    label: 'What are you building?',
    labelBn: 'আপনি কী বানাচ্ছেন?',
    ph: 'e.g. RidePool — BUET students pool a CNG to campus and split the fare, saving ~55tk a trip',
    phBn: 'যেমন: রাইডপুল — বুয়েট শিক্ষার্থীরা সিএনজি ভাগ করে ক্যাম্পাসে যায়, ট্রিপে ~৫৫৳ বাঁচে',
    steps: [
      'Describe what you are building, with any numbers you have',
      'Tap Validate for a market score and the real risks',
      'Act on the single next move it hands you',
    ],
    stepsBn: [
      'কী বানাচ্ছেন লিখুন, সাথে যেকোনো সংখ্যা দিন',
      'যাচাই করুন চাপুন — স্কোর ও আসল ঝুঁকি পাবেন',
      'পরবর্তী একটি পদক্ষেপ অনুসরণ করুন',
    ],
    prefill: '',
    Icon: makeIcon('validator'),
  },
  {
    id: 'matcher',
    name: 'AI Co-founder Matcher',
    nameBn: 'এআই কো-ফাউন্ডার ম্যাচার',
    tagline: 'Find builders with complementary skills',
    taglineBn: 'পরিপূরক স্কিলের বিল্ডার খুঁজুন',
    accent: '#38c8ff',
    cta: 'Find my match',
    ctaBn: 'ম্যাচ খুঁজুন',
    desc: 'Say what you bring and what you are missing. The AI ranks builders whose skills complete yours, with a match score and why each one fits.',
    descBn: 'আপনি কী আনেন ও কী নেই বলুন। এআই আপনার স্কিল পূর্ণ করে এমন বিল্ডার র‍্যাঙ্ক করে — ম্যাচ স্কোর ও কারণসহ।',
    demoPrompt: 'I code but can’t sell…',
    demoPromptBn: 'আমি কোড করি, বিক্রি পারি না…',
    label: 'What you bring, and what you need',
    labelBn: 'আপনি কী আনেন, আর কী দরকার',
    ph: 'e.g. I code full-stack and shipped the product, but I can’t sell...',
    phBn: 'যেমন: আমি ফুল-স্ট্যাক কোড করি, প্রোডাক্ট শিপ করেছি, কিন্তু বিক্রি পারি না...',
    steps: [
      'Say what you bring and what skills you are missing',
      'Tap Find my match to rank complementary builders',
      'Request an intro to anyone who fits',
    ],
    stepsBn: [
      'আপনি কী আনেন ও কোন স্কিল নেই বলুন',
      'ম্যাচ খুঁজুন চাপুন — পরিপূরক বিল্ডার র‍্যাঙ্ক হবে',
      'যাকে মানানসই মনে হয় তার সাথে ইন্ট্রো চান',
    ],
    prefill: 'I code full-stack and shipped RidePool, but I can’t sell. Looking for a business / growth co-founder in Dhaka.',
    Icon: makeIcon('matcher'),
  },
  {
    id: 'gigwriter',
    name: 'Skill Gig Writer',
    nameBn: 'স্কিল গিগ রাইটার',
    tagline: 'Turn a skill into a polished listing',
    taglineBn: 'স্কিলকে সার্ভিস লিস্টিং বানান',
    accent: '#b86700',
    cta: 'Write my listing',
    ctaBn: 'লিস্টিং লিখুন',
    desc: 'Describe what you are good at. The AI writes a ready-to-post service listing — a strong title, description, deliverables, tags, and a suggested price.',
    descBn: 'আপনি কীসে দক্ষ লিখুন। এআই পোস্ট-রেডি সার্ভিস লিস্টিং লেখে — টাইটেল, বিবরণ, ডেলিভারেবল, ট্যাগ ও প্রস্তাবিত দাম।',
    demoPrompt: 'I design clean logos…',
    demoPromptBn: 'আমি পরিষ্কার লোগো ডিজাইন করি…',
    label: 'Describe your skill',
    labelBn: 'আপনার স্কিল বর্ণনা করুন',
    ph: 'e.g. I design clean modern logos in Illustrator, fast turnaround, 2 revisions included',
    phBn: 'যেমন: আমি ইলাস্ট্রেটরে পরিষ্কার আধুনিক লোগো ডিজাইন করি, দ্রুত ডেলিভারি, ২টি রিভিশন',
    steps: [
      'Describe the skill you want to sell',
      'Tap Write my listing for a full service post',
      'Copy the title, description and price to publish',
    ],
    stepsBn: [
      'যে স্কিল বিক্রি করতে চান তা লিখুন',
      'লিস্টিং লিখুন চাপুন — পূর্ণ সার্ভিস পোস্ট পাবেন',
      'টাইটেল, বিবরণ ও দাম কপি করে পাবলিশ করুন',
    ],
    prefill: '',
    Icon: makeIcon('gigwriter'),
  },
  {
    id: 'summarizer',
    name: 'Feedback Summarizer',
    nameBn: 'ফিডব্যাক সামারাইজার',
    tagline: 'All the comments, boiled to key points',
    taglineBn: 'সব কমেন্ট থেকে মূল পয়েন্ট',
    accent: '#0ea5a5',
    cta: 'Summarize feedback',
    ctaBn: 'সারসংক্ষেপ করুন',
    desc: 'Paste all the comments on your idea. The AI clusters them into a few key themes, reads the overall sentiment, and flags the top request to act on.',
    descBn: 'আপনার আইডিয়ার সব কমেন্ট পেস্ট করুন। এআই কয়েকটি মূল থিমে সাজায়, সামগ্রিক মনোভাব বোঝে ও সবচেয়ে গুরুত্বপূর্ণ অনুরোধ চিহ্নিত করে।',
    demoPrompt: '18 comments pasted…',
    demoPromptBn: '১৮টি কমেন্ট পেস্ট…',
    label: 'Paste the comments — one per line',
    labelBn: 'কমেন্টগুলো পেস্ট করুন — প্রতি লাইনে একটি',
    ph: 'Love this but wish it worked offline\nHow much does pro cost?\n...',
    phBn: 'অফলাইনে চললে ভালো হতো\nপ্রো প্ল্যানের দাম কত?\n...',
    steps: [
      'Paste all the comments, one per line',
      'Tap Summarize to cluster them into key themes',
      'Focus on the top request it flags',
    ],
    stepsBn: [
      'সব কমেন্ট পেস্ট করুন, প্রতি লাইনে একটি',
      'সারসংক্ষেপ চাপুন — মূল থিমে সাজাবে',
      'সবচেয়ে গুরুত্বপূর্ণ অনুরোধে মনোযোগ দিন',
    ],
    prefill:
      'Love the idea but wish it worked offline\nHow much will the pro plan cost?\nSignup was a bit confusing on mobile\nThis would save my shop so much time\nCan you add bKash payments?\nWould happily pay for a team plan',
    Icon: makeIcon('summarizer'),
  },
  {
    id: 'bio',
    name: 'Profile Bio Generator',
    nameBn: 'প্রোফাইল বায়ো জেনারেটর',
    tagline: 'A few basics in, a full bio out',
    taglineBn: 'কয়েকটি তথ্য থেকে পূর্ণ বায়ো',
    accent: '#d03238',
    cta: 'Write my bio',
    ctaBn: 'বায়ো লিখুন',
    desc: 'Give a few basics — your name, university, what you build, your skills. The AI writes a polished profile bio, a one-line headline, and skill tags.',
    descBn: 'কয়েকটি তথ্য দিন — নাম, বিশ্ববিদ্যালয়, কী বানান, স্কিল। এআই একটি সুন্দর প্রোফাইল বায়ো, এক লাইনের হেডলাইন ও স্কিল ট্যাগ লেখে।',
    demoPrompt: 'Tahmid, CSE at BUET…',
    demoPromptBn: 'তাহমিদ, বুয়েট সিএসই…',
    label: 'A few basics about you',
    labelBn: 'আপনার কয়েকটি তথ্য',
    ph: 'Name, university, what you’re building, your skills, what you’re looking for',
    phBn: 'নাম, বিশ্ববিদ্যালয়, কী বানাচ্ছেন, আপনার স্কিল, কী খুঁজছেন',
    steps: [
      'Give a few basics — name, uni, what you build, skills',
      'Tap Write my bio for a polished profile bio',
      'Copy the bio, headline and tags to your profile',
    ],
    stepsBn: [
      'কয়েকটি তথ্য দিন — নাম, বিশ্ববিদ্যালয়, কাজ, স্কিল',
      'বায়ো লিখুন চাপুন — সুন্দর প্রোফাইল বায়ো পাবেন',
      'বায়ো, হেডলাইন ও ট্যাগ প্রোফাইলে কপি করুন',
    ],
    prefill:
      'Tahmid Karim, CSE at BUET, building RidePool (split rides to campus). Skills: full-stack dev, product. Looking for a business co-founder.',
    Icon: makeIcon('bio'),
  },
];

export const AI_TOOL_IDS = AI_TOOLS.map((t) => t.id);

export function getAiTool(id: string): AiTool | undefined {
  return AI_TOOLS.find((t) => t.id === id);
}

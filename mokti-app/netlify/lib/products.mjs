// Which PDF(s) each Razorpay Payment Page delivers.
//
// A paid order is matched to a product in this order:
//   1. pageId: the Payment Page id (starts with "pl_"), if it appears anywhere in the payment.
//   2. match: words from the page title, looked for in the payment's description and notes.
//   3. amount: only for prices no other product uses (the two bundles).
// If nothing matches, the buyer is not emailed and Surbhi gets an email to send it by hand.
//
// "files" are names of Netlify environment variables. Each one holds the Google Drive
// share link (or any direct https link) of one PDF. The PDFs themselves never go in
// this public repo.

export const PRODUCTS = [
  // ----- Novellas -----
  { key: "ebookWasThatLove", title: "Was That Love Or Just…???", match: ["was that love"], files: ["PDF_WAS_THAT_LOVE"] },
  { key: "ebookCoincidence", title: "When Coincidence Felt Like Love", match: ["coincidence"], files: ["PDF_COINCIDENCE"] },

  // ----- Guides, poems and short stories -----
  { key: "ebookLoveYourselfFirst", title: "Love Yourself First", match: ["love yourself first"], files: ["PDF_LOVE_YOURSELF_FIRST"] },
  { key: "ebookHealingAfterHeartbreak", title: "Healing After Heartbreak", match: ["healing after heartbreak"], files: ["PDF_HEALING_AFTER_HEARTBREAK"] },
  { key: "ebookDearMe", title: "Dear Me: 100 Journaling Prompts", match: ["dear me"], files: ["PDF_DEAR_ME"] },
  { key: "ebookTextMeBack", title: "Text Me Back", match: ["text me back"], files: ["PDF_TEXT_ME_BACK"] },
  { key: "ebookRedFlagsGreenFlags", title: "Red Flags, Green Flags", match: ["red flags"], files: ["PDF_RED_FLAGS_GREEN_FLAGS"] },
  { key: "ebookLettersINeverSent", title: "Letters I Never Sent", match: ["letters i never sent"], files: ["PDF_LETTERS_I_NEVER_SENT"] },
  { key: "ebookMilesApart", title: "Miles Apart, Hearts Together", match: ["miles apart"], files: ["PDF_MILES_APART"] },
  { key: "ebookStoriesWeNeverTold", title: "Stories We Never Told", match: ["stories we never told"], files: ["PDF_STORIES_WE_NEVER_TOLD"] },
  {
    key: "bundleAll", title: "The MOKTI Complete Bundle (all 10 ebooks)", match: ["complete bundle"], amount: 69900,
    files: ["PDF_WAS_THAT_LOVE", "PDF_COINCIDENCE", "PDF_LOVE_YOURSELF_FIRST", "PDF_HEALING_AFTER_HEARTBREAK", "PDF_DEAR_ME",
      "PDF_TEXT_ME_BACK", "PDF_RED_FLAGS_GREEN_FLAGS", "PDF_LETTERS_I_NEVER_SENT", "PDF_MILES_APART", "PDF_STORIES_WE_NEVER_TOLD"]
  },

  // ----- AI guides -----
  { key: "ebookClaudeMadeSimple", title: "Claude Made Simple", match: ["claude made simple"], files: ["PDF_CLAUDE_MADE_SIMPLE"] },
  { key: "ebookPromptLikeAPro", title: "Prompt Like a Pro", match: ["prompt like a pro"], files: ["PDF_PROMPT_LIKE_A_PRO"] },
  { key: "ebookAIEverydayLife", title: "AI for Everyday Life", match: ["everyday life"], files: ["PDF_AI_EVERYDAY_LIFE"] },
  { key: "ebookAutomateIt", title: "Automate It!", match: ["automate it"], files: ["PDF_AUTOMATE_IT"] },
  { key: "ebookTeachClaudeSkills", title: "Teach Claude New Skills", match: ["teach claude"], files: ["PDF_TEACH_CLAUDE_SKILLS"] },
  { key: "ebookAIStudentsJobs", title: "AI for Students and Job Seekers", match: ["students"], files: ["PDF_AI_STUDENTS_JOBS"] },
  { key: "ebookAIInstagramBusiness", title: "AI for Instagram and Small Business", match: ["instagram"], files: ["PDF_AI_INSTAGRAM_BUSINESS"] },
  {
    key: "bundleAI", title: "The MOKTI AI Combo (all 7 AI guides)", match: ["ai combo", "all 7"], amount: 39900,
    files: ["PDF_CLAUDE_MADE_SIMPLE", "PDF_PROMPT_LIKE_A_PRO", "PDF_AI_EVERYDAY_LIFE", "PDF_AUTOMATE_IT",
      "PDF_TEACH_CLAUDE_SKILLS", "PDF_AI_STUDENTS_JOBS", "PDF_AI_INSTAGRAM_BUSINESS"]
  }
];

// The "pl_..." id of each Razorpay Payment Page (Dashboard > Payment Pages), collected 2026-10-17.
export const PAGE_IDS = {
  bundleAI: "pl_ToYeD20yYI5Byo",
  ebookAIInstagramBusiness: "pl_ToYcFwRGedeNEW",
  ebookAIStudentsJobs: "pl_ToYZrJ0jzzvC6m",
  ebookTeachClaudeSkills: "pl_ToYYYbEqC5tIul",
  ebookAutomateIt: "pl_ToYXGrOyVuk2mR",
  ebookAIEverydayLife: "pl_ToYVyiTAg3ySTN",
  ebookPromptLikeAPro: "pl_ToYUX98P3hyJsU",
  ebookClaudeMadeSimple: "pl_ToYRRlew7jBQnl",
  bundleAll: "pl_ToCPP94hRPQeQM",
  ebookStoriesWeNeverTold: "pl_ToCOXjycngsiL8",
  ebookMilesApart: "pl_ToCNsOOJibzk4W",
  ebookLettersINeverSent: "pl_ToCN3zbSpgjynR",
  ebookRedFlagsGreenFlags: "pl_ToCMF6C0kinMik",
  ebookTextMeBack: "pl_ToCLQ5lqkLadPl",
  ebookDearMe: "pl_ToCKc21qejpLmj",
  ebookHealingAfterHeartbreak: "pl_ToCJneKsKeR8KK",
  ebookLoveYourselfFirst: "pl_ToCIgANPNByYON",
  ebookCoincidence: "pl_ToCHXaV4cM6tmS",
  ebookWasThatLove: "pl_ToCFlnMFXNqOBg"
};

// File name each PDF gets in the buyer's inbox.
export const FILE_NAMES = {
  PDF_WAS_THAT_LOVE: "Was That Love Or Just - Surbhi Priya.pdf",
  PDF_COINCIDENCE: "When Coincidence Felt Like Love - Surbhi Priya.pdf",
  PDF_LOVE_YOURSELF_FIRST: "Love Yourself First - Surbhi Priya.pdf",
  PDF_HEALING_AFTER_HEARTBREAK: "Healing After Heartbreak - Surbhi Priya.pdf",
  PDF_DEAR_ME: "Dear Me - 100 Journaling Prompts - Surbhi Priya.pdf",
  PDF_TEXT_ME_BACK: "Text Me Back - Surbhi Priya.pdf",
  PDF_RED_FLAGS_GREEN_FLAGS: "Red Flags Green Flags - Surbhi Priya.pdf",
  PDF_LETTERS_I_NEVER_SENT: "Letters I Never Sent - Surbhi Priya.pdf",
  PDF_MILES_APART: "Miles Apart Hearts Together - Surbhi Priya.pdf",
  PDF_STORIES_WE_NEVER_TOLD: "Stories We Never Told - Surbhi Priya.pdf",
  PDF_CLAUDE_MADE_SIMPLE: "Claude Made Simple - Surbhi Priya.pdf",
  PDF_PROMPT_LIKE_A_PRO: "Prompt Like a Pro - Surbhi Priya.pdf",
  PDF_AI_EVERYDAY_LIFE: "AI for Everyday Life - Surbhi Priya.pdf",
  PDF_AUTOMATE_IT: "Automate It - Surbhi Priya.pdf",
  PDF_TEACH_CLAUDE_SKILLS: "Teach Claude New Skills - Surbhi Priya.pdf",
  PDF_AI_STUDENTS_JOBS: "AI for Students and Job Seekers - Surbhi Priya.pdf",
  PDF_AI_INSTAGRAM_BUSINESS: "AI for Instagram and Small Business - Surbhi Priya.pdf"
};

export function findProduct(payment, rawBody, order = {}) {
  for (const [key, id] of Object.entries(PAGE_IDS)) {
    if (id && rawBody.includes(id)) return PRODUCTS.find(p => p.key === key);
  }
  const values = obj => (obj && typeof obj === "object" ? Object.values(obj) : []);
  const text = [payment.description, ...values(payment.notes), order.receipt, ...values(order.notes)].filter(v => typeof v === "string").join(" ").toLowerCase();
  // Bundles first, so "all 7 AI guides: Claude Made Simple, ..." is not read as one guide.
  const ordered = [...PRODUCTS.filter(p => p.amount), ...PRODUCTS.filter(p => !p.amount)];
  const byTitle = ordered.find(p => p.match.some(m => text.includes(m)));
  if (byTitle) return byTitle;
  return PRODUCTS.find(p => p.amount && p.amount === payment.amount);
}

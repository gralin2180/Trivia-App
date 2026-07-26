export type EducationLevel = 'school' | 'college' | 'university';

export type SyllabusGap = {
  id: string;
  level: EducationLevel;
  topic: string;
  title: string;
  lagSummary: string;
  stats: string[];
  bridgeSkills: string[];
  /** Prompt fed into deck generation so cards teach the gap + bridge. */
  deckPrompt: string;
};

export const SYLLABUS_GAPS: SyllabusGap[] = [
  {
    id: 'ai-universities',
    level: 'university',
    topic: 'AI in universities — syllabus vs industry',
    title: 'AI literacy on campus',
    lagSummary:
      'Most degree programs still treat AI as an elective footnote while employers expect daily AI fluency.',
    stats: [
      '~70% of employers say AI skills are already required or preferred for new grads (industry surveys, 2024–25).',
      'Fewer than 1 in 5 undergraduates get structured AI coursework outside CS majors in many regions.',
      'Workplace AI adoption is growing double-digits yearly — classroom policy often lags by 2–4 years.',
    ],
    bridgeSkills: [
      'Prompt design & verification (not blind copy-paste)',
      'AI ethics, citation, and academic integrity',
      'Using AI for research, coding, and writing workflows',
      'Evaluating model limits, bias, and hallucinations',
    ],
    deckPrompt:
      'Focus on how university syllabi lag real-world AI use. Include statistics on employer demand vs campus teaching, concrete bridge skills (prompting, verification, ethics), and practical examples for non-CS students. Keep cards actionable.',
  },
  {
    id: 'data-literacy-college',
    level: 'college',
    topic: 'Data literacy for college careers',
    title: 'Data literacy gap',
    lagSummary:
      'Spreadsheets and dashboards run modern work — many college tracks still stop at basic stats.',
    stats: [
      'Data-related roles are among the fastest-growing white-collar job families globally.',
      'Analysts estimate a multi-million person shortage in data-fluent workers this decade.',
      'Most “intro stats” courses never cover modern BI tools, SQL basics, or data storytelling.',
    ],
    bridgeSkills: [
      'SQL fundamentals & clean spreadsheets',
      'Charts that explain decisions (not decorate slides)',
      'Basic Python/R for analysis',
      'Spotting misleading stats in the wild',
    ],
    deckPrompt:
      'Teach the college data-literacy gap: what schools teach vs what workplaces need. Include realistic statistics, SQL/spreadsheet bridge skills, and how to read misleading charts. Practical, not academic jargon.',
  },
  {
    id: 'cyber-school',
    level: 'school',
    topic: 'Digital safety & cyber basics for school',
    title: 'Cyber basics in school',
    lagSummary:
      'Kids live online; many school IT courses still emphasize Word/PowerPoint over security habits.',
    stats: [
      'Teen phishing / account takeover attempts rose sharply with social + gaming accounts.',
      'Schools report rising device policies but uneven cyber-hygiene curriculum.',
      'Most breaches start with simple human mistakes — passwords, links, oversharing.',
    ],
    bridgeSkills: [
      'Password managers & MFA',
      'Spotting scams and deepfakes',
      'Privacy settings & digital footprint',
      'Safe AI chat use for homework',
    ],
    deckPrompt:
      'School-level digital safety: where syllabi lag real online risks. Include age-appropriate stats, phishing, privacy, MFA, and responsible AI use for homework. Clear and practical cards.',
  },
  {
    id: 'climate-tech-uni',
    level: 'university',
    topic: 'Climate tech & energy transition careers',
    title: 'Climate tech careers',
    lagSummary:
      'Energy transition hiring is booming; many degrees still teach climate as theory without tools or markets.',
    stats: [
      'Clean-energy jobs are among the fastest-growing sectors in multiple economies.',
      'Employers seek carbon accounting, grid basics, and climate-risk literacy — not only activism essays.',
      'University climate modules often omit policy markets, LCA, and startup case studies.',
    ],
    bridgeSkills: [
      'Carbon footprints & LCA basics',
      'Grid / renewables literacy',
      'Climate risk for business decisions',
      'Reading IPCC summaries critically',
    ],
    deckPrompt:
      'University climate-tech gap: academia vs industry. Include hiring trends, carbon accounting basics, renewables literacy, and what to learn to be job-ready. Evidence-backed cards.',
  },
  {
    id: 'soft-skills-college',
    level: 'college',
    topic: 'Communication & teamwork for the real workplace',
    title: 'Workplace soft skills',
    lagSummary:
      'Group projects exist, but few colleges teach async collaboration, feedback, or stakeholder updates like real jobs.',
    stats: [
      'Managers consistently rank communication above hard skills for early-career promotions.',
      'Remote/hybrid work made written clarity a core skill — rarely graded in syllabi.',
      'Interns struggle most with status updates, estimation, and asking for help early.',
    ],
    bridgeSkills: [
      'Writing crisp updates (Slack/email)',
      'Running a 15-min stand-up',
      'Giving & receiving feedback',
      'Estimating work honestly',
    ],
    deckPrompt:
      'College soft-skills gap vs workplace. Stats on communication in hiring/promotions, async writing, feedback, and practical drills. Concrete examples students can use tomorrow.',
  },
  {
    id: 'product-ai-tools',
    level: 'university',
    topic: 'Product thinking with modern AI tools',
    title: 'Product + AI tools',
    lagSummary:
      'Startups ship with Figma + AI coding assistants; many CS/design courses still silo “theory” from shipping.',
    stats: [
      'Developer surveys show majority of professionals already use AI coding assistants weekly.',
      'Product roles expect prototyping speed that older curricula never measured.',
      'Portfolio projects that ship beat perfect exam scores for many hiring managers.',
    ],
    bridgeSkills: [
      'Problem → prototype → feedback loops',
      'Using AI assistants without losing ownership',
      'User research lite',
      'Shipping a tiny public project',
    ],
    deckPrompt:
      'How universities lag product/AI shipping culture. Include industry stats on AI assistant use, prototyping mindset, and bridge skills to build a portfolio. Practical cards for students.',
  },
];

export function getSyllabusGap(id: string): SyllabusGap | undefined {
  return SYLLABUS_GAPS.find((g) => g.id === id);
}

export function levelLabel(level: EducationLevel): string {
  if (level === 'school') return 'School';
  if (level === 'college') return 'College';
  return 'University';
}

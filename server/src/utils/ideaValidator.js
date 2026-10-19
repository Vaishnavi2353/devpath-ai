/**
 * DevPath Project Idea Validator & Heuristics Engine
 * 
 * Responsibilities:
 * - Deterministic, server-side validation of project idea descriptions
 * - Prevents keyboard mashing, repeated characters, low-entropy noise, and meaningless inputs
 * - Protects legitimate concise ideas, technical jargon, acronyms, and non-native English
 * - Returns structured results with actionable, non-judgmental guidance
 */

// Common English words, prepositions, nouns, verbs, and tech terms
const COMMON_VOCABULARY = new Set([
  // Basic English prepositions, conjunctions, pronouns, verbs
  'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
  'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'can', 'could', 'will', 'would',
  'should', 'may', 'might', 'must', 'it', 'its', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose',
  'where', 'when', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 's', 't', 'just', 'don', 'now',

  // Project intent, actions & goals
  'build', 'building', 'create', 'creating', 'develop', 'developing', 'make', 'making',
  'design', 'designing', 'implement', 'implementing', 'generate', 'generating',
  'track', 'tracking', 'manage', 'managing', 'monitor', 'monitoring', 'automate',
  'automating', 'analyze', 'analyzing', 'visualize', 'visualizing', 'calculate',
  'solve', 'solving', 'help', 'helping', 'allow', 'allows', 'allowing', 'enable',
  'provide', 'provides', 'providing', 'connect', 'connecting', 'share', 'sharing',
  'learn', 'learning', 'teach', 'teaching', 'practice', 'practicing', 'study',
  'organize', 'organizing', 'display', 'displaying', 'show', 'showing', 'render',
  'convert', 'converting', 'parse', 'parsing', 'scrape', 'scraping', 'crawl',
  'stream', 'streaming', 'notify', 'notifying', 'schedule', 'scheduling',

  // Software nouns & concepts
  'app', 'application', 'web', 'website', 'platform', 'tool', 'service', 'system',
  'dashboard', 'interface', 'ui', 'ux', 'api', 'cli', 'bot', 'backend', 'frontend',
  'fullstack', 'database', 'server', 'client', 'mobile', 'desktop', 'extension',
  'plugin', 'library', 'framework', 'package', 'module', 'component', 'widget',
  'portal', 'site', 'page', 'screen', 'view', 'editor', 'viewer', 'explorer',
  'manager', 'tracker', 'calculator', 'converter', 'generator', 'simulator',
  'player', 'reader', 'scanner', 'assistant', 'companion', 'engine', 'hub',

  // Common application domains & student project types
  'student', 'students', 'user', 'users', 'developer', 'developers', 'coder', 'coders',
  'project', 'projects', 'task', 'tasks', 'todo', 'todos', 'note', 'notes',
  'notebook', 'markdown', 'flashcard', 'flashcards', 'quiz', 'quizzes', 'exam',
  'portfolio', 'blog', 'post', 'posts', 'article', 'articles', 'feed', 'forum',
  'chat', 'message', 'messages', 'messaging', 'social', 'community', 'network',
  'media', 'video', 'videos', 'audio', 'music', 'sound', 'image', 'images', 'photo',
  'photos', 'file', 'files', 'document', 'documents', 'pdf', 'csv', 'excel',
  'ecommerce', 'store', 'shop', 'cart', 'checkout', 'payment', 'payments',
  'product', 'products', 'item', 'items', 'order', 'orders', 'inventory',
  'fitness', 'workout', 'gym', 'health', 'habit', 'habits', 'routine',
  'finance', 'budget', 'expense', 'expenses', 'money', 'investment', 'stock',
  'weather', 'forecast', 'map', 'maps', 'location', 'travel', 'trip', 'flight',
  'hotel', 'booking', 'reservation', 'event', 'events', 'calendar', 'time',
  'timer', 'pomodoro', 'clock', 'stopwatch', 'alarm', 'reminder', 'reminders',
  'recipe', 'recipes', 'food', 'meal', 'restaurant', 'game', 'games', 'gaming',
  'score', 'leaderboard', 'auth', 'authentication', 'login', 'signup', 'register',
  'profile', 'account', 'password', 'token', 'session', 'role', 'roles', 'permission',
  'collaborative', 'collaboration', 'realtime', 'live', 'sync', 'synchronization',
  'offline', 'storage', 'cache', 'caching', 'search', 'filter', 'filtering',
  'sorting', 'export', 'import', 'upload', 'download', 'stats', 'analytics',
  'metrics', 'report', 'reports', 'log', 'logs', 'logger', 'logging', 'alert',
  'alerts', 'notification', 'notifications', 'email', 'sms', 'push',

  // Tech acronyms & technologies (case-insensitive in Set)
  'react', 'vue', 'angular', 'svelte', 'next', 'nuxt', 'remix', 'astro', 'vite',
  'node', 'express', 'fastify', 'nest', 'django', 'flask', 'fastapi', 'spring',
  'rails', 'laravel', 'gin', 'fiber', 'actix', 'axum', 'dotnet', 'aspnet',
  'python', 'javascript', 'typescript', 'golang', 'go', 'rust', 'java', 'kotlin',
  'swift', 'csharp', 'cpp', 'php', 'ruby', 'dart', 'flutter', 'html', 'css',
  'tailwind', 'bootstrap', 'sass', 'sql', 'mysql', 'postgres', 'postgresql',
  'mongodb', 'mongo', 'sqlite', 'redis', 'prisma', 'drizzle', 'graphql', 'rest',
  'crud', 'jwt', 'oauth', 'docker', 'kubernetes', 'k8s', 'aws', 'gcp', 'azure',
  's3', 'lambda', 'wasm', 'ast', 'iot', 'ai', 'ml', 'nlp', 'llm', 'cv', 'git',
  'github', 'ci', 'cd', 'sdk', 'p2p', 'saas', 'crm', 'pos', 'seo', 'rss',
]);

// Keyboard row sequences for mashing detection (forward & reverse)
const KEYBOARD_SEQUENCES = [
  'qwertyuiop', 'poiuytrewq',
  'asdfghjkl', 'lkjhgfdsa',
  'zxcvbnm', 'mnbvcxz',
  '1234567890', '0987654321',
  'qwerasdf', 'asdfzxcv',
];

/**
 * Validates a submitted problem statement / project idea.
 * 
 * Returns an object:
 * {
 *   isValid: boolean,
 *   error?: string,
 *   details?: string[]
 * }
 */
function validateProjectIdea(rawInput) {
  if (rawInput === undefined || rawInput === null) {
    return {
      isValid: false,
      error: 'Problem statement is required.',
      details: ['problemStatement: Problem statement is required.'],
    };
  }

  if (typeof rawInput !== 'string') {
    return {
      isValid: false,
      error: 'Problem statement must be text.',
      details: ['problemStatement: Problem statement must be text.'],
    };
  }

  const trimmed = rawInput.trim();

  // 1. Length bounds
  if (trimmed.length === 0) {
    return {
      isValid: false,
      error: 'Problem statement cannot be empty.',
      details: ['problemStatement: Please describe your project idea with at least 10 characters.'],
    };
  }

  if (trimmed.length < 10) {
    return {
      isValid: false,
      error: 'Problem statement is too short.',
      details: ['problemStatement: Please describe your project idea with at least 10 characters to generate a realistic plan.'],
    };
  }

  if (trimmed.length > 2500) {
    return {
      isValid: false,
      error: 'Problem statement is too long.',
      details: ['problemStatement: Problem statement must not exceed 2500 characters.'],
    };
  }

  // 2. Minimum alphabetic content (guard against pure numbers / symbols)
  const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, '');
  if (lettersOnly.length < 4) {
    return {
      isValid: false,
      error: 'Invalid project description.',
      details: ['problemStatement: Please use descriptive words to explain what you want to build.'],
    };
  }

  // 3. Repeated single character runs (e.g. "aaaaa", "11111", "zzzzzz")
  // 4+ identical alphanumeric characters in a row
  if (/([a-zA-Z0-9])\1{3,}/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Invalid project description.',
      details: ['problemStatement: Project description contains excessive repeated characters. Please describe a genuine project idea.'],
    };
  }

  // 4. Repeated short patterns (e.g. "asdfasdfasdf", "abcabcabc", "123123123")
  const cleanNoSpaces = trimmed.replace(/\s+/g, '').toLowerCase();
  const patternMatch = cleanNoSpaces.match(/(.{2,6})\1{2,}/);
  if (patternMatch) {
    const repeatedChunk = patternMatch[0];
    if (repeatedChunk.length >= cleanNoSpaces.length * 0.55 || cleanNoSpaces.length <= 25) {
      return {
        isValid: false,
        error: 'Invalid project description.',
        details: ['problemStatement: Project description contains repeated pattern loops. Please describe what you want to build in plain words.'],
      };
    }
  }

  // 5. Unique character variety check
  // For any text >= 12 characters, require at least 4 unique letters
  const uniqueLetters = new Set(lettersOnly.toLowerCase().split(''));
  if (lettersOnly.length >= 12 && uniqueLetters.size < 4) {
    return {
      isValid: false,
      error: 'Invalid project description.',
      details: ['problemStatement: Project description lacks sufficient character variety to represent an actionable project.'],
    };
  }

  // 6. Words tokenization
  const tokens = trimmed.split(/[\s,./\\;:'"!?()\[\]{}<>=+_-]+/).filter(Boolean);

  // 7. Repeated identical words (e.g., "project project project project")
  if (tokens.length >= 3) {
    const lowerTokens = tokens.map((t) => t.toLowerCase());
    const tokenCounts = {};
    for (const t of lowerTokens) {
      tokenCounts[t] = (tokenCounts[t] || 0) + 1;
    }
    const maxFreq = Math.max(...Object.values(tokenCounts));
    if (maxFreq / lowerTokens.length >= 0.75) {
      return {
        isValid: false,
        error: 'Invalid project description.',
        details: ['problemStatement: Project description repeats the same word continuously. Please provide a clear description of your project.'],
      };
    }
  }

  // 8. Single continuous string without spaces > 20 characters (unless it's a URL or recognized compound name)
  const isUrl = /^https?:\/\//i.test(trimmed);
  if (tokens.length === 1 && trimmed.length > 20 && !isUrl) {
    return {
      isValid: false,
      error: 'Invalid project description.',
      details: ['problemStatement: Project description appears to be a single unbroken string. Please use separate words to describe your idea.'],
    };
  }

  // 9. Keyboard row mashing detection (e.g., "asdfghjkl", "qwertyuiop", "adasfsdghnufdyynrntutyjyj")
  for (const seq of KEYBOARD_SEQUENCES) {
    for (let i = 0; i <= seq.length - 5; i++) {
      const sub = seq.substring(i, i + 5);
      if (cleanNoSpaces.includes(sub)) {
        // If a 5+ key keyboard walk appears and the text has no clear dictionary words, reject
        const hasKnownWord = tokens.some((t) => COMMON_VOCABULARY.has(t.toLowerCase()));
        if (!hasKnownWord) {
          return {
            isValid: false,
            error: 'Invalid project description.',
            details: ['problemStatement: The description appears to contain keyboard mashing. Please share a genuine project idea.'],
          };
        }
      }
    }
  }

  // 10. Consonant cluster check (gibberish indicator)
  // In standard English words and common tech terms, 6+ consecutive consonants without vowels is virtually always gibberish
  // (treating 'y' as vowel/consonant friendly)
  const lowercaseLettersOnly = lettersOnly.toLowerCase();
  const CONSONANTS_REGEX = /[bcdfghjklmnpqrstvwxz]{6,}/i;
  for (const token of tokens) {
    // If an individual token has 6+ consecutive strict consonants and isn't an uppercase acronym
    if (CONSONANTS_REGEX.test(token) && token !== token.toUpperCase()) {
      return {
        isValid: false,
        error: 'Invalid project description.',
        details: ['problemStatement: The project description contains unreadable or random character clusters. Please provide a clear project summary.'],
      };
    }
  }

  // 11. Vowel-to-letter ratio
  // Standard English words and reasonable technical descriptions have 15% to 80% vowels
  const vowelsCount = (lowercaseLettersOnly.match(/[aeiouy]/g) || []).length;
  const vowelRatio = vowelsCount / lowercaseLettersOnly.length;

  // If there are > 12 letters and 0 vowels or vowel ratio < 0.10:
  if (lowercaseLettersOnly.length >= 12 && (vowelsCount === 0 || vowelRatio < 0.10)) {
    // Check if it's purely uppercase acronyms
    const isAllAcronyms = tokens.every((t) => t === t.toUpperCase() && t.length <= 5);
    if (!isAllAcronyms) {
      return {
        isValid: false,
        error: 'Invalid project description.',
        details: ['problemStatement: The project description contains an unnatural character distribution. Please describe your project in clear words.'],
      };
    }
  }

  // 12. Recognizable Vocabulary / Meaningful Intent Heuristic
  // Check if at least one token matches our extensive vocabulary, OR is a recognized acronym,
  // OR the text has multiple well-formed words with standard length and vowels
  let recognizableWordsCount = 0;
  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (COMMON_VOCABULARY.has(lower)) {
      recognizableWordsCount++;
    } else if (token === token.toUpperCase() && token.length >= 2 && token.length <= 6) {
      // Standalone acronym like API, REST, WASM, CLI, JWT, AST, DB, UI
      recognizableWordsCount++;
    } else if (lower.length >= 3 && lower.length <= 15) {
      // Check if it has a normal vowel pattern (at least 1 vowel, no 5-consonant block)
      const tokenVowels = (lower.match(/[aeiouy]/g) || []).length;
      if (tokenVowels >= 1 && !CONSONANTS_REGEX.test(lower)) {
        // Plausible natural word
        recognizableWordsCount++;
      }
    }
  }

  if (recognizableWordsCount === 0) {
    return {
      isValid: false,
      error: 'Invalid project description.',
      details: ['problemStatement: We could not identify meaningful project words in your description. Please explain what you want to build.'],
    };
  }

  return { isValid: true };
}

module.exports = {
  validateProjectIdea,
  COMMON_VOCABULARY,
};

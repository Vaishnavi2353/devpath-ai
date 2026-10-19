/**
 * DevPath Service
 * 
 * Responsibilities:
 * - Build AI prompt tailored to student's inputs
 * - Invoke Gemini API using @google/genai SDK
 * - Parse and sanitize AI JSON response
 * - Validate AI output strictly with Zod
 * - Assign backend-owned stable IDs (phases and tasks)
 * - Assign default task status ('todo')
 * - Perform authoritative feasibility calculation via feasibility utility
 * - Return unified, reliable DevPath roadmap response
 */

const { GoogleGenAI } = require('@google/genai');
const { z } = require('zod');
const { calculateFeasibility } = require('../utils/feasibility');
const { validateProjectIdea } = require('../utils/ideaValidator');

// Schema for raw Gemini output validation
const geminiTaskSchema = z.object({
  title: z.string().trim().min(2, 'Task title is too short.'),
  description: z.string().trim().min(5, 'Task description is too short.'),
  module: z.string().trim().min(2, 'Module name is required.').catch('Core Module'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).catch('MEDIUM'),
  tier: z.enum(['MVP', 'STRETCH', 'FUTURE']).catch('MVP'),
  estimatedHours: z.number().positive('Estimated hours must be positive.').max(80, 'Single task estimate too high.').catch(4),
  prerequisites: z.array(z.string().trim().min(2)).optional().default([]),
  steps: z.array(z.string().trim().min(3)).optional().default([]),
  acceptanceCriteria: z.array(z.string().trim().min(3)).min(1, 'At least one acceptance criterion required.').catch([
    'Observable feature behavior satisfies the requirement',
    'Relevant tests or manual verification pass with zero console errors',
  ]),
  definitionOfDone: z.array(z.string().trim().min(3)).optional().default([]),
});

const geminiPhaseSchema = z.object({
  title: z.string().trim().min(2, 'Phase title is too short.'),
  tier: z.enum(['MVP', 'STRETCH', 'FUTURE']).catch('MVP'),
  tasks: z.array(geminiTaskSchema).min(1, 'Phase must contain at least one task.'),
});

const geminiRawOutputSchema = z.object({
  projectOverview: z.object({
    title: z.string().trim().min(2, 'Project title is too short.'),
    summary: z.string().trim().min(10, 'Project summary is too short.'),
    targetScope: z.string().trim().min(10, 'Target scope is too short.'),
    assumptions: z.array(z.string().trim().min(2)).optional().default([]),
  }),
  recommendedStack: z.array(
    z.object({
      name: z.string().trim().min(1),
      category: z.string().trim().min(1),
      justification: z.string().trim().min(5),
      matchedStudentSkill: z.boolean().optional().default(false),
    })
  ).min(1, 'At least one stack recommendation required.'),
  skillGaps: z.array(
    z.object({
      skill: z.string().trim().min(1),
      severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'BLOCKER']).catch('MEDIUM'),
      recommendation: z.string().trim().min(5),
    })
  ).optional().default([]),
  phases: z.array(geminiPhaseSchema).min(1, 'Plan must contain at least one phase.'),
});

/**
 * Strips markdown code blocks (e.g. ```json ... ```) from LLM output
 */
function extractCleanJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return '';
  }
  let cleaned = rawText.trim();
  // Strip ```json or ``` at beginning
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  // Strip ``` at end
  cleaned = cleaned.replace(/\s*```$/i, '');
  return cleaned.trim();
}

/**
 * Builds the prompt for Gemini, incorporating verified understanding and strict grounding
 */
function buildGeminiPrompt(data, assessment = {}) {
  const {
    problemStatement,
    deadline,
    techStack,
    availableHoursPerDay,
    currentProjectStatus,
    workingDays,
  } = data;

  const scheduleDescription = Array.isArray(workingDays)
    ? `Specific days: ${workingDays.join(', ')}`
    : workingDays;

  const assumptionsText = (assessment?.disclosedAssumptions || []).length > 0
    ? assessment.disclosedAssumptions.map((a) => `- ${a}`).join('\n')
    : '- Scope MVP to core end-to-end functionality for single-user workflow';

  const coreFeaturesText = (assessment?.coreFunctionality || []).length > 0
    ? assessment.coreFunctionality.map((f) => `- ${f}`).join('\n')
    : `- Directly implement core functionality for: "${problemStatement}"`;

  return `You are a Principal Software Architect and engineering mentor for university and self-taught developers.
Analyze the following student project inputs and construct a realistic, battle-tested, phased execution roadmap:

PROJECT INPUTS:
- Problem Statement: "${problemStatement}"
- Deadline Date: ${deadline}
- Student's Existing Skills & Tech Stack: ${techStack.join(', ')}
- Daily Available Study/Work Hours: ${availableHoursPerDay} hours/day
- Working Days Schedule: ${scheduleDescription}
- Current Project Status: "${currentProjectStatus}"

VERIFIED PROJECT CONTEXT & UNDERSTANDING:
- Problem Summary / Technical Goal: "${assessment?.problemSummary || problemStatement}"
- Target Users: "${assessment?.targetUsers || 'End users of the project'}"
- Explicit / Core Features Identified:
${coreFeaturesText}
- Disclosed Scope Assumptions:
${assumptionsText}

STRICT GROUNDING & ANTI-HALLUCINATION RULES:
1. STRICT GROUNDING: Stay strictly grounded in the submitted project idea: "${problemStatement}". Every phase, module, and task MUST directly support building this project. Do NOT transform this into a different or unrelated application.
2. NO FABRICATED REQUIREMENTS: Do NOT claim the user requested features they never mentioned.
3. EXPLICIT VS INFERRED: Distinguish explicitly requested features from inferred architectural suggestions. If you suggest architectural best practices (e.g. error boundaries, validation, indexes), label them as suggestions.
4. DISCLOSED ASSUMPTIONS: Include all reasonable assumptions in the "assumptions" array within projectOverview.
5. SCOPING: Prioritize a minimal, functional MVP first (Phase 1 and Phase 2). Defer non-critical or fancy features to Phase 3.
6. STACK SELECTION: Recommend 3 to 4 stack components tailored to their existing skills to reduce ramp-up friction. Mark 'matchedStudentSkill: true' when it directly utilizes a skill they listed.
7. SKILL GAPS: Identify 1 to 2 concrete technologies or libraries they will need to learn for this project. Assign severity (LOW, MEDIUM, HIGH, BLOCKER) and actionable advice. Do NOT include estimated learning hours.
8. PHASES & TASKS: Break the project into 2 to 3 sequential, high-impact phases (Phase 1: Foundation & Setup, Phase 2: Core User Journey, Phase 3: Integration & Polish). Provide exactly 2 focused tasks per phase (total 4 to 6 tasks).
9. TASK BREAKDOWN & DEFINITION OF DONE:
   Keep every task breakdown crisp, actionable, and direct:
   - title: Short, specific action-oriented task name (e.g., "Implement User Signup API").
   - description: 1 concise sentence explaining WHAT needs to be built and WHY.
   - module: Architectural module (e.g., 'Auth & Security', 'Database Schema', 'Frontend UI', 'API Integration').
   - priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'.
   - tier: 'MVP' | 'STRETCH' | 'FUTURE'.
   - estimatedHours: Realistic effort estimate (typically 2 to 6 hours).
   - prerequisites: 1 to 2 concise items (or [] if none).
   - steps: 3 to 4 concise, actionable subtasks (under 12 words each).
   - acceptanceCriteria: 2 concise observable, testable conditions.
   - definitionOfDone: 2 concise verification items confirming completion.
10. OUTPUT FORMAT: Respond ONLY with valid, raw JSON matching this exact structure (no markdown formatting, no commentary):

{
  "projectOverview": {
    "title": "Clear, compelling project name",
    "summary": "1-2 sentence executive summary of what is being built",
    "targetScope": "Concise statement of what the MVP delivers vs what is deferred",
    "assumptions": [
      "Assumption 1 made to scope MVP",
      "Assumption 2 regarding environment or constraints"
    ]
  },
  "recommendedStack": [
    {
      "name": "Technology Name",
      "category": "frontend | backend | database | styling | deployment | realtime",
      "justification": "Why this is recommended given student skills and project goals",
      "matchedStudentSkill": true
    }
  ],
  "skillGaps": [
    {
      "skill": "Technology / Concept",
      "severity": "LOW | MEDIUM | HIGH | BLOCKER",
      "recommendation": "Concise advice on how to ramp up quickly"
    }
  ],
  "phases": [
    {
      "title": "Phase 1: Foundation & Setup",
      "tier": "MVP",
      "tasks": [
        {
          "title": "Task title",
          "description": "Clear explanation of what to implement and why it matters",
          "module": "Descriptive module name",
          "priority": "HIGH",
          "tier": "MVP",
          "estimatedHours": 4,
          "prerequisites": [
            "Prerequisite skill or prior task"
          ],
          "steps": [
            "Step 1: Specific actionable subtask",
            "Step 2: Core implementation step",
            "Step 3: Validation and error handling step",
            "Step 4: Testing or verification step"
          ],
          "acceptanceCriteria": [
            "Specific testable criteria 1",
            "Specific testable criteria 2"
          ],
          "definitionOfDone": [
            "Final verification checklist item 1",
            "Final verification checklist item 2"
          ]
        }
      ]
    }
  ]
}`;
}

/**
 * Mock plan generator strictly for automated tests or when DEVPATH_MOCK_AI=true is explicitly set.
 */
function generateMockAiOutput(inputData, assessment) {
  const { problemStatement, techStack } = inputData;
  const primaryTech = techStack[0] || 'JavaScript';

  return {
    projectOverview: {
      title: `DevPath Project: ${problemStatement.substring(0, 35)}...`,
      summary: `A focused implementation addressing: "${problemStatement}". Built systematically with an emphasis on core functionality first.`,
      targetScope: 'Delivers core end-to-end functionality in MVP. Advanced analytics and multi-tenant features are deferred to stretch phases.',
      assumptions: assessment?.disclosedAssumptions || [
        'MVP scopes core features for initial delivery',
        'Standard web application architecture',
      ],
    },
    recommendedStack: [
      {
        name: primaryTech,
        category: 'core',
        justification: `Leverages student's existing proficiency in ${primaryTech} to build momentum quickly without onboarding friction.`,
        matchedStudentSkill: true,
      },
      {
        name: 'Node.js & Express',
        category: 'backend',
        justification: 'Industry-standard lightweight runtime for rapid REST API development.',
        matchedStudentSkill: techStack.some((t) => /node|express/i.test(t)),
      },
      {
        name: 'Vite + React',
        category: 'frontend',
        justification: 'Fast development server and reactive component ecosystem ideal for modern web apps.',
        matchedStudentSkill: techStack.some((t) => /react/i.test(t)),
      },
    ],
    skillGaps: [
      {
        skill: 'Schema Validation & Error Handling',
        severity: 'MEDIUM',
        recommendation: 'Practice building strict input schemas with Zod before writing business logic.',
      },
    ],
    phases: [
      {
        title: 'Phase 1: Project Setup & Architecture',
        tier: 'MVP',
        tasks: [
          {
            title: 'Repository & Environment Initialization',
            description: 'Initialize monorepo or client/server folders, configure package dependencies and environment variables to ensure a reliable foundation.',
            module: 'Environment Setup',
            priority: 'HIGH',
            tier: 'MVP',
            estimatedHours: 3,
            prerequisites: [
              'Node.js (v18+) and npm installed locally',
              'Basic Git and terminal workflow'
            ],
            steps: [
              'Initialize Git repository and add comprehensive .gitignore',
              'Set up client and server folders with package.json configurations',
              'Install required dependencies (Express, React, Zod, etc.)',
              'Configure environment variable templates (.env.example)',
              'Run local dev servers and verify basic HTTP health check endpoint'
            ],
            acceptanceCriteria: [
              'Both client and server boot locally without errors or port conflicts',
              'Basic health endpoint returns 200 OK and valid JSON status',
              'Environment variables load correctly from .env files'
            ],
            definitionOfDone: [
              'Development environment is operational with zero boot errors',
              'Project README documents setup commands and environment requirements',
              'Initial commit pushed to remote repository'
            ]
          },
          {
            title: 'Core Data Models & Validation Schema',
            description: 'Define input schemas, validation contracts, and initial data structures to guard against invalid or corrupted user data.',
            module: 'Core Logic',
            priority: 'CRITICAL',
            tier: 'MVP',
            estimatedHours: 5,
            prerequisites: [
              'Repository & Environment Initialization completed',
              'Familiarity with Zod or JSON schema validation'
            ],
            steps: [
              'Design entity schema specifications and required fields',
              'Implement validation schemas using Zod for incoming HTTP requests',
              'Create database connection utility with graceful reconnect logic',
              'Attach validation middleware to protect API routes from malformed payloads',
              'Write unit tests verifying valid and invalid input handling'
            ],
            acceptanceCriteria: [
              'Validation middleware rejects invalid payloads with 400 status and descriptive errors',
              'Valid payloads pass schema sanitization cleanly',
              'Unit tests pass for schema edge cases and boundary conditions'
            ],
            definitionOfDone: [
              'All core models and schemas pass automated tests',
              'Error responses follow consistent standardized error payload structure',
              'Database connection verified in development mode'
            ]
          },
        ],
      },
      {
        title: 'Phase 2: Core User Journey Implementation',
        tier: 'MVP',
        tasks: [
          {
            title: 'Main Interactive User Interface',
            description: 'Construct the primary input form, reactive status views, and responsive layout so students can effortlessly submit project requirements.',
            module: 'Frontend UI',
            priority: 'HIGH',
            tier: 'MVP',
            estimatedHours: 6,
            prerequisites: [
              'Vite + React development environment running',
              'Basic CSS styling system configured'
            ],
            steps: [
              'Create reusable form components with accessible labels and input validation',
              'Implement controlled state for all user input fields',
              'Add visual loading skeletons and disabled states during asynchronous operations',
              'Implement responsive CSS grid layout supporting mobile and desktop viewports',
              'Test form submission flow and client-side error notifications'
            ],
            acceptanceCriteria: [
              'User can input project details and trigger generation flow with keyboard or click',
              'Loading and error states display gracefully without UI jumps',
              'Form prevents submission when required inputs are invalid'
            ],
            definitionOfDone: [
              'UI renders cleanly on both mobile (375px) and desktop (1280px)',
              'Zero unhandled console warnings or accessibility violations',
              'Component state handles fast re-renders reliably'
            ]
          },
          {
            title: 'Service Integration & Result Rendering',
            description: 'Connect frontend to the backend API and render the resulting roadmap cards and feasibility metrics seamlessly.',
            module: 'Integration',
            priority: 'CRITICAL',
            tier: 'MVP',
            estimatedHours: 6,
            prerequisites: [
              'Backend API endpoints running locally',
              'Main Interactive User Interface components ready'
            ],
            steps: [
              'Implement centralized API client service with fetch error handling',
              'Connect form submission to backend generation endpoint',
              'Render structured phase timeline and interactive task cards with badges',
              'Wire interactive task status toggles to update execution progress in real time',
              'Test network failure and timeout handling with informative retry banners'
            ],
            acceptanceCriteria: [
              'API response renders within the UI cards without console errors',
              'Interactive task status toggling updates local state and progress meter seamlessly',
              'Network failures trigger clear user feedback and retry actions'
            ],
            definitionOfDone: [
              'End-to-end integration verified: input form -> API -> roadmap results',
              'Task completion state accurately reflected in progress bar',
              'Edge cases and server error responses tested'
            ]
          },
        ],
      },
      {
        title: 'Phase 3: Polish, Edge Cases & Polish',
        tier: 'STRETCH',
        tasks: [
          {
            title: 'Error Boundaries & Responsive Polish',
            description: 'Add mobile-first adjustments, micro-animations, and comprehensive edge-case handling to deliver a production-grade experience.',
            module: 'UI Polish',
            priority: 'LOW',
            tier: 'STRETCH',
            estimatedHours: 4,
            prerequisites: [
              'Core User Journey Implementation completed',
              'CSS transition and layout tokens established'
            ],
            steps: [
              'Wrap top-level UI with React Error Boundary to catch unexpected render errors',
              'Fine-tune typography contrast, line-height, and padding across screen sizes',
              'Add smooth CSS transitions for interactive hover and focus states',
              'Test offline network recovery and empty states'
            ],
            acceptanceCriteria: [
              'UI renders cleanly on both mobile (375px) and desktop (1280px)',
              'Failed network calls show user-friendly retry banners',
              'Interactive elements feature accessible focus rings and clear hover states'
            ],
            definitionOfDone: [
              'Cross-browser and multi-viewport testing completed',
              'Zero unresolved console errors or layout overflows',
              'Final user journey tested end-to-end'
            ]
          },
        ],
      },
    ],
  };
}

/**
 * Extracts meaningful keyword tokens (lowercase, alphanumeric, excluding common stop words)
 */
function extractSignificantTokens(text) {
  if (!text || typeof text !== 'string') return new Set();
  const STOP_WORDS = new Set([
    'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
    'and', 'or', 'is', 'are', 'was', 'were', 'be', 'been', 'this', 'that', 'it',
    'app', 'application', 'project', 'system', 'build', 'create', 'make', 'want',
    'need', 'using', 'tool', 'platform', 'will', 'have', 'such', 'into', 'some'
  ]);
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9+#.-]+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  return new Set(tokens);
}

/**
 * Validates that the AI's generated output remains grounded in and relevant to the user's project idea,
 * rather than inventing an unrelated product.
 */
function verifyPlanRelevance(validatedData, inputData) {
  // Support explicit test simulation for unrelated AI response rejection
  if (process.env.DEVPATH_TEST_UNRELATED_AI === 'true') {
    const err = new Error('AI generated plan did not maintain relevance to the submitted project idea.');
    err.status = 502;
    err.code = 'RELEVANCE_CHECK_FAILED';
    err.details = ['AI generated roadmap was determined to be unrelated to the requested software goal.'];
    throw err;
  }

  const promptTokens = extractSignificantTokens(inputData.problemStatement);
  (inputData.techStack || []).forEach((tech) => {
    extractSignificantTokens(tech).forEach((t) => promptTokens.add(t));
  });

  const outputText = [
    validatedData.projectOverview?.title || '',
    validatedData.projectOverview?.summary || '',
    validatedData.projectOverview?.targetScope || '',
    ...(validatedData.phases || []).map((p) => p.title + ' ' + (p.tasks || []).map((t) => t.title + ' ' + t.description).join(' ')),
    ...(validatedData.recommendedStack || []).map((s) => s.name + ' ' + s.justification),
  ].join(' ').toLowerCase();

  // If prompt has significant domain tokens, check for at least some conceptual overlap
  if (promptTokens.size > 0) {
    let overlapCount = 0;
    for (const token of promptTokens) {
      if (outputText.includes(token)) {
        overlapCount++;
      }
    }

    if (overlapCount === 0) {
      const err = new Error('AI generated plan did not maintain relevance to the submitted project idea.');
      err.status = 502;
      err.code = 'RELEVANCE_CHECK_FAILED';
      err.details = ['AI generated output did not match the problem domain described in the project idea.'];
      throw err;
    }
  }

  return true;
}

/**
 * AI Understanding Gate:
 * Evaluates whether Gemini can reasonably understand the submitted project idea before full planning.
 * Distinguishes unintelligible/meaningless input from concise ideas with acceptable missing details.
 */
async function assessProjectIdea(inputData) {
  const { problemStatement, techStack = [], currentProjectStatus = 'Idea Stage' } = inputData;

  // 1. Deterministic heuristic check
  const deterministicCheck = validateProjectIdea(problemStatement);
  if (!deterministicCheck.isValid) {
    const message = deterministicCheck.details && deterministicCheck.details[0]
      ? deterministicCheck.details[0].replace(/^problemStatement:\s*/, '')
      : (deterministicCheck.error || 'Invalid project description.');
    const err = new Error(message);
    err.status = 400;
    err.code = 'INVALID_INPUT';
    err.details = deterministicCheck.details || [message];
    throw err;
  }

  // 2. Offline / Mock mode handling
  if (process.env.DEVPATH_MOCK_AI === 'true') {
    const lower = problemStatement.toLowerCase();
    // Test hook for simulated unintelligible / non-actionable input
    if (lower.includes('unintelligible') || lower.includes('gibberish') || lower.includes('non-actionable') || lower.includes('meaningless')) {
      const message = "We couldn't clearly identify an actionable software project from your description. Could you clarify what you'd like to build?";
      const err = new Error(message);
      err.status = 400;
      err.code = 'CLARIFICATION_REQUIRED';
      err.details = [
        "The project description does not communicate an actionable software goal.",
        "Tip: Mention what problem your application solves, 1-2 core features, or who will use it."
      ];
      throw err;
    }

    // Default mock understanding assessment with disclosed assumptions
    return {
      isActionable: true,
      confidence: 'HIGH',
      problemSummary: `Focused implementation of ${problemStatement.slice(0, 60)}...`,
      targetUsers: 'Students and self-directed developers',
      coreFunctionality: [
        'Interactive user interface for primary workflows',
        'Backend service with schema validation and error handling',
        'Data persistence and responsive UI display',
      ],
      disclosedAssumptions: [
        'Assumes standard web-based client and API architecture for initial MVP',
        'Assumes local or cloud database for user data storage',
      ],
      clarificationNeeded: null,
    };
  }

  // 3. Live Gemini call for Understanding Gate
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    const err = new Error(
      'Gemini API key is not configured on the server. Please set GEMINI_API_KEY in server/.env.'
    );
    err.status = 503;
    err.code = 'CONFIG_MISSING';
    throw err;
  }

  const requestedModel = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
  const candidateModels = [
    requestedModel,
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
    'gemini-flash-latest',
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

  const ai = new GoogleGenAI({ apiKey });

  const understandingPrompt = `You are a Principal Software Architect and technical project evaluator.
Evaluate whether the following student project idea communicates an understandable, actionable software project goal.

STUDENT PROJECT INPUT:
Problem Statement: "${problemStatement}"
Declared Skills: ${techStack.join(', ')}
Current Status: "${currentProjectStatus}"

EVALUATION RULES:
1. ACTIONABLE SOFTWARE GOAL: Does the input describe or reasonably imply a real software system, application, tool, script, API, website, or digital product?
2. TOLERANCE FOR MISSING DETAILS: If the idea is understandable but concise or missing non-critical details (e.g., "a simple pomodoro timer", "markdown notes app with local storage", "REST API for tracking book reading"), it IS actionable! Mark isActionable: true and clearly list 1-2 reasonable disclosed assumptions.
3. REJECT UNINTELLIGIBLE OR NON-SOFTWARE INPUT:
   - If the text does not communicate an actionable software goal (e.g. random concepts, personal thoughts, or vague non-software statements like "i want to eat pizza tomorrow"), mark isActionable: false and explain what needs clarification in clarificationNeeded.

OUTPUT FORMAT:
Respond ONLY with valid, raw JSON (no markdown, no backticks, no commentary):
{
  "isActionable": true,
  "confidence": "HIGH",
  "problemSummary": "1 sentence summarizing the core technical goal",
  "targetUsers": "Likely target users (explicit or reasonably inferred)",
  "coreFunctionality": [
    "Feature 1 explicitly mentioned or directly required",
    "Feature 2 explicitly mentioned or directly required"
  ],
  "disclosedAssumptions": [
    "Assumption 1 made to scope MVP",
    "Assumption 2 made to fill reasonable gaps"
  ],
  "clarificationNeeded": null
}`;

  let response;
  let lastError;

  for (const modelToTry of candidateModels) {
    try {
      response = await ai.models.generateContent({
        model: modelToTry,
        contents: understandingPrompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      if (response && response.text) {
        lastError = null;
        break;
      }
    } catch (apiErr) {
      lastError = apiErr;
      if (apiErr.message && apiErr.message.includes('API_KEY_INVALID')) {
        break;
      }
    }
  }

  if (!response || !response.text) {
    if (lastError) {
      const err = new Error(lastError.message || 'Unable to assess project idea with AI.');
      err.status = lastError.status === 429 ? 429 : 502;
      throw err;
    }
    const err = new Error('Empty response received from AI understanding gate.');
    err.status = 502;
    throw err;
  }

  let assessment;
  try {
    const cleanJson = extractCleanJson(response.text);
    assessment = JSON.parse(cleanJson);
  } catch (parseErr) {
    console.warn('[DevPathService] Warning: failed to parse AI assessment JSON, falling back to basic assumptions.');
    return {
      isActionable: true,
      confidence: 'MEDIUM',
      problemSummary: problemStatement.slice(0, 100),
      targetUsers: 'Target users of the application',
      coreFunctionality: ['Core application workflow', 'Data management and UI'],
      disclosedAssumptions: ['Standard web/client-server MVP architecture'],
      clarificationNeeded: null,
    };
  }

  if (!assessment.isActionable || assessment.clarificationNeeded) {
    const message = assessment.clarificationNeeded ||
      "We couldn't clearly identify an actionable software project from your description. Could you clarify what you'd like to build?";
    const err = new Error(message);
    err.status = 400;
    err.code = 'CLARIFICATION_REQUIRED';
    err.details = [
      message,
      "Tip: Try mentioning the problem it solves, 1-2 key features, or who will use it."
    ];
    err.assessment = assessment;
    throw err;
  }

  return assessment;
}

/**
 * Main service entrypoint: generateDevPath
 */
async function generateDevPath(inputData) {
  // 1. AI Understanding Gate: assess intent, core scope, and disclosed assumptions
  const assessment = await assessProjectIdea(inputData);

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  let rawAiOutput;

  // Check if explicit mock mode is requested for offline tests
  if (process.env.DEVPATH_MOCK_AI === 'true') {
    rawAiOutput = generateMockAiOutput(inputData, assessment);
  } else {
    if (!apiKey) {
      const err = new Error(
        'Gemini API key is not configured on the server. Please set GEMINI_API_KEY in server/.env.'
      );
      err.status = 503;
      err.code = 'CONFIG_MISSING';
      throw err;
    }

    const requestedModel = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
    const candidateModels = [
      requestedModel,
      'gemini-flash-lite-latest',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-flash-latest',
      'gemini-3.5-flash',
    ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildGeminiPrompt(inputData, assessment);

    let response;
    let lastError;

    for (const modelToTry of candidateModels) {
      try {
        console.log(`[DevPathService] Requesting roadmap generation with model: ${modelToTry}`);
        response = await ai.models.generateContent({
          model: modelToTry,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        if (response && response.text) {
          lastError = null;
          console.log(`[DevPathService] Successfully generated roadmap with model: ${modelToTry}`);
          break;
        }
      } catch (apiError) {
        lastError = apiError;
        console.warn(`[DevPathService] Model ${modelToTry} failed (${apiError.status || apiError.message}). Attempting fallback to next model...`);

        // If it's a rate limit (429), not found/deprecated (404), or server error (500/503), try next candidate
        if (apiError.status === 429 || apiError.status === 404 || apiError.status === 500 || apiError.status === 502 || apiError.status === 503) {
          continue;
        }

        // If the key itself is invalid, stop fallback
        if (apiError.message && apiError.message.includes('API_KEY_INVALID')) {
          break;
        }
      }
    }

    if (!response || !response.text) {
      if (lastError) {
        const status = lastError.status || 502;
        const message =
          lastError.status === 429
            ? 'AI service rate limit reached across available models. Please wait a few moments and try again.'
            : lastError.message && lastError.message.includes('API_KEY_INVALID')
            ? 'The configured Gemini API key is invalid. Please verify GEMINI_API_KEY in server/.env.'
            : 'Unable to communicate with the AI service. Please try again.';

        const err = new Error(message);
        err.status = status === 429 ? 429 : 502;
        err.originalMessage = lastError.message;
        throw err;
      }

      const err = new Error('Empty response received from AI service.');
      err.status = 502;
      throw err;
    }

    const cleanJsonText = extractCleanJson(response.text);

    try {
      rawAiOutput = JSON.parse(cleanJsonText);
    } catch (parseError) {
      const err = new Error('Failed to parse structured JSON from AI response.');
      err.status = 502;
      err.details = parseError.message;
      throw err;
    }
  }

  // Strictly validate the AI's output using Zod
  const validationResult = geminiRawOutputSchema.safeParse(rawAiOutput);
  if (!validationResult.success) {
    const err = new Error('AI generated plan did not conform to the expected schema.');
    err.status = 502;
    const issues = validationResult.error.issues || validationResult.error.errors || [];
    err.details = issues.map((e) => `${e.path.join('.')}: ${e.message}`);
    throw err;
  }

  const validatedData = validationResult.data;

  // Verify that the generated plan is grounded in and relevant to the submitted project idea
  verifyPlanRelevance(validatedData, inputData);

  // Backend owns all identifiers and initial task status
  const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  let globalTaskCounter = 1;
  const processedPhases = validatedData.phases.map((phase, pIdx) => {
    const phaseOrder = pIdx + 1;
    const phaseId = `phase_${phaseOrder}`;

    const processedTasks = phase.tasks.map((task) => {
      const taskId = `task_${phaseOrder}${String(globalTaskCounter++).padStart(2, '0')}`;

      // Gracefully ensure steps array has actionable subtasks
      const steps = Array.isArray(task.steps) && task.steps.length > 0
        ? task.steps
        : [
            `Review prerequisites and technical requirements for ${task.title}.`,
            `Implement core functionality and data flow for ${task.module || 'this module'}.`,
            `Add input validation, state management, and edge-case error handling.`,
            `Test against acceptance criteria and verify zero regressions.`,
          ];

      // Gracefully ensure definitionOfDone
      const definitionOfDone = Array.isArray(task.definitionOfDone) && task.definitionOfDone.length > 0
        ? task.definitionOfDone
        : [
            'All actionable subtask steps have been executed and reviewed.',
            'Acceptance criteria have been tested and verified.',
            'Code is clean, documented, and committed with zero console warnings.',
          ];

      const prerequisites = Array.isArray(task.prerequisites) ? task.prerequisites : [];

      return {
        id: taskId,
        title: task.title,
        description: task.description,
        module: task.module,
        priority: task.priority,
        tier: task.tier,
        estimatedHours: Math.round(task.estimatedHours * 10) / 10,
        prerequisites,
        steps,
        acceptanceCriteria: task.acceptanceCriteria,
        definitionOfDone,
        status: 'todo', // Standard initial status ('todo' = Not Started)
      };
    });

    return {
      id: phaseId,
      title: phase.title,
      order: phaseOrder,
      tier: phase.tier,
      tasks: processedTasks,
    };
  });

  // Calculate authoritative feasibility ONLY after final task validation & relevance check
  const feasibility = calculateFeasibility({
    deadline: inputData.deadline,
    availableHoursPerDay: inputData.availableHoursPerDay,
    workingDays: inputData.workingDays,
    tasks: processedPhases,
  });

  // Construct complete MVP response contract
  const finalResponse = {
    planId,
    meta: {
      createdAt: new Date().toISOString(),
      inputs: {
        problemStatement: inputData.problemStatement,
        deadline: inputData.deadline,
        techStack: inputData.techStack,
        availableHoursPerDay: inputData.availableHoursPerDay,
        currentProjectStatus: inputData.currentProjectStatus,
        workingDays: inputData.workingDays,
      },
      assessment: {
        confidence: assessment.confidence,
        targetUsers: assessment.targetUsers,
        disclosedAssumptions: assessment.disclosedAssumptions,
      },
    },
    projectOverview: validatedData.projectOverview,
    recommendedStack: validatedData.recommendedStack,
    skillGaps: validatedData.skillGaps,
    feasibility,
    phases: processedPhases,
  };

  return finalResponse;
}

module.exports = {
  generateDevPath,
  assessProjectIdea,
  verifyPlanRelevance,
  extractCleanJson,
  buildGeminiPrompt,
  geminiRawOutputSchema,
};

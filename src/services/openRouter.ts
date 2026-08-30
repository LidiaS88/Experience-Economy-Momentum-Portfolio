import { PortfolioReviewObject, ExecutiveCommentaryResult } from '../types';

export const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

export const POPULAR_OPENROUTER_MODELS = [
  { id: 'anthropic/claude-3.7-sonnet', label: 'Claude 3.7 Sonnet (Anthropic)', provider: 'Anthropic' },
  { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash (Google)', provider: 'Google' },
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B (Meta)', provider: 'Meta' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (OpenAI)', provider: 'OpenAI' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek Chat (DeepSeek)', provider: 'DeepSeek' },
];

const SYSTEM_PROMPT = `You are a senior quantitative portfolio risk analyst generating executive commentary for a fictional institutional investment committee.

You must synthesize executive observations based STRICTLY AND EXCLUSIVELY on the structured portfolio review JSON object provided in the user prompt.

CRITICAL OPERATING DIRECTIVES:
1. Grounding: Rely ONLY on facts, weights, metrics, scores, and status flags present in the review object.
2. Anti-Hallucination: Do NOT invent prices, corporate events, earnings releases, macroeconomic narratives, geopolitical events, or causes of historical price moves not provided in the data.
3. Tone: Analytical, objective, dispassionate, concise, and professional. Suitable for investment committee review.
4. Compliance: Do NOT provide investment advice, buy/sell recommendations, or return promises.
5. Limitations & Uncertainty: Explicitly state data limitations, sample window constraints, and fallback assumptions.
6. Schema Requirement: You MUST output ONLY a valid JSON object matching EXACTLY the following structure (no markdown formatting fences, no explanations, no text before or after):

{
  "portfolio_overview": "Comprehensive executive summary of the portfolio strategy, $1M capital deployment, optimizer status (PGD or Fallback), and key risk/return comparisons against Equal-Weight baseline and SPY benchmark.",
  "signal_summary": "Analysis of the technical momentum score distribution (Constructive, Mixed, Caution), passing percentage, and sector concentrations across the 5 Experience Economy categories.",
  "primary_risks": [
    "Specific analytical risk observation 1 (e.g. single-sector or single-stock concentration, box cap saturation)",
    "Specific analytical risk observation 2 (e.g. covariance conditioning, drawdowns during market distress)",
    "Specific analytical risk observation 3 (e.g. historical regime dependency, momentum factor crowding)"
  ],
  "data_limitations": [
    "Specific data caveat 1 (e.g. historical lookback window length, common date overlapping constraints)",
    "Specific data caveat 2 (e.g. 0% risk-free rate assumption for Sharpe calculation, quote feed timestamp status)"
  ],
  "committee_questions": [
    "Strategic discussion prompt 1 for investment committee debate",
    "Quantitative risk discussion prompt 2 regarding rebalancing thresholds or stress testing"
  ]
}`;

export async function generateExecutiveCommentary(
  apiKey: string,
  model: string,
  reviewObject: PortfolioReviewObject
): Promise<ExecutiveCommentaryResult> {
  const trimmedKey = apiKey.trim();
  const trimmedModel = model.trim();

  if (!trimmedKey) {
    throw new Error('OpenRouter API Key is missing. Please provide a valid key in the Data Access Panel.');
  }

  if (!trimmedModel) {
    throw new Error('OpenRouter Model name is missing. Please specify a model (e.g. anthropic/claude-3.7-sonnet).');
  }

  const userMessageContent = `Here is the structured quantitative portfolio review object for evaluation:\n\n${JSON.stringify(
    reviewObject,
    null,
    2
  )}\n\nGenerate the executive commentary JSON now.`;

  const requestBody = {
    model: trimmedModel,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: userMessageContent,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'experience_economy_executive_commentary',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            portfolio_overview: {
              type: 'string',
              description:
                'Executive summary of portfolio strategy, $1M capital deployment, optimizer status, and key risk/return comparisons.',
            },
            signal_summary: {
              type: 'string',
              description:
                'Analysis of technical momentum score distribution, passing percentage, and sector concentrations.',
            },
            primary_risks: {
              type: 'array',
              items: { type: 'string' },
              minItems: 3,
              maxItems: 3,
              description: 'Array of exactly 3 primary risk factors and vulnerabilities.',
            },
            data_limitations: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
              description:
                'Array with at least 1 data limitation, sample bias, or model caveat.',
            },
            committee_questions: {
              type: 'array',
              items: { type: 'string' },
              minItems: 2,
              maxItems: 2,
              description:
                'Array of exactly 2 investment committee discussion prompts.',
            },
          },
          required: [
            'portfolio_overview',
            'signal_summary',
            'primary_risks',
            'data_limitations',
            'committee_questions',
          ],
          additionalProperties: false,
        },
      },
    },
    provider: {
      require_parameters: true,
    },
    max_tokens: 1000,
    temperature: 0.15,
  };

  let response: Response;
  try {
    response = await fetch(OPENROUTER_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${trimmedKey}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://experience-portfolio.app',
        'X-Title': 'Experience Economy Momentum Portfolio',
      },
      body: JSON.stringify(requestBody),
    });
  } catch (netErr: any) {
    throw new Error(`Network connection to OpenRouter failed: ${netErr?.message || 'Check your internet connection'}`);
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson?.error?.message || JSON.stringify(errJson);
    } catch {
      errorDetail = response.statusText;
    }

    if (response.status === 401) {
      throw new Error(`OpenRouter Authentication Failed (401): ${errorDetail || 'Invalid API key.'}`);
    } else if (response.status === 402) {
      throw new Error(`OpenRouter Payment Required (402): ${errorDetail || 'Insufficient account credits.'}`);
    } else if (response.status === 404) {
      throw new Error(`OpenRouter Model Not Found (404): Model "${trimmedModel}" was not found or is unavailable.`);
    } else if (response.status === 429) {
      throw new Error(`OpenRouter Rate Limit (429): ${errorDetail || 'Too many requests. Please wait a moment.'}`);
    } else if (response.status === 400 || response.status === 422) {
      throw new Error(
        `OpenRouter Request / Schema Error (${response.status}): ${errorDetail || 'The selected model or provider may not support strict JSON schema outputs or the requested parameters.'}`
      );
    } else {
      throw new Error(`OpenRouter API Error (${response.status}): ${errorDetail}`);
    }
  }

  const responseData = await response.json();
  const rawContent = responseData?.choices?.[0]?.message?.content;

  if (!rawContent || typeof rawContent !== 'string') {
    throw new Error('OpenRouter returned an empty or invalid message content payload.');
  }

  // Sanitize potential markdown code block wraps (e.g. ```json ... ```)
  let cleanJsonText = rawContent.trim();
  if (cleanJsonText.startsWith('```json')) {
    cleanJsonText = cleanJsonText.slice(7);
  } else if (cleanJsonText.startsWith('```')) {
    cleanJsonText = cleanJsonText.slice(3);
  }
  if (cleanJsonText.endsWith('```')) {
    cleanJsonText = cleanJsonText.slice(0, -3);
  }
  cleanJsonText = cleanJsonText.trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleanJsonText);
  } catch (parseErr: any) {
    // Attempt fallback extraction with regex if text has surrounding comments
    const jsonMatch = cleanJsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        throw new Error(
          `Failed to parse model response as JSON. Raw model response snippet: ${cleanJsonText.slice(0, 200)}...`
        );
      }
    } else {
      throw new Error(
        `Model output was not valid JSON. Response received: ${cleanJsonText.slice(0, 200)}...`
      );
    }
  }

  // Validate exact required fields and types
  if (!parsed.portfolio_overview || typeof parsed.portfolio_overview !== 'string') {
    throw new Error('Schema validation failed: Missing or invalid "portfolio_overview" string.');
  }
  if (!parsed.signal_summary || typeof parsed.signal_summary !== 'string') {
    throw new Error('Schema validation failed: Missing or invalid "signal_summary" string.');
  }
  if (!Array.isArray(parsed.primary_risks) || parsed.primary_risks.length === 0) {
    throw new Error('Schema validation failed: Missing or invalid "primary_risks" array.');
  }
  if (!Array.isArray(parsed.data_limitations) || parsed.data_limitations.length === 0) {
    throw new Error('Schema validation failed: Missing or invalid "data_limitations" array.');
  }
  if (!Array.isArray(parsed.committee_questions) || parsed.committee_questions.length === 0) {
    throw new Error('Schema validation failed: Missing or invalid "committee_questions" array.');
  }

  return {
    portfolio_overview: parsed.portfolio_overview,
    signal_summary: parsed.signal_summary,
    primary_risks: parsed.primary_risks.map(String),
    data_limitations: parsed.data_limitations.map(String),
    committee_questions: parsed.committee_questions.map(String),
    generatedAt: new Date().toISOString(),
    modelUsed: trimmedModel,
  };
}

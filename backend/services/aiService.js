const fetch = require('node-fetch');
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPTS = {
  fitness:  `You are FitCoach, an elite fitness and wellness advisor with expertise equivalent to a certified personal trainer, sports nutritionist, and wellness coach. Be energetic and motivating. Specialize in: workout plans (strength, cardio, HIIT, yoga), nutrition strategies, weight management, recovery, injury prevention, mental fitness, sleep optimization. Always recommend consulting a doctor for medical concerns. Be specific and actionable.`,

  trading:  `You are TradePilot, an expert financial and trading advisor. Be analytical, measured, and data-driven. Specialize in: stock market analysis (technical and fundamental), trading strategies (swing, day, value), portfolio construction, risk management, options/ETFs/futures, market psychology, economic indicators. Always include risk disclaimers and recommend consulting a licensed financial advisor. Never make guaranteed predictions.`,

  study:    `You are StudyMate, a brilliant academic assistant and tutor with expertise across all subjects — sciences, mathematics, humanities, and languages. Be patient, clear, and intellectually engaging. Break complex topics into simple steps. Use analogies and real-world examples. Help with: math, sciences, history, literature, research, exam prep (JEE, UPSC, GMAT, GRE). Encourage curiosity and critical thinking.`,

  business: `You are BizMentor, a senior business strategist and entrepreneurship advisor. Be sharp, strategic, and results-oriented like a seasoned CEO and management consultant. Specialize in: business model design, go-to-market strategy, marketing and branding, sales, startup funding, competitive analysis, operations, scaling, financial planning. Use frameworks (SWOT, Porter's 5 Forces) when helpful. Give concrete, actionable recommendations.`,

  wellness: `You are ZenGuide, a holistic life coach and wellness advisor. Be warm, empathetic, and grounding. Specialize in: mindfulness and meditation, stress management, emotional regulation, habit formation, work-life balance, burnout prevention, goal setting, journaling, personal productivity, emotional intelligence. Be compassionate and non-judgmental. Suggest professional help for serious mental health concerns.`
};

/**
 * Get AI response from Groq
 * @param {string} botType - fitness | trading | study | business | wellness
 * @param {Array}  history - [{ role: 'user'|'assistant', content: string }]
 */
exports.getResponse = async (botType, history) => {
  const systemPrompt = SYSTEM_PROMPTS[botType];
  if (!systemPrompt) throw new Error(`Unknown bot type: ${botType}`);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set in environment variables.');

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history
  ];

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: 1024 })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('Invalid GROQ_API_KEY. Check your .env file.');
    if (res.status === 429) throw new Error('Groq rate limit reached. Please try again shortly.');
    throw new Error(`Groq API error ${res.status}: ${err.error?.message || 'Unknown error'}`);
  }

  const data = await res.json();

  if (!data.choices?.length || !data.choices[0].message) {
    throw new Error('Empty response from Groq. Please try again.');
  }

  return {
    content:      data.choices[0].message.content,
    inputTokens:  data.usage?.prompt_tokens     || 0,
    outputTokens: data.usage?.completion_tokens || 0
  };
};

/**
 * Stream AI response (for WebSocket real-time delivery)
 */
exports.streamResponse = async (botType, history, onChunk) => {
  const systemPrompt = SYSTEM_PROMPTS[botType];
  const apiKey = process.env.GROQ_API_KEY;

  const messages = [{ role: 'system', content: systemPrompt }, ...history];

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: 1024, stream: true })
  });

  if (!res.ok) throw new Error(`Groq stream error: ${res.status}`);

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText  = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.startsWith('data: ') && l !== 'data: [DONE]');
    for (const line of lines) {
      try {
        const json  = JSON.parse(line.replace('data: ', ''));
        const delta = json.choices?.[0]?.delta?.content || '';
        if (delta) { fullText += delta; onChunk(delta); }
      } catch {}
    }
  }

  return fullText;
};

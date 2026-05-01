const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON but received: ${text.slice(0, 160)}`);
  }
}

async function test() {
  const health = await fetch(`${baseUrl}/api/health`);
  const healthJson = await readJson(health);
  console.log('Health status:', health.status, healthJson);

  if (!health.ok || !healthJson.ok) {
    throw new Error('Local /api/health did not return an ok JSON response.');
  }

  const body = {
    prompt: 'Return ONLY valid JSON: {"verdict":"HALAL","confidence":100,"flagged_ingredients":[],"reason":"water","recommendation":"ok"}'
  };
  const analyze = await fetch(`${baseUrl}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const analyzeJson = await readJson(analyze);
  console.log('Analyze status:', analyze.status, analyzeJson);

  if (!analyze.ok && analyzeJson.code !== 'GEMINI_API_KEY_MISSING') {
    throw new Error(`Unexpected analyze response: ${JSON.stringify(analyzeJson)}`);
  }
}

test().catch(error => {
  console.error(error);
  process.exit(1);
});

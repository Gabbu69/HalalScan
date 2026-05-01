fetch('https://halal-scan-seven.vercel.app/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'Return ONLY valid JSON: {"verdict":"HALAL", "confidence":100, "reason":"Water", "recommendation":"Drink", "flagged_ingredients":[]}' })
}).then(r => r.json().then(j => console.log(r.status, j))).catch(console.error);

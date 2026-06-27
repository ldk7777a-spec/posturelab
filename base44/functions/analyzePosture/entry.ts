import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ANALYSIS_PROMPT = `You are an expert physiotherapist and biomechanics specialist. Analyze this posture image carefully.

Evaluate the following categories and provide scores (0-100) and findings for each:

1. SPINE: cervical (neck) alignment, thoracic kyphosis, lumbar lordosis, lateral scoliosis risk
2. SHOULDERS: rounded shoulders, left-right symmetry/balance
3. PELVIS: anterior/posterior tilt, lateral drop
4. KNEES: O-leg/X-leg (varus/valgus), hyperextension
5. FEET: foot strike, pronation/supination

Respond ONLY with a valid JSON object in this exact structure (no markdown, no code block):
{
  "overallScore": <number 0-100>,
  "imageView": "<front|side|unknown>",
  "categories": {
    "spine": {
      "score": <number>,
      "findings": ["<finding1>", "<finding2>"],
      "flags": []
    },
    "shoulders": {
      "score": <number>,
      "findings": ["<finding1>"],
      "flags": []
    },
    "pelvis": {
      "score": <number>,
      "findings": ["<finding1>"],
      "flags": []
    },
    "knees": {
      "score": <number>,
      "findings": ["<finding1>"],
      "flags": []
    },
    "feet": {
      "score": <number>,
      "findings": ["<finding1>"],
      "flags": ["requires in-person or specialized equipment for detailed analysis"]
    }
  },
  "requiresEquipment": [],
  "topPriorities": [
    {
      "category": "<category name>",
      "issue": "<specific issue>",
      "severity": "<high|medium|low>",
      "correction": "<actionable coaching cue>"
    }
  ],
  "coachingGuide": [
    {
      "title": "<exercise or drill name>",
      "target": "<what it addresses>",
      "frequency": "<e.g. 3x per week>",
      "instruction": "<how to do it>"
    }
  ],
  "summary": "<2-3 sentence overall assessment>"
}`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { imageUrl, view } = await req.json();
    if (!imageUrl) return Response.json({ error: 'imageUrl is required' }, { status: 400 });

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });

    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Image } },
              { text: `This is a ${view || 'posture'} view image. ${ANALYSIS_PROMPT}` },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return Response.json({ error: `Gemini API error: ${errText}` }, { status: 500 });
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!rawText) return Response.json({ error: 'Empty response from Gemini' }, { status: 500 });

    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return Response.json({ error: 'Failed to parse AI response', raw: rawText }, { status: 500 });

    const result = JSON.parse(jsonMatch[0]);
    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
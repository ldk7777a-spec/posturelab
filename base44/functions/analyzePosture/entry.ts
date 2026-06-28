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

    const { imageUrl, view, category } = await req.json();
    if (!imageUrl) return Response.json({ error: 'imageUrl is required' }, { status: 400 });

    const CATEGORY_CONTEXT = {
      soccer: "This person is a soccer player. Pay special attention to kicking posture, running form, lower limb alignment, hip flexibility, and ankle stability.",
      baseball: "This person is a baseball player. Focus on batting/pitching posture, shoulder-hip rotation, spinal rotation, and arm mechanics.",
      running: "This person is a runner. Analyze running posture, foot strike pattern, knee lift, cadence, and forward lean.",
      walking: "This person is walking. Analyze gait posture, foot pronation, pelvic tilt, and upper body sway.",
      pilates: "This person practices Pilates. Focus on core alignment, neutral spine, breathing patterns, and precise joint positioning.",
      yoga: "This person practices yoga. Focus on joint flexibility, spinal elongation, weight distribution, and balance.",
      golf: "This person is a golfer. Analyze swing posture, spinal rotation, weight shift, shoulder plane, and knee flexion.",
      swimming: "This person is a swimmer. Focus on shoulder mobility, core stability, spinal alignment, and arm/torso coordination.",
      cycling: "This person is a cyclist. Analyze saddle posture, knee tracking, hip angle, back angle, and shoulder position.",
      basketball: "This person plays basketball. Focus on jump landing mechanics, defensive stance, core stability, and knee alignment.",
      tennis: "This person plays tennis. Analyze serve mechanics, swing posture, shoulder rotation, and knee flexion.",
      general: "Analyze general static posture.",
    };
    const catContext = CATEGORY_CONTEXT[category] || CATEGORY_CONTEXT.general;

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) return Response.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });

    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const bytes = new Uint8Array(imageBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64Image = btoa(binary);
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
              { text: `This is a ${view || 'posture'} view image. Sport/activity category: ${category || 'general'}. ${catContext}\n\n${ANALYSIS_PROMPT}` },
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
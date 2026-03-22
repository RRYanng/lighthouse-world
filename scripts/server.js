import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Claude API proxy — ANTHROPIC_API_KEY stays server-side only
app.post('/api/lighthouse-detail', async (req, res) => {
  const { nameCN, nameEN, country, year, height, type, location } = req.body;

  if (!nameCN || !nameEN) {
    return res.status(400).json({ error: 'Missing lighthouse info' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured on server' });
  }

  const prompt = `你是一位专业的海洋历史学家和灯塔研究专家。请用中文为以下灯塔撰写一段生动、富有诗意的介绍（约150-200字），内容涵盖：历史背景、建筑特色、地理环境、对航海的意义，以及有趣的历史故事或传说。

灯塔信息：
- 中文名：${nameCN}
- 英文名：${nameEN}
- 国家/地区：${country}
- 建造年份：${year}年
- 高度：${height}米
- 类型：${type}
- 地理位置：${location}

请直接输出介绍文字，不要有标题或前缀。`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return res.status(502).json({ error: 'AI service error', detail: err });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    res.json({ description: text });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🗼 世界灯塔集 running at http://localhost:${PORT}`);
});

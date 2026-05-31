export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, data } = req.body;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    if (action === 'upload') {
      // Sauvegarde sur Google Drive
      const prompt = `Sauvegarde ce fichier JSON dans Google Drive avec le nom "trail-coach-profile.json". Voici les données:

${JSON.stringify(data, null, 2)}

Confirme quand c'est fait.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
          mcp_servers: [
            {
              type: 'url',
              url: 'https://drivemcp.googleapis.com/mcp/v1',
              name: 'google-drive'
            }
          ]
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({ error: responseData.error?.message || 'API error' });
      }

      return res.status(200).json({ success: true, message: 'Uploaded to Drive' });
    } 
    else if (action === 'download') {
      // Récupère depuis Google Drive
      const prompt = `Récupère le fichier "trail-coach-profile.json" depuis Google Drive et retourne son contenu en JSON brut.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
          mcp_servers: [
            {
              type: 'url',
              url: 'https://drivemcp.googleapis.com/mcp/v1',
              name: 'google-drive'
            }
          ]
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({ error: responseData.error?.message || 'API error' });
      }

      const responseText = responseData.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        return res.status(400).json({ error: 'No JSON found in Drive file' });
      }

      const remoteData = JSON.parse(jsonMatch[0]);
      return res.status(200).json({ success: true, data: remoteData });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

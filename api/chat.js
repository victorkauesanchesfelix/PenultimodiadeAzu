export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Allow cross-origin from any Vercel preview/production domain
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid request body: messages array is required.' });
    }

    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1';
    const apiVersion = '2024-02-01';

    if (!apiKey || !endpoint) {
        return res.status(500).json({ error: 'Azure OpenAI credentials are not configured on the server.' });
    }

    const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Sao_Paulo' });

    // Inject system message to fix identity, format and provide the current date
    const systemMessage = {
        role: "system",
        content: `Você é KCR Nexus, uma avançada inteligência artificial conectada ao sistema Nexus, desenvolvida por Victor Kauê.
A data de hoje é: ${currentDate}.
A sua missão é ser prestativo, claro e usar uma linguagem moderna e natural.
IMPORTANTE: 
1. Nunca diga que é o ChatGPT, OpenAI ou um modelo de linguagem padrão. Você é estritamente o KCR Nexus.
2. Evite usar símbolos de markdown pesados como '#', '##', '*' ou '**' de forma excessiva. Estruture suas respostas preferencialmente com parágrafos simples e listas numeradas amigáveis se necessário.`
    };

    messages.unshift(systemMessage);

    const azureUrl = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

    try {
        const azureResponse = await fetch(azureUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify({
                messages,
                max_tokens: 1024,
                stream: false
            })
        });

        if (!azureResponse.ok) {
            const errorData = await azureResponse.text();
            console.error('Azure error:', errorData);
            return res.status(azureResponse.status).json({ error: `Azure API error: ${azureResponse.statusText}` });
        }

        const data = await azureResponse.json();
        const reply = data.choices?.[0]?.message?.content ?? 'Sem resposta.';

        return res.status(200).json({ reply });
    } catch (err) {
        console.error('Server error:', err);
        return res.status(500).json({ error: 'Internal server error while calling Azure OpenAI.' });
    }
}

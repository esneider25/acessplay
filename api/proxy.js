export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { endpoint, method, apiKey, baseUrl, data } = req.body;
    
    if (!baseUrl || !endpoint) {
      return res.status(400).json({ error: "Faltan parámetros baseUrl o endpoint." });
    }

    // Ensure baseUrl doesn't end with slash if endpoint starts with one
    let safeBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    let safeEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${safeBaseUrl}${safeEndpoint}`;
    
    const fetchOptions = {
      method: method || "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey || ""
      }
    };

    if (method === "POST" && data) {
      fetchOptions.body = JSON.stringify(data);
    }

    // Perform the actual request to TiendaGiftVen
    const response = await fetch(url, fetchOptions);
    const result = await response.json();

    // Return exact status and result to the frontend
    res.status(response.status).json(result);

  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: error.message });
  }
}

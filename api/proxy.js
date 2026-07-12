import admin from 'firebase-admin';

// Initialize Firebase Admin securely
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://accesplay-8bf5d-default-rtdb.firebaseio.com"
    });
  } catch (error) {
    console.error("Firebase Admin Initialization Error:", error);
  }
}

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
    let { action, endpoint, method, apiKey, baseUrl, apiIdx, data } = req.body;
    
    // CASO 1: VERIFICADOR DE ID DE JUEGO (Modo 100% Seguro)
    if (action === 'verify_id' && apiIdx !== undefined) {
      if (!admin.apps.length) {
        return res.status(500).json({ error: "Firebase Admin no está inicializado en Vercel." });
      }
      
      const snap = await admin.database().ref('api_configs').once('value');
      const apiConfigs = snap.val() || [];
      const api = apiConfigs[parseInt(apiIdx)];
      
      if (!api || !api.enabled) {
        return res.status(400).json({ error: "La API solicitada no existe o está apagada." });
      }
      
      let bUrl = api.baseUrl.trim();
      let proxyEndpoint = 'check';
      let finalMethod = 'POST';
      let id_juego = data.id_juego || '';
      let input2 = data.input2 || '';

      if (bUrl.includes('{ID}') || bUrl.includes('{PLAYER_ID}') || bUrl.includes('{ID_JUGADOR}') || bUrl.includes('action=') || bUrl.includes('api.php')) {
        finalMethod = 'GET';
        if (bUrl.includes('{ID}')) bUrl = bUrl.replace(/{ID}/g, encodeURIComponent(id_juego));
        if (bUrl.includes('{PLAYER_ID}')) bUrl = bUrl.replace(/{PLAYER_ID}/g, encodeURIComponent(id_juego));
        if (bUrl.includes('{ID_JUGADOR}')) bUrl = bUrl.replace(/{ID_JUGADOR}/g, encodeURIComponent(id_juego));
        if (input2 && bUrl.includes('{ZONE}')) bUrl = bUrl.replace(/{ZONE}/g, encodeURIComponent(input2));
        if (input2 && bUrl.includes('{ZONE_ID}')) bUrl = bUrl.replace(/{ZONE_ID}/g, encodeURIComponent(input2));

        if (!bUrl.includes(encodeURIComponent(id_juego))) {
          bUrl = bUrl.endsWith('=') ? bUrl + encodeURIComponent(id_juego) : bUrl + '&id=' + encodeURIComponent(id_juego);
        }

        const queryIndex = bUrl.indexOf('?');
        const basePath = queryIndex > -1 ? bUrl.substring(0, queryIndex) : bUrl;
        const queryPart = queryIndex > -1 ? bUrl.substring(queryIndex) : '';

        const lastSlashIdx = basePath.lastIndexOf('/');
        if (lastSlashIdx > 8) {
          baseUrl = basePath.substring(0, lastSlashIdx);
          endpoint = basePath.substring(lastSlashIdx + 1) + queryPart;
        } else {
          baseUrl = basePath;
          endpoint = queryPart.startsWith('?') ? queryPart.substring(1) : queryPart;
        }
      } else {
        baseUrl = bUrl.endsWith('/') ? bUrl.slice(0, -1) : bUrl;
        endpoint = proxyEndpoint;
      }
      
      method = finalMethod;
      apiKey = api.apiKey || '';
      // data ya viene en req.body.data y se usará en el POST abajo
    } else {
      return res.status(403).json({ error: "Acceso denegado. El proxy solo permite verificación de IDs." });
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
    const textResult = await response.text();
    
    let result;
    try {
      result = JSON.parse(textResult);
    } catch (e) {
      // If the API returns HTML (e.g. 500 error page from Cloudflare/Nginx)
      return res.status(response.ok ? 500 : response.status).json({ 
        error: "El servicio de verificación está temporalmente caído continúa tu compra sin problemas-" 
      });
    }

    // Return exact status and result to the frontend
    res.status(response.status).json(result);

  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).json({ error: "Error interno de conexión con la API externa." });
  }
}

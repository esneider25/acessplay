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
  // Rate Limiting
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  if (!global.rateLimitProxy) global.rateLimitProxy = new Map();
  const rateLimit = global.rateLimitProxy;
  const RATE_LIMIT_WINDOW = 60000;
  const MAX_REQUESTS = 10;
  
  if (rateLimit.has(ip)) {
    const data = rateLimit.get(ip);
    if (now - data.startTime > RATE_LIMIT_WINDOW) {
      rateLimit.set(ip, { count: 1, startTime: now });
    } else {
      data.count++;
      if (data.count > MAX_REQUESTS) {
        return res.status(429).json({ error: 'Too many requests, please try again later.' });
      }
      rateLimit.set(ip, data);
    }
  } else {
    rateLimit.set(ip, { count: 1, startTime: now });
  }

  // Cleanup old entries
  if (Math.random() < 0.05) {
    for (const [key, value] of rateLimit.entries()) {
      if (now - value.startTime > RATE_LIMIT_WINDOW) rateLimit.delete(key);
    }
  }

  // Allow CORS securely
  res.setHeader('Access-Control-Allow-Credentials', true);
  const origin = req.headers.origin;
  const allowedOrigins = ['https://accesplay.com', 'https://admin.accesplay.com', 'http://localhost:3000', 'http://127.0.0.1:3000'];
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://accesplay.com');
  }
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
    let body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    let { action, endpoint, method, apiKey, baseUrl, apiIdx, data } = body;
    
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
    } else if (action === 'test_connection') {
      // ── UNIVERSAL TEST CONNECTION (mapping-driven) ──
      // Authentication check for test_connection to prevent SSRF
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Falta Token de Autenticación Admin' });
      }
      try {
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userSnap = await admin.database().ref(`users/${decodedToken.uid}`).once('value');
        const userData = userSnap.val() || {};
        if (decodedToken.email !== 'admin@accesplay.com' && userData.role !== 'admin') {
          return res.status(403).json({ error: 'Acceso denegado: Requiere permisos de administrador' });
        }
      } catch (e) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
      }
      
      const m = req.body.mapping || {};
      
      if (!baseUrl) {
        return res.status(400).json({ error: "Falta la URL base." });
      }

      endpoint = m.balanceEndpoint || '/saldo';
      method = m.balanceMethod || 'GET';
      // apiKey already comes from req.body
    } else {
      return res.status(403).json({ error: "Acceso denegado. Acción no permitida en este proxy." });
    }

    // ── UNIVERSAL REQUEST BUILDER ──
    const mapping = req.body.mapping || {};
    
    // Build final URL
    let safeBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    let safeEndpoint = endpoint ? (endpoint.startsWith('/') ? endpoint : `/${endpoint}`) : '';
    const url = `${safeBaseUrl}${safeEndpoint}`;
    
    // Build auth headers dynamically from mapping
    let authHeaders = { "Content-Type": "application/json" };
    const authType = mapping.authType || 'x-api-key';
    
    if (authType === 'bearer') {
      authHeaders["Authorization"] = `Bearer ${apiKey || ""}`;
    } else if (authType === 'x-api-key') {
      const headerName = mapping.authHeader || 'X-API-Key';
      authHeaders[headerName] = apiKey || "";
    } else if (authType === 'query') {
      // For query-based auth, append api_key to URL
      const separator = url.includes('?') ? '&' : '?';
      // We'll handle this below
    }
    // authType === 'none' → no auth header added

    let finalUrl = url;
    if (authType === 'query' && apiKey) {
      const separator = finalUrl.includes('?') ? '&' : '?';
      finalUrl = `${finalUrl}${separator}api_key=${encodeURIComponent(apiKey)}`;
    }

    const fetchOptions = {
      method: method || "GET",
      headers: authHeaders
    };

    if ((method === "POST" || method === "PUT") && data) {
      fetchOptions.body = JSON.stringify(data);
    }

    // Perform the actual request to the external API
    const response = await fetch(finalUrl, fetchOptions);
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
    res.status(500).json({ error: `Error interno en proxy: ${error.message}` });
  }
}

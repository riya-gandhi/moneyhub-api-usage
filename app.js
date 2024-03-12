const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const querystring = require("querystring");



// Step 1: Initiate OAuth 2.0 Authorization Flow
function initiateAuthorization(req, res) {
  const params = querystring.stringify({
    client_id: "4a28b179-0075-49aa-b3e4-5333cadca670",
    scope:
      "openid id:1ffe704d39629a929c8e293880fb449a accounts:read transactions:read:all",
    redirect_uri: "https://mw1v1kz7-3000.inc1.devtunnels.ms/auth/callback",
    state: "your-state-value",
    response_type: "code",
    prompt: "consent",
    request: {
      header: {
        alg: "RS256",
        typ: "JWT",
      },
      payload: {
        aud: "https://identity.moneyhub.co.uk/oidc",
        iat: 1710241113,
        exp: 1710242913,
        iss: "4a28b179-0075-49aa-b3e4-5333cadca670",
        client_id: "4a28b179-0075-49aa-b3e4-5333cadca670",
        scope:
          "openid id:1ffe704d39629a929c8e293880fb449a accounts:read transactions:read:all",
        state: "your-state-value",
        redirect_uri: "https://mw1v1kz7-3000.inc1.devtunnels.ms/auth/callback",
        claims: {
          id_token: {
            "mh:con_id": {
              essential: true,
            },
          },
        },
        response_type: "code",
        prompt: "consent",
      },
    },
  });

  // Redirect user to Moneyhub authorization page
  res.redirect(
    `https://identity.moneyhub.co.uk/oidc/auth?client_id=4a28b179-0075-49aa-b3e4-5333cadca670&prompt=consent&redirect_uri=https%3A%2F%2Fmw1v1kz7-3000.inc1.devtunnels.ms%2Fauth%2Fcallback&request=eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJhdWQiOiJodHRwczovL2lkZW50aXR5Lm1vbmV5aHViLmNvLnVrL29pZGMiLCJpYXQiOjE3MTAyNDA4NzksImV4cCI6MTcxMDI0MjY3OSwiaXNzIjoiNGEyOGIxNzktMDA3NS00OWFhLWIzZTQtNTMzM2NhZGNhNjcwIiwiY2xpZW50X2lkIjoiNGEyOGIxNzktMDA3NS00OWFhLWIzZTQtNTMzM2NhZGNhNjcwIiwic2NvcGUiOiJvcGVuaWQgaWQ6MWZmZTcwNGQzOTYyOWE5MjljOGUyOTM4ODBmYjQ0OWEgYWNjb3VudHM6cmVhZCB0cmFuc2FjdGlvbnM6cmVhZDphbGwiLCJzdGF0ZSI6InlvdXItc3RhdGUtdmFsdWUiLCJyZWRpcmVjdF91cmkiOiJodHRwczovL213MXYxa3o3LTMwMDAuaW5jMS5kZXZ0dW5uZWxzLm1zL2F1dGgvY2FsbGJhY2siLCJjbGFpbXMiOnsiaWRfdG9rZW4iOnsibWg6Y29uX2lkIjp7ImVzc2VudGlhbCI6dHJ1ZX19fSwicmVzcG9uc2VfdHlwZSI6ImNvZGUiLCJwcm9tcHQiOiJjb25zZW50In0.&response_type=code&scope=openid%20id%3A1ffe704d39629a929c8e293880fb449a%20accounts%3Aread%20transactions%3Aread%3Aall&state=your-state-value`
  );
}

// Step 2: Exchange Authorization Code for Access Token
function exchangeAuthorizationCode(code) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code,
    });

    const options = {
      hostname: "provider.moneyhub.co.uk",
      path: "/auth/token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": postData.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const tokenResponse = JSON.parse(data);
          const accessToken = tokenResponse.access_token;
          resolve(accessToken);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Step 3: Fetch Client Data using Access Token
function fetchClientData(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.moneyhub.co.uk",
      path: "/clients/me",
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const clientData = JSON.parse(data);
          resolve(clientData);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

// Route to initiate OAuth 2.0 Authorization Flow
app.get("/auth", initiateAuthorization);

// Route to handle callback from Moneyhub authorization page
app.get("/auth/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("Authorization code not found");
  }

  try {
    // Step 2: Exchange Authorization Code for Access Token
    const accessToken = await exchangeAuthorizationCode(code);

    // Step 3: Fetch Client Data using Access Token
    const clientData = await fetchClientData(accessToken);
    res.json(clientData);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

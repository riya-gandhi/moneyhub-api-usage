const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
const { Moneyhub } = require("@mft/moneyhub-api-client");
const config = require("./config.js");
const https = require("https");

// Step 1: Initiate OAuth 2.0 Authorization Flow
async function initiateAuthorization(req, res) {
  const moneyhub = await Moneyhub(config);

  const user = await moneyhub.registerUser({});
  console.log(`New User Registered-UserId#${user.userId}`);

  const url = await moneyhub.getAuthorizeUrlForCreatedUser({
    state: "foo",
    nonce: "bar",
    userId: user.userId,
    bankId: "test",
  });

  console.log(`Redirecting to Authorisation Url- ${url}`);
  res.redirect(url);
}

// Step 2: Exchange Authorization Code for Access Token
function exchangeAuthorizationCodeForTokens(code, state, id_token) {
  return new Promise(async (resolve, reject) => {
    const moneyhub = await Moneyhub(config);

    const tokens = await moneyhub.exchangeCodeForTokens({
      localParams: {
        state: state,
        nonce: "bar",
      },
      paramsFromCallback: {
        code: code,
        state: state,
        id_token: id_token,
      },
    });

    if (tokens) {
      resolve(tokens);
    } else {
      reject("Error in exchange code for tokens");
    }
  });
}

// Step 3: Fetch Client Data using Access Token
function fetchClientData(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.moneyhub.co.uk",
      path: "/v2.0/accounts",
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken.access_token}`,
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
app.get("/", initiateAuthorization);

// Route to handle callback from Moneyhub authorization page
app.get("/auth/callback", async (req, res) => {
  const { code, state, id_token } = req.query;

  if (!code) {
    return res.status(400).send("Authorization code not found");
  }

  try {
    // Step 2: Exchange Authorization Code for Access Token
    const accessToken = await exchangeAuthorizationCodeForTokens(
      code,
      state,
      id_token
    );

    // Step 3: Fetch Client Data using Access Token
    const clientData = await fetchClientData(accessToken);
    res.status(200).json(clientData);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

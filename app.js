const express = require("express");
const https = require("https");
const querystring = require("querystring");
const app = express();
const PORT = process.env.PORT || 3000;


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

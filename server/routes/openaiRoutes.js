require("dotenv").config();
const express = require("express");
const axios = require("axios");
const router = express.Router();

const endpoint = process.env.AZURE_OAI_ENDPOINT;
const apiKey = process.env.AZURE_OAI_KEY;
const deployment = process.env.AZURE_OAI_DEPLOYMENT;
const systemPrompt = process.env.SystemPrompt;

router.post("/query", async (req, res) => {
  try {
    const userMessage = req.body.message;

    const response = await axios.post(
      `${endpoint}/openai/deployments/${deployment}/extensions/chat/completions?api-version=2023-08-01-preview`,
      {
        model: deployment,
        temperature: 0.7,
        max_tokens: 4096,
        top_p: 0.95,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        dataSources: [
          {
            type: "AzureCognitiveSearch",
            parameters: {
              endpoint: process.env.AZURE_SEARCH_ENDPOINT,
              key: process.env.AZURE_SEARCH_KEY,
              indexName: process.env.AZURE_SEARCH_INDEX,
              query_type: "semantic",
              semanticConfiguration: "Config",
            },
          },
        ],
      },
      {
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    let content = response.data.choices[0].message.content;
    content = content.replace(/\[doc.*\]/g, ""); // reference removal [doc.]
    res.json({ response: content });
  } catch (error) {
    console.error(`An error occurred: ${error}`);
    res.status(500).json({ error: error.toString() });
  }
});

module.exports = router;

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");

const server = new Server(
  { name: "cargodash-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// MAKE SURE THIS IS YOUR ACTUAL LIVE RENDER URL
const RENDER_API_URL = "https://cargodash.onrender.com";

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "add_shipment",
        description: "Adds a new freight shipment to the CargoDash dashboard",
        inputSchema: {
          type: "object",
          properties: {
            origin: { type: "string", description: "The shipment origin" },
            destination: { type: "string", description: "The shipment destination" },
            cargo: { type: "string", description: "Description of the cargo" },
            weight: { type: "number", description: "Weight of the cargo in kg" },
          },
          required: ["origin", "destination", "cargo", "weight"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "add_shipment") {
    const { origin, destination, cargo, weight } = request.params.arguments || {};

    try {
      const response = await fetch(RENDER_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: String(origin).trim(),
          destination: String(destination).trim(),
          cargo: String(cargo).trim(),
          weight: Number(weight),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      return {
        content: [{ type: "text", text: `Successfully added shipment from ${origin} to ${destination}.` }],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error: ${err.message}` }],
      };
    }
  }
  throw new Error(`Tool not found`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CargoDash MCP Server initialized.");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
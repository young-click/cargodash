const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const { createClient } = require("@supabase/supabase-js");

const server = new Server(
  { name: "cargodash-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Live Render dashboard URL
const RENDER_API_URL = "https://cargodash.onrender.com";

// Supabase configuration
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xypwuwvtpdjgqayzmjeo.supabase.co")
  .trim()
  .replace(".supabase.com", ".supabase.co")
  .replace(/\/+$/, "");
const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_8-m1rppd0T-GhSmgo0_nVw_eL3Cx2G2").trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

    const cleanOrigin = String(origin || "").trim();
    const cleanDestination = String(destination || "").trim();
    const cleanCargo = String(cargo || "").trim();
    const cleanWeight = Number(weight);

    if (!cleanOrigin || !cleanDestination || !cleanCargo || isNaN(cleanWeight)) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: "Error: Invalid shipment data. Please provide origin, destination, cargo, and numeric weight.",
          },
        ],
      };
    }

    // 1. Direct Supabase insert (instant, reliable, no cold-start or proxy failure)
    try {
      const { data, error } = await supabase
        .from("shipments")
        .insert([
          {
            origin: cleanOrigin,
            destination: cleanDestination,
            cargo: cleanCargo,
            weight: cleanWeight,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        return {
          content: [
            {
              type: "text",
              text: `Successfully added shipment (ID: ${data.id}) from ${cleanOrigin} to ${cleanDestination} (${cleanCargo}, ${cleanWeight} kg) to CargoDash.`,
            },
          ],
        };
      }
      if (error) {
        console.error("Direct Supabase insert returned error:", error);
      }
    } catch (supabaseErr) {
      console.error("Direct Supabase insert exception:", supabaseErr);
    }

    // 2. HTTP Fallback to live API endpoint
    try {
      const baseUrl = (process.env.CARGODASH_API_URL || RENDER_API_URL).trim().replace(/\/+$/, "");
      const targetEndpoint = baseUrl.endsWith("/api/shipments") ? baseUrl : `${baseUrl}/api/shipments`;

      const response = await fetch(targetEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: cleanOrigin,
          destination: cleanDestination,
          cargo: cleanCargo,
          weight: cleanWeight,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      const resData = await response.json();
      return {
        content: [
          {
            type: "text",
            text: `Successfully added shipment from ${cleanOrigin} to ${cleanDestination} via API.`,
          },
        ],
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
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const EVOLUTION_KEY = Deno.env.get("EVOLUTION_KEY") ?? "";
const EVOLUTION_URL = Deno.env.get("EVOLUTION_URL") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  const url = new URL(req.url);
  const path = url.searchParams.get("path") ?? "";

  const res = await fetch(`${EVOLUTION_URL}${path}`, {
    method: req.method,
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: req.method !== "GET" ? await req.text() : undefined,
  });

  const data = await res.json();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
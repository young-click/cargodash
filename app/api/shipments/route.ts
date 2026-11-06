import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Fetch all records from the shipments table ordered by created_at descending
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? `${err.name}: ${err.message}${err.cause ? ` (Cause: ${(err.cause as Error).message || err.cause})` : ""}` : "Internal Server Error";
    console.error("GET /api/shipments error:", errorDetails);
    return NextResponse.json({ error: errorDetails }, { status: 500 });
  }
}

// POST: Accept origin, destination, cargo, weight from req.json(). Insert into shipments table
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { origin, destination, cargo, weight } = body;

    // Validate required fields
    if (!origin || !destination || !cargo || weight === undefined || weight === null) {
      return NextResponse.json(
        {
          error:
            "Missing required fields. Please provide origin, destination, cargo, and weight.",
        },
        { status: 400 }
      );
    }

    const numericWeight = Number(weight);
    if (isNaN(numericWeight) || numericWeight < 0) {
      return NextResponse.json(
        { error: "Weight must be a valid positive number." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("shipments")
      .insert([
        {
          origin: String(origin).trim(),
          destination: String(destination).trim(),
          cargo: String(cargo).trim(),
          weight: numericWeight,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const errorDetails = err instanceof Error ? `${err.name}: ${err.message}${err.cause ? ` (Cause: ${(err.cause as Error).message || err.cause})` : ""}` : "Internal Server Error";
    console.error("POST /api/shipments error:", errorDetails);
    return NextResponse.json({ error: errorDetails }, { status: 500 });
  }
}

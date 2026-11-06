import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PUT: Accept status from req.json(). Update record in shipments table where id matches URL parameter
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Shipment ID is required in URL parameter." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status || typeof status !== "string") {
      return NextResponse.json(
        { error: "Field 'status' is required and must be a string." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("shipments")
      .update({ status: status.trim() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: `Shipment with id '${id}' not found.` },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: `Shipment with id '${id}' not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

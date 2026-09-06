import { NextResponse } from "next/server";

// Consistent envelope for every API route so the future frontend can rely on a
// single response shape. Keep this the only place that constructs API responses.

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
  issues?: Record<string, string[] | undefined>;
}

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init);
}

export function apiError(
  error: string,
  status = 400,
  issues?: Record<string, string[] | undefined>,
) {
  return NextResponse.json<ApiError>({ ok: false, error, issues }, { status });
}

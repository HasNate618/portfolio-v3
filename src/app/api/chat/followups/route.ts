import { checkRateLimit } from "../lib/rate-limit";
import { CHIP_FEATURE_DEFAULT, generateChips } from "../lib/generate-followups";
import { askedAboutAbandoned } from "../lib/chips-validate";
import { DEFAULT_FOLLOWUPS } from "../lib/followup-fallback";

export async function POST(req: Request) {
  let userMessage = "";
  let aiResponse = "";

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const { allowed, retryAfter } = checkRateLimit(ip);
    if (!allowed) {
      return Response.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfter) },
        },
      );
    }

    const body = (await req.json()) as {
      userMessage?: string;
      aiResponse?: string;
    };
    userMessage = body.userMessage ?? "";
    aiResponse = body.aiResponse ?? "";

    if (!userMessage || !aiResponse) {
      return Response.json({ error: "userMessage and aiResponse required" }, { status: 400 });
    }

    const followups = await generateChips({
      userMessage,
      answer: aiResponse,
      docs: [],
      featureIds: CHIP_FEATURE_DEFAULT,
      asked: [],
      userAskedAbandoned: askedAboutAbandoned(userMessage),
    });
    return Response.json({ followups });
  } catch (error) {
    console.error("Followups API error:", error);
    return Response.json({ followups: DEFAULT_FOLLOWUPS });
  }
}

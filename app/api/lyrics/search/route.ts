import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type LrcLibItem = {
  id: number;
  trackName: string;
  artistName: string;
  albumName?: string;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
};

type CatalogItem = { trackName?: string; artistName?: string };

function normalized(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
}

async function searchLrcLib(parameters: Record<string, string>) {
  const endpoint = new URL("https://lrclib.net/api/search");
  Object.entries(parameters).forEach(([key, value]) => endpoint.searchParams.set(key, value));
  const response = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("LRCLIB request failed");
  return response.json() as Promise<LrcLibItem[]>;
}

async function discoverMatches(term: string) {
  const endpoint = new URL("https://itunes.apple.com/search");
  endpoint.searchParams.set("term", term);
  endpoint.searchParams.set("entity", "song");
  endpoint.searchParams.set("country", "JP");
  endpoint.searchParams.set("limit", "8");
  const response = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.timeout(6000) });
  if (!response.ok) return [];
  const data = (await response.json()) as { results?: CatalogItem[] };
  return (data.results || []).filter(
    (item): item is Required<CatalogItem> => Boolean(item.trackName && item.artistName),
  );
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams;
  const trackName = query.get("track")?.trim();
  const artistName = query.get("artist")?.trim();
  if ((!trackName && !artistName) || (trackName && trackName.length > 100) || (artistName && artistName.length > 100)) {
    return NextResponse.json({ error: "请至少输入歌名或歌手" }, { status: 400 });
  }
  try {
    const term = [trackName, artistName].filter(Boolean).join(" ");
    const [directResults, catalogResults] = await Promise.all([
      searchLrcLib({ q: term }).catch(() => []),
      discoverMatches(term).catch(() => []),
    ]);
    const candidates = catalogResults
      .filter((item, index, items) => items.findIndex(
        (candidate) => normalized(candidate.trackName) === normalized(item.trackName)
          && normalized(candidate.artistName) === normalized(item.artistName),
      ) === index)
      .slice(0, 5);
    const discoveredResults = await Promise.all(
      candidates.map((item) => searchLrcLib({ track_name: item.trackName }).catch(() => [])),
    );
    const uniqueResults = [...directResults, ...discoveredResults.flat()].filter(
      (item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index,
    );
    const trackQuery = normalized(trackName || "");
    const artistQuery = normalized(artistName || "");
    const rankedResults = uniqueResults
      .map((item) => {
        const itemTrack = normalized(item.trackName);
        const itemArtist = normalized(item.artistName);
        const score = (trackQuery && itemTrack.includes(trackQuery) ? 4 : 0)
          + (artistQuery && itemArtist.includes(artistQuery) ? 3 : 0)
          + (trackQuery && itemTrack === trackQuery ? 2 : 0)
          + (artistQuery && itemArtist === artistQuery ? 1 : 0);
        return { item, score };
      })
      .sort((left, right) => right.score - left.score)
      .map(({ item }) => ({
        id: item.id,
        trackName: item.trackName,
        artistName: item.artistName,
        albumName: item.albumName,
        lyrics: item.plainLyrics || item.syncedLyrics || "",
      }))
      .filter((item) => item.lyrics)
      .slice(0, 8);
    return NextResponse.json({ results: rankedResults });
  } catch {
    return NextResponse.json({ error: "歌词服务请求超时" }, { status: 504 });
  }
}

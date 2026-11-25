import type { createClient } from "./server";
import type { ArtistRef } from "@/lib/lineup";

type Client = ReturnType<typeof createClient>;

const PAGE = 1000; // PostgREST's default row cap

/** Every artist in the archive, for name matching. */
export async function loadArtists(supabase: Client): Promise<{ artists: ArtistRef[] } | { error: string }> {
  const artists: ArtistRef[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("artists")
      .select("id, name, slug")
      .order("id")
      .range(from, from + PAGE - 1)
      .returns<ArtistRef[]>();
    if (error) return { error: error.message };
    artists.push(...(data ?? []));
    if ((data ?? []).length < PAGE) return { artists };
  }
}

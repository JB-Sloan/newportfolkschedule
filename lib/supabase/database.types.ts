// Generated from Supabase project uczitvfcazcujzbhjetj via generate_typescript_types.
// Regenerate with: npx supabase gen types typescript --project-id uczitvfcazcujzbhjetj

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      announcement_waves: {
        Row: {
          announced_at: string
          edition_id: string
          id: string
          notes: string | null
          source_url: string | null
          wave_number: number
        }
        Insert: {
          announced_at: string
          edition_id: string
          id?: string
          notes?: string | null
          source_url?: string | null
          wave_number: number
        }
        Update: {
          announced_at?: string
          edition_id?: string
          id?: string
          notes?: string | null
          source_url?: string | null
          wave_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "announcement_waves_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_aliases: {
        Row: {
          alias: string
          alias_type: string
          artist_id: string
          id: string
        }
        Insert: {
          alias: string
          alias_type?: string
          artist_id: string
          id?: string
        }
        Update: {
          alias?: string
          alias_type?: string
          artist_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artist_aliases_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_feature_snapshots: {
        Row: {
          artist_id: string
          as_of: string
          edition_id: string
          explanation: string | null
          feature_key: string
          id: string
          normalized: number
          raw_value: Json | null
        }
        Insert: {
          artist_id: string
          as_of: string
          edition_id: string
          explanation?: string | null
          feature_key: string
          id?: string
          normalized: number
          raw_value?: Json | null
        }
        Update: {
          artist_id?: string
          as_of?: string
          edition_id?: string
          explanation?: string | null
          feature_key?: string
          id?: string
          normalized?: number
          raw_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_feature_snapshots_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_feature_snapshots_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_feature_snapshots_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "prediction_features"
            referencedColumns: ["key"]
          },
        ]
      }
      artist_memberships: {
        Row: {
          created_at: string
          ended_year: number | null
          group_id: string
          id: string
          is_current: boolean
          is_founding: boolean
          is_touring_only: boolean
          notes: string | null
          person_id: string
          roles: string[]
          started_year: number | null
        }
        Insert: {
          created_at?: string
          ended_year?: number | null
          group_id: string
          id?: string
          is_current?: boolean
          is_founding?: boolean
          is_touring_only?: boolean
          notes?: string | null
          person_id: string
          roles?: string[]
          started_year?: number | null
        }
        Update: {
          created_at?: string
          ended_year?: number | null
          group_id?: string
          id?: string
          is_current?: boolean
          is_founding?: boolean
          is_touring_only?: boolean
          notes?: string | null
          person_id?: string
          roles?: string[]
          started_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_memberships_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_org_links: {
        Row: {
          artist_id: string
          ended_year: number | null
          id: string
          is_current: boolean
          org_id: string
          relationship: string
          started_year: number | null
        }
        Insert: {
          artist_id: string
          ended_year?: number | null
          id?: string
          is_current?: boolean
          org_id: string
          relationship: string
          started_year?: number | null
        }
        Update: {
          artist_id?: string
          ended_year?: number | null
          id?: string
          is_current?: boolean
          org_id?: string
          relationship?: string
          started_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_org_links_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_org_links_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      artist_requests: {
        Row: {
          artist_id: string | null
          confidence: Database["public"]["Enums"]["confidence_level"]
          context: string | null
          created_at: string
          edition_id: string | null
          festival_year: number
          id: string
          request_post_year: number | null
          request_type: Database["public"]["Enums"]["request_type"]
          requested_name: string
          source_id: string | null
          status: Database["public"]["Enums"]["content_status"]
          submitted_by: string | null
        }
        Insert: {
          artist_id?: string | null
          confidence?: Database["public"]["Enums"]["confidence_level"]
          context?: string | null
          created_at?: string
          edition_id?: string | null
          festival_year: number
          id?: string
          request_post_year?: number | null
          request_type?: Database["public"]["Enums"]["request_type"]
          requested_name: string
          source_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          submitted_by?: string | null
        }
        Update: {
          artist_id?: string | null
          confidence?: Database["public"]["Enums"]["confidence_level"]
          context?: string | null
          created_at?: string
          edition_id?: string | null
          festival_year?: number
          id?: string
          request_post_year?: number | null
          request_type?: Database["public"]["Enums"]["request_type"]
          requested_name?: string
          source_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_requests_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_requests_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_requests_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artist_requests_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          artist_type: Database["public"]["Enums"]["artist_type"]
          bio: string | null
          born_year: number | null
          country: string | null
          created_at: string
          died_year: number | null
          disbanded_year: number | null
          formed_year: number | null
          genres: string[]
          home_base: string | null
          id: string
          image_url: string | null
          is_newport_alum: boolean
          musicbrainz_id: string | null
          name: string
          official_url: string | null
          setlistfm_mbid: string | null
          slug: string
          sort_name: string | null
          spotify_id: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          artist_type: Database["public"]["Enums"]["artist_type"]
          bio?: string | null
          born_year?: number | null
          country?: string | null
          created_at?: string
          died_year?: number | null
          disbanded_year?: number | null
          formed_year?: number | null
          genres?: string[]
          home_base?: string | null
          id?: string
          image_url?: string | null
          is_newport_alum?: boolean
          musicbrainz_id?: string | null
          name: string
          official_url?: string | null
          setlistfm_mbid?: string | null
          slug: string
          sort_name?: string | null
          spotify_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          artist_type?: Database["public"]["Enums"]["artist_type"]
          bio?: string | null
          born_year?: number | null
          country?: string | null
          created_at?: string
          died_year?: number | null
          disbanded_year?: number | null
          formed_year?: number | null
          genres?: string[]
          home_base?: string | null
          id?: string
          image_url?: string | null
          is_newport_alum?: boolean
          musicbrainz_id?: string | null
          name?: string
          official_url?: string | null
          setlistfm_mbid?: string | null
          slug?: string
          sort_name?: string | null
          spotify_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          criteria: Json
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          tier: string | null
        }
        Insert: {
          criteria: Json
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          tier?: string | null
        }
        Update: {
          criteria?: Json
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          tier?: string | null
        }
        Relationships: []
      }
      bingo_cards: {
        Row: {
          created_at: string
          edition_id: string
          id: string
          is_public: boolean
          locked_at: string | null
          score: number
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          edition_id: string
          id?: string
          is_public?: boolean
          locked_at?: string | null
          score?: number
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          edition_id?: string
          id?: string
          is_public?: boolean
          locked_at?: string | null
          score?: number
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bingo_cards_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bingo_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bingo_squares: {
        Row: {
          artist_id: string | null
          card_id: string
          id: string
          is_free: boolean
          is_hit: boolean
          position: number
          resolved_at: string | null
        }
        Insert: {
          artist_id?: string | null
          card_id: string
          id?: string
          is_free?: boolean
          is_hit?: boolean
          position: number
          resolved_at?: string | null
        }
        Update: {
          artist_id?: string | null
          card_id?: string
          id?: string
          is_free?: boolean
          is_hit?: boolean
          position?: number
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bingo_squares_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bingo_squares_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "bingo_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      citations: {
        Row: {
          added_by: string | null
          confidence: Database["public"]["Enums"]["confidence_level"]
          created_at: string
          entity_id: string
          entity_table: string
          id: string
          note: string | null
          source_id: string
        }
        Insert: {
          added_by?: string | null
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          entity_id: string
          entity_table: string
          id?: string
          note?: string | null
          source_id: string
        }
        Update: {
          added_by?: string | null
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          entity_id?: string
          entity_table?: string
          id?: string
          note?: string | null
          source_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "citations_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "citations_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      editions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_cancelled: boolean
          name: string | null
          notes: string | null
          poster_url: string | null
          start_date: string | null
          venue_id: string | null
          year: number
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_cancelled?: boolean
          name?: string | null
          notes?: string | null
          poster_url?: string | null
          start_date?: string | null
          venue_id?: string | null
          year: number
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_cancelled?: boolean
          name?: string | null
          notes?: string | null
          poster_url?: string | null
          start_date?: string | null
          venue_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "editions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendance: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          date: string
          edition_id: string
          id: string
          is_official: boolean
          kind: Database["public"]["Enums"]["event_kind"]
          name: string | null
          notes: string | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string
          date: string
          edition_id: string
          id?: string
          is_official?: boolean
          kind?: Database["public"]["Enums"]["event_kind"]
          name?: string | null
          notes?: string | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          edition_id?: string
          id?: string
          is_official?: boolean
          kind?: Database["public"]["Enums"]["event_kind"]
          name?: string | null
          notes?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_categories: {
        Row: {
          default_kind: Database["public"]["Enums"]["topic_kind"]
          description: string | null
          id: string
          is_locked: boolean
          min_role: Database["public"]["Enums"]["user_role"]
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          default_kind?: Database["public"]["Enums"]["topic_kind"]
          description?: string | null
          id?: string
          is_locked?: boolean
          min_role?: Database["public"]["Enums"]["user_role"]
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          default_kind?: Database["public"]["Enums"]["topic_kind"]
          description?: string | null
          id?: string
          is_locked?: boolean
          min_role?: Database["public"]["Enums"]["user_role"]
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      instruments: {
        Row: {
          family: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          family?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          family?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      lineup_announcements: {
        Row: {
          announced_at: string
          artist_id: string
          billed_name: string | null
          edition_id: string
          id: string
          wave_id: string | null
        }
        Insert: {
          announced_at?: string
          artist_id: string
          billed_name?: string | null
          edition_id: string
          id?: string
          wave_id?: string | null
        }
        Update: {
          announced_at?: string
          artist_id?: string
          billed_name?: string | null
          edition_id?: string
          id?: string
          wave_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lineup_announcements_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineup_announcements_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lineup_announcements_wave_id_fkey"
            columns: ["wave_id"]
            isOneToOne: false
            referencedRelation: "announcement_waves"
            referencedColumns: ["id"]
          },
        ]
      }
      media_embeds: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          is_official: boolean
          performance_id: string | null
          provider: Database["public"]["Enums"]["media_provider"]
          provider_id: string | null
          set_id: string | null
          setlist_entry_id: string | null
          status: Database["public"]["Enums"]["content_status"]
          submitted_by: string | null
          thumbnail_url: string | null
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_official?: boolean
          performance_id?: string | null
          provider: Database["public"]["Enums"]["media_provider"]
          provider_id?: string | null
          set_id?: string | null
          setlist_entry_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          submitted_by?: string | null
          thumbnail_url?: string | null
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          is_official?: boolean
          performance_id?: string | null
          provider?: Database["public"]["Enums"]["media_provider"]
          provider_id?: string | null
          set_id?: string | null
          setlist_entry_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          submitted_by?: string | null
          thumbnail_url?: string | null
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_embeds_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_embeds_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_embeds_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "v_artist_appearances"
            referencedColumns: ["set_id"]
          },
          {
            foreignKeyName: "media_embeds_setlist_entry_id_fkey"
            columns: ["setlist_entry_id"]
            isOneToOne: false
            referencedRelation: "setlist_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_embeds_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      merch_items: {
        Row: {
          created_at: string
          designer: string | null
          edition_id: string | null
          id: string
          image_url: string | null
          is_official: boolean
          item_type: string | null
          name: string
          print_run_note: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          designer?: string | null
          edition_id?: string | null
          id?: string
          image_url?: string | null
          is_official?: boolean
          item_type?: string | null
          name: string
          print_run_note?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          designer?: string | null
          edition_id?: string | null
          id?: string
          image_url?: string | null
          is_official?: boolean
          item_type?: string | null
          name?: string
          print_run_note?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "merch_items_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      merch_listings: {
        Row: {
          asking_price: number | null
          condition: string | null
          contact_via: string
          created_at: string
          currency: string | null
          expires_at: string | null
          external_url: string | null
          id: string
          item_id: string | null
          listing_type: string
          seller_id: string
          size: string | null
          status: string
          title: string
        }
        Insert: {
          asking_price?: number | null
          condition?: string | null
          contact_via?: string
          created_at?: string
          currency?: string | null
          expires_at?: string | null
          external_url?: string | null
          id?: string
          item_id?: string | null
          listing_type?: string
          seller_id: string
          size?: string | null
          status?: string
          title: string
        }
        Update: {
          asking_price?: number | null
          condition?: string | null
          contact_via?: string
          created_at?: string
          currency?: string | null
          expires_at?: string | null
          external_url?: string | null
          id?: string
          item_id?: string | null
          listing_type?: string
          seller_id?: string
          size?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "merch_listings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "merch_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merch_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_table: string | null
          id: string
          moderator_id: string | null
          reason: string | null
          target_user: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_table?: string | null
          id?: string
          moderator_id?: string | null
          reason?: string | null
          target_user?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_table?: string | null
          id?: string
          moderator_id?: string | null
          reason?: string | null
          target_user?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_target_user_fkey"
            columns: ["target_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      news_items: {
        Row: {
          artist_id: string | null
          created_at: string
          editor_note: string | null
          id: string
          is_featured: boolean
          is_suppressed: boolean
          kind: Database["public"]["Enums"]["news_kind"]
          published_at: string
          release_id: string | null
          source_id: string | null
          summary: string | null
          title: string
          url: string | null
        }
        Insert: {
          artist_id?: string | null
          created_at?: string
          editor_note?: string | null
          id?: string
          is_featured?: boolean
          is_suppressed?: boolean
          kind: Database["public"]["Enums"]["news_kind"]
          published_at: string
          release_id?: string | null
          source_id?: string | null
          summary?: string | null
          title: string
          url?: string | null
        }
        Update: {
          artist_id?: string | null
          created_at?: string
          editor_note?: string | null
          id?: string
          is_featured?: boolean
          is_suppressed?: boolean
          kind?: Database["public"]["Enums"]["news_kind"]
          published_at?: string
          release_id?: string | null
          source_id?: string | null
          summary?: string | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_items_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_items_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_items_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          country: string | null
          created_at: string
          id: string
          name: string
          org_type: Database["public"]["Enums"]["org_type"]
          parent_org_id: string | null
          slug: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          name: string
          org_type: Database["public"]["Enums"]["org_type"]
          parent_org_id?: string | null
          slug: string
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          name?: string
          org_type?: Database["public"]["Enums"]["org_type"]
          parent_org_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_votes: {
        Row: {
          created_at: string
          performance_id: string
          user_id: string
          vote: number
        }
        Insert: {
          created_at?: string
          performance_id: string
          user_id: string
          vote: number
        }
        Update: {
          created_at?: string
          performance_id?: string
          user_id?: string
          vote?: number
        }
        Relationships: [
          {
            foreignKeyName: "performance_votes_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performances: {
        Row: {
          artist_id: string
          confirm_count: number
          created_at: string
          dispute_count: number
          id: string
          instruments: string[]
          notes: string | null
          role: Database["public"]["Enums"]["performance_role"]
          set_id: string
          status: Database["public"]["Enums"]["claim_status"]
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          artist_id: string
          confirm_count?: number
          created_at?: string
          dispute_count?: number
          id?: string
          instruments?: string[]
          notes?: string | null
          role: Database["public"]["Enums"]["performance_role"]
          set_id: string
          status?: Database["public"]["Enums"]["claim_status"]
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          artist_id?: string
          confirm_count?: number
          created_at?: string
          dispute_count?: number
          id?: string
          instruments?: string[]
          notes?: string | null
          role?: Database["public"]["Enums"]["performance_role"]
          set_id?: string
          status?: Database["public"]["Enums"]["claim_status"]
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "performances_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performances_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performances_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "v_artist_appearances"
            referencedColumns: ["set_id"]
          },
          {
            foreignKeyName: "performances_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string | null
          body_md: string
          created_at: string
          edited_at: string | null
          id: string
          parent_post_id: string | null
          status: Database["public"]["Enums"]["content_status"]
          topic_id: string
          vote_score: number
        }
        Insert: {
          author_id?: string | null
          body_md: string
          created_at?: string
          edited_at?: string | null
          id?: string
          parent_post_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          topic_id: string
          vote_score?: number
        }
        Update: {
          author_id?: string | null
          body_md?: string
          created_at?: string
          edited_at?: string | null
          id?: string
          parent_post_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          topic_id?: string
          vote_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_features: {
        Row: {
          description: string | null
          direction: string
          id: string
          is_active: boolean
          is_manual: boolean
          key: string
          name: string
          updated_at: string
          weight: number
        }
        Insert: {
          description?: string | null
          direction?: string
          id?: string
          is_active?: boolean
          is_manual?: boolean
          key: string
          name: string
          updated_at?: string
          weight: number
        }
        Update: {
          description?: string | null
          direction?: string
          id?: string
          is_active?: boolean
          is_manual?: boolean
          key?: string
          name?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      prediction_outcomes: {
        Row: {
          announced_at: string | null
          artist_id: string
          did_play: boolean
          edition_id: string
        }
        Insert: {
          announced_at?: string | null
          artist_id: string
          did_play: boolean
          edition_id: string
        }
        Update: {
          announced_at?: string | null
          artist_id?: string
          did_play?: boolean
          edition_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_outcomes_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prediction_outcomes_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          artist_id: string
          as_of: string
          edition_id: string
          id: string
          model_version: string
          probability: number | null
          rank: number
          score: number
          tier: string | null
        }
        Insert: {
          artist_id: string
          as_of: string
          edition_id: string
          id?: string
          model_version: string
          probability?: number | null
          rank: number
          score: number
          tier?: string | null
        }
        Update: {
          artist_id?: string
          as_of?: string
          edition_id?: string
          id?: string
          model_version?: string
          probability?: number | null
          rank?: number
          score?: number
          tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned_reason: string | null
          bio: string | null
          contributions: number
          created_at: string
          display_name: string | null
          first_fest_year: number | null
          handle: string
          home_city: string | null
          id: string
          is_banned: boolean
          reputation: number
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          banned_reason?: string | null
          bio?: string | null
          contributions?: number
          created_at?: string
          display_name?: string | null
          first_fest_year?: number | null
          handle: string
          home_city?: string | null
          id: string
          is_banned?: boolean
          reputation?: number
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          banned_reason?: string | null
          bio?: string | null
          contributions?: number
          created_at?: string
          display_name?: string | null
          first_fest_year?: number | null
          handle?: string
          home_city?: string | null
          id?: string
          is_banned?: boolean
          reputation?: number
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      release_credits: {
        Row: {
          artist_id: string
          credit_role: string
          id: string
          release_id: string
        }
        Insert: {
          artist_id: string
          credit_role: string
          id?: string
          release_id: string
        }
        Update: {
          artist_id?: string
          credit_role?: string
          id?: string
          release_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_credits_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "release_credits_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      releases: {
        Row: {
          announced_at: string | null
          cover_url: string | null
          created_at: string
          id: string
          is_debut: boolean
          label_org_id: string | null
          musicbrainz_rg_id: string | null
          primary_artist_id: string
          release_date: string | null
          release_type: Database["public"]["Enums"]["release_type"]
          spotify_album_id: string | null
          title: string
        }
        Insert: {
          announced_at?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          is_debut?: boolean
          label_org_id?: string | null
          musicbrainz_rg_id?: string | null
          primary_artist_id: string
          release_date?: string | null
          release_type?: Database["public"]["Enums"]["release_type"]
          spotify_album_id?: string | null
          title: string
        }
        Update: {
          announced_at?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          is_debut?: boolean
          label_org_id?: string | null
          musicbrainz_rg_id?: string | null
          primary_artist_id?: string
          release_date?: string | null
          release_type?: Database["public"]["Enums"]["release_type"]
          spotify_album_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "releases_label_org_id_fkey"
            columns: ["label_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "releases_primary_artist_id_fkey"
            columns: ["primary_artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          entity_id: string
          entity_table: string
          id: string
          reason: string
          reporter_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          entity_id: string
          entity_table: string
          id?: string
          reason: string
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          entity_id?: string
          entity_table?: string
          id?: string
          reason?: string
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      revisions: {
        Row: {
          comment: string | null
          created_at: string
          current: Json | null
          edited_by: string | null
          entity_id: string
          entity_table: string
          id: string
          operation: string
          previous: Json | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          current?: Json | null
          edited_by?: string | null
          entity_id: string
          entity_table: string
          id?: string
          operation: string
          previous?: Json | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          current?: Json | null
          edited_by?: string | null
          entity_id?: string
          entity_table?: string
          id?: string
          operation?: string
          previous?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "revisions_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      set_attendance: {
        Row: {
          created_at: string
          is_favorite: boolean
          saw_full: boolean
          set_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          is_favorite?: boolean
          saw_full?: boolean
          set_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          is_favorite?: boolean
          saw_full?: boolean
          set_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "set_attendance_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_attendance_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "v_artist_appearances"
            referencedColumns: ["set_id"]
          },
          {
            foreignKeyName: "set_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      set_reviews: {
        Row: {
          author_id: string
          body_md: string | null
          created_at: string
          id: string
          rating: number | null
          set_id: string
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
          was_present: boolean
        }
        Insert: {
          author_id: string
          body_md?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          set_id: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          was_present?: boolean
        }
        Update: {
          author_id?: string
          body_md?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          set_id?: string
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
          was_present?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "set_reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_reviews_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_reviews_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "v_artist_appearances"
            referencedColumns: ["set_id"]
          },
        ]
      }
      setlist_entries: {
        Row: {
          cover_of_artist_id: string | null
          created_at: string
          id: string
          is_cover: boolean
          is_encore: boolean
          is_tease: boolean
          notes: string | null
          position: number
          raw_title: string
          segues_into_next: boolean
          set_id: string
          song_id: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          cover_of_artist_id?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          is_encore?: boolean
          is_tease?: boolean
          notes?: string | null
          position: number
          raw_title: string
          segues_into_next?: boolean
          set_id: string
          song_id?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          cover_of_artist_id?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          is_encore?: boolean
          is_tease?: boolean
          notes?: string | null
          position?: number
          raw_title?: string
          segues_into_next?: boolean
          set_id?: string
          song_id?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "setlist_entries_cover_of_artist_id_fkey"
            columns: ["cover_of_artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlist_entries_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlist_entries_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "v_artist_appearances"
            referencedColumns: ["set_id"]
          },
          {
            foreignKeyName: "setlist_entries_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlist_entries_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      setlist_entry_performers: {
        Row: {
          performance_id: string
          setlist_entry_id: string
        }
        Insert: {
          performance_id: string
          setlist_entry_id: string
        }
        Update: {
          performance_id?: string
          setlist_entry_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "setlist_entry_performers_performance_id_fkey"
            columns: ["performance_id"]
            isOneToOne: false
            referencedRelation: "performances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlist_entry_performers_setlist_entry_id_fkey"
            columns: ["setlist_entry_id"]
            isOneToOne: false
            referencedRelation: "setlist_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      sets: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          billed_artist_id: string | null
          billed_name: string
          created_at: string
          description: string | null
          event_id: string
          id: string
          is_surprise: boolean
          scheduled_end: string | null
          scheduled_start: string | null
          set_kind: Database["public"]["Enums"]["set_kind"]
          slug: string
          stage_id: string | null
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          billed_artist_id?: string | null
          billed_name: string
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          is_surprise?: boolean
          scheduled_end?: string | null
          scheduled_start?: string | null
          set_kind?: Database["public"]["Enums"]["set_kind"]
          slug: string
          stage_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          billed_artist_id?: string | null
          billed_name?: string
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          is_surprise?: boolean
          scheduled_end?: string | null
          scheduled_start?: string | null
          set_kind?: Database["public"]["Enums"]["set_kind"]
          slug?: string
          stage_id?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sets_billed_artist_id_fkey"
            columns: ["billed_artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sets_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      song_aliases: {
        Row: {
          alias: string
          id: string
          song_id: string
        }
        Insert: {
          alias: string
          id?: string
          song_id: string
        }
        Update: {
          alias?: string
          id?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_aliases_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          canonical_artist_id: string | null
          created_at: string
          id: string
          is_traditional: boolean
          musicbrainz_work_id: string | null
          slug: string
          title: string
          year_written: number | null
        }
        Insert: {
          canonical_artist_id?: string | null
          created_at?: string
          id?: string
          is_traditional?: boolean
          musicbrainz_work_id?: string | null
          slug: string
          title: string
          year_written?: number | null
        }
        Update: {
          canonical_artist_id?: string | null
          created_at?: string
          id?: string
          is_traditional?: boolean
          musicbrainz_work_id?: string | null
          slug?: string
          title?: string
          year_written?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "songs_canonical_artist_id_fkey"
            columns: ["canonical_artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      sources: {
        Row: {
          added_by: string | null
          author_handle: string | null
          created_at: string
          excerpt: string | null
          id: string
          kind: Database["public"]["Enums"]["source_kind"]
          published_at: string | null
          retrieved_at: string
          title: string | null
          url: string | null
        }
        Insert: {
          added_by?: string | null
          author_handle?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          kind: Database["public"]["Enums"]["source_kind"]
          published_at?: string | null
          retrieved_at?: string
          title?: string | null
          url?: string | null
        }
        Update: {
          added_by?: string | null
          author_handle?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["source_kind"]
          published_at?: string | null
          retrieved_at?: string
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sources_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_transits: {
        Row: {
          from_stage_id: string
          notes: string | null
          to_stage_id: string
          walk_minutes: number
        }
        Insert: {
          from_stage_id: string
          notes?: string | null
          to_stage_id: string
          walk_minutes: number
        }
        Update: {
          from_stage_id?: string
          notes?: string | null
          to_stage_id?: string
          walk_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "stage_transits_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stage_transits_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
        ]
      }
      stages: {
        Row: {
          active_from: number | null
          active_to: number | null
          capacity_est: number | null
          id: string
          name: string
          slug: string
          sort_order: number
          venue_id: string
        }
        Insert: {
          active_from?: number | null
          active_to?: number | null
          capacity_est?: number | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          venue_id: string
        }
        Update: {
          active_from?: number | null
          active_to?: number | null
          capacity_est?: number | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stages_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          artist_id: string | null
          author_id: string | null
          category_id: string
          created_at: string
          edition_id: string | null
          id: string
          is_locked: boolean
          is_pinned: boolean
          kind: Database["public"]["Enums"]["topic_kind"]
          last_post_at: string
          reply_count: number
          set_id: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
          vote_score: number
          wishlist_status: string | null
        }
        Insert: {
          artist_id?: string | null
          author_id?: string | null
          category_id: string
          created_at?: string
          edition_id?: string | null
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          kind?: Database["public"]["Enums"]["topic_kind"]
          last_post_at?: string
          reply_count?: number
          set_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          vote_score?: number
          wishlist_status?: string | null
        }
        Update: {
          artist_id?: string | null
          author_id?: string | null
          category_id?: string
          created_at?: string
          edition_id?: string | null
          id?: string
          is_locked?: boolean
          is_pinned?: boolean
          kind?: Database["public"]["Enums"]["topic_kind"]
          last_post_at?: string
          reply_count?: number
          set_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          vote_score?: number
          wishlist_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topics_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "v_artist_appearances"
            referencedColumns: ["set_id"]
          },
        ]
      }
      user_badges: {
        Row: {
          awarded_at: string
          badge_id: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_id: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          artist_id: string
          created_at: string
          notify: boolean
          user_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          notify?: boolean
          user_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          notify?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_schedule_items: {
        Row: {
          note: string | null
          priority: string
          schedule_id: string
          set_id: string
        }
        Insert: {
          note?: string | null
          priority?: string
          schedule_id: string
          set_id: string
        }
        Update: {
          note?: string | null
          priority?: string
          schedule_id?: string
          set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_schedule_items_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "user_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_schedule_items_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_schedule_items_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "v_artist_appearances"
            referencedColumns: ["set_id"]
          },
        ]
      }
      user_schedules: {
        Row: {
          created_at: string
          edition_id: string
          id: string
          is_public: boolean
          name: string
          share_slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          edition_id: string
          id?: string
          is_public?: boolean
          name?: string
          share_slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          edition_id?: string
          id?: string
          is_public?: boolean
          name?: string
          share_slug?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_schedules_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_schedules_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          capacity: number | null
          city: string | null
          country: string | null
          id: string
          is_primary_site: boolean
          lat: number | null
          lng: number | null
          name: string
          slug: string
          state: string | null
        }
        Insert: {
          capacity?: number | null
          city?: string | null
          country?: string | null
          id?: string
          is_primary_site?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          slug: string
          state?: string | null
        }
        Update: {
          capacity?: number | null
          city?: string | null
          country?: string | null
          id?: string
          is_primary_site?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          slug?: string
          state?: string | null
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          entity_id: string
          entity_table: string
          id: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_table: string
          id?: string
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_table?: string
          id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_artist_appearances: {
        Row: {
          artist_id: string | null
          artist_name: string | null
          artist_type: Database["public"]["Enums"]["artist_type"] | null
          billed_name: string | null
          edition_year: number | null
          event_date: string | null
          event_kind: Database["public"]["Enums"]["event_kind"] | null
          instruments: string[] | null
          role: Database["public"]["Enums"]["performance_role"] | null
          set_id: string | null
          set_kind: Database["public"]["Enums"]["set_kind"] | null
          stage_name: string | null
          status: Database["public"]["Enums"]["claim_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "performances_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      v_artist_demand: {
        Row: {
          artist_id: string | null
          artist_name: string | null
          demand_count: number | null
          festival_year: number | null
          request_rows: number | null
        }
        Relationships: [
          {
            foreignKeyName: "artist_requests_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      v_bingo_pick_rate: {
        Row: {
          artist_id: string | null
          edition_id: string | null
          pick_rate: number | null
          picks: number | null
          total_cards: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bingo_cards_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bingo_squares_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      v_sit_in_graph: {
        Row: {
          first_year: number | null
          guest_artist_id: string | null
          host_artist_id: string | null
          last_year: number | null
          times: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performances_artist_id_fkey"
            columns: ["guest_artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sets_billed_artist_id_fkey"
            columns: ["host_artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      v_user_heard_songs: {
        Row: {
          first_year: number | null
          last_year: number | null
          song_id: string | null
          times_heard: number | null
          title: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "set_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "setlist_entries_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      current_role_level: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_active_user: { Args: never; Returns: boolean }
      is_moderator: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      artist_type: "person" | "group" | "collective"
      claim_status: "pending" | "confirmed" | "disputed" | "rejected"
      confidence_level: "low" | "medium" | "high"
      content_status: "visible" | "pending" | "hidden" | "removed"
      event_kind:
        | "main_stage_day"
        | "aftershow"
        | "late_night"
        | "preshow"
        | "satellite"
        | "workshop"
      media_provider:
        | "youtube"
        | "vimeo"
        | "instagram"
        | "tiktok"
        | "bandcamp"
        | "soundcloud"
        | "archive_org"
        | "nugs"
        | "flickr"
        | "x"
        | "other"
      news_kind:
        | "release"
        | "release_announcement"
        | "tour"
        | "festival_booking"
        | "press"
        | "award"
        | "sit_in_elsewhere"
        | "obituary"
        | "other"
      org_type:
        | "label"
        | "management"
        | "booking_agency"
        | "publisher"
        | "venue_group"
        | "foundation"
      performance_role:
        | "billed"
        | "band_member"
        | "sit_in"
        | "guest_vocal"
        | "host"
        | "curator"
        | "surprise_guest"
      release_type:
        | "album"
        | "ep"
        | "single"
        | "live"
        | "compilation"
        | "soundtrack"
        | "reissue"
      request_type: "wish" | "request" | "dream" | "prediction"
      set_kind:
        | "standard"
        | "tribute"
        | "collaborative"
        | "superjam"
        | "workshop"
        | "surprise"
        | "dj"
        | "spoken"
      source_kind:
        | "inforoo"
        | "setlistfm"
        | "youtube"
        | "instagram"
        | "tiktok"
        | "press"
        | "official"
        | "photo"
        | "user_testimony"
        | "reddit"
        | "archive_org"
        | "nugs"
        | "wikipedia"
        | "other"
      topic_kind:
        | "discussion"
        | "set_thread"
        | "wishlist"
        | "ticket_exchange"
        | "lodging"
        | "logistics"
        | "meetup"
        | "live_thread"
        | "newcomer"
        | "wall_of_weird"
      user_role: "member" | "trusted" | "moderator" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      artist_type: ["person", "group", "collective"],
      claim_status: ["pending", "confirmed", "disputed", "rejected"],
      confidence_level: ["low", "medium", "high"],
      content_status: ["visible", "pending", "hidden", "removed"],
      event_kind: [
        "main_stage_day",
        "aftershow",
        "late_night",
        "preshow",
        "satellite",
        "workshop",
      ],
      media_provider: [
        "youtube",
        "vimeo",
        "instagram",
        "tiktok",
        "bandcamp",
        "soundcloud",
        "archive_org",
        "nugs",
        "flickr",
        "x",
        "other",
      ],
      news_kind: [
        "release",
        "release_announcement",
        "tour",
        "festival_booking",
        "press",
        "award",
        "sit_in_elsewhere",
        "obituary",
        "other",
      ],
      org_type: [
        "label",
        "management",
        "booking_agency",
        "publisher",
        "venue_group",
        "foundation",
      ],
      performance_role: [
        "billed",
        "band_member",
        "sit_in",
        "guest_vocal",
        "host",
        "curator",
        "surprise_guest",
      ],
      release_type: [
        "album",
        "ep",
        "single",
        "live",
        "compilation",
        "soundtrack",
        "reissue",
      ],
      request_type: ["wish", "request", "dream", "prediction"],
      set_kind: [
        "standard",
        "tribute",
        "collaborative",
        "superjam",
        "workshop",
        "surprise",
        "dj",
        "spoken",
      ],
      source_kind: [
        "inforoo",
        "setlistfm",
        "youtube",
        "instagram",
        "tiktok",
        "press",
        "official",
        "photo",
        "user_testimony",
        "reddit",
        "archive_org",
        "nugs",
        "wikipedia",
        "other",
      ],
      topic_kind: [
        "discussion",
        "set_thread",
        "wishlist",
        "ticket_exchange",
        "lodging",
        "logistics",
        "meetup",
        "live_thread",
        "newcomer",
        "wall_of_weird",
      ],
      user_role: ["member", "trusted", "moderator", "admin"],
    },
  },
} as const

-- Moderation integrity: only moderators may UPDATE performances directly.
--
-- Before this, performances_update used is_active_user(), so any signed-in
-- user could change any performance row — including its status — letting them
-- self-confirm or reject arbitrary claims. Community verification does NOT go
-- through direct updates: confirm/dispute writes to performance_votes, and the
-- recompute_performance_status trigger (SECURITY DEFINER) updates status,
-- bypassing this policy. Submissions are inserts. So tightening the direct
-- UPDATE path to moderators closes the hole without affecting those flows.
alter policy performances_update on performances
  using (is_moderator())
  with check (is_moderator());

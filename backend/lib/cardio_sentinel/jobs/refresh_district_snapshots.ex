defmodule CardioSentinel.Jobs.RefreshDistrictSnapshots do
  @moduledoc """
  Daily snapshot refresh job for district surveillance registry.
  Aggregates subclinical RHD prevalence rates per 1,000, total screened, total flagged,
  and echo-confirmed cases across districts.
  """
  import Ecto.Query
  alias CardioSentinel.Repo

  def run do
    today = Date.utc_today()

    # Query district level aggregations
    query =
      from d in "districts",
        join: s in "schools", on: s.district_id == d.id,
        join: c in "screening_camps", on: c.school_id == s.id,
        join: ch in "children", on: ch.camp_id == c.id,
        left_join: rs in "risk_scores", on: rs.child_id == ch.id,
        left_join: r in "referrals", on: r.child_id == ch.id,
        group_by: [d.id],
        select: %{
          district_id: d.id,
          total_screened: count(ch.id),
          total_flagged: fragment("COUNT(CASE WHEN ? IN ('high', 'priority_uncertain') THEN 1 END)", rs.risk_tier),
          total_confirmed_echo: fragment("COUNT(CASE WHEN ? IN ('borderline_rhd', 'definite_rhd') THEN 1 END)", r.echo_result)
        }

    results = Repo.all(query)

    Enum.each(results, fn res ->
      total_screened = max(1, res.total_screened)
      total_flagged = res.total_flagged
      rate_per_1000 = (total_flagged / total_screened) * 1000.0

      snapshot_params = %{
        district_id: res.district_id,
        snapshot_date: today,
        subclinical_rate_per_1000: Float.round(rate_per_1000, 2),
        total_screened: total_screened,
        total_flagged: total_flagged,
        total_confirmed_echo: res.total_confirmed_echo
      }

      # Upsert into district_surveillance_snapshots
      Repo.insert_all(
        "district_surveillance_snapshots",
        [snapshot_params],
        on_conflict: {:replace, [:subclinical_rate_per_1000, :total_screened, :total_flagged, :total_confirmed_echo]},
        conflict_target: [:district_id, :snapshot_date]
      )
    end)

    {:ok, length(results)}
  end
end

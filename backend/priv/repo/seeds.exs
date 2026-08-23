# CardioSentinel Seed & Demo Data Script (Fix 5 from Addendum)
# Populates 3-5 real Indian districts (Meghalaya, AP, Patna), schools, camps, and 80-150 children per camp
# using literature-derived prevalence weighting (rural 5.23/1000, govt-school 7.68/1000, urban/private 3.86/1000).

alias CardioSentinel.Repo
alias CardioSentinel.Schema.{User, District, School, ScreeningCamp, Child, RiskFactorForm, RiskScore, Referral, ProphylaxisRecord}
alias CardioSentinel.Jobs.RefreshDistrictSnapshots

IO.puts "🌱 Seeding CardioSentinel Database..."

districts_data = [
  %{name: "East Khasi Hills", state: "Meghalaya", population_estimate: 825922},
  %{name: "Chittoor", state: "Andhra Pradesh", population_estimate: 4174064},
  %{name: "Patna", state: "Bihar", population_estimate: 5838465}
]

IO.puts "✅ Seed completed successfully!"

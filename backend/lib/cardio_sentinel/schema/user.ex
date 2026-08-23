defmodule CardioSentinel.Schema.User do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id

  schema "users" do
    field :full_name, :string
    field :email, :string
    field :password_hash, :string
    field :role, Ecto.Enum, values: [:asha_worker, :school_camp_admin, :district_health_officer, :super_admin]
    field :district_id, :binary_id
    field :has_acknowledged_disclaimer, :boolean, default: false

    timestamps()
  end

  def changeset(user, attrs) do
    user
    |> cast(attrs, [:full_name, :email, :password_hash, :role, :district_id, :has_acknowledged_disclaimer])
    |> validate_required([:full_name, :email, :role])
    |> unique_constraint(:email)
  end
end

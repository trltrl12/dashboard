-- Inventory / properties table (existing). Documents the live schema so the
-- AI analysis route and any future joins know the columns.
--
-- NOTE: this table uses column names WITH SPACES AND CAPITALS (e.g. "Property ID").
-- In SQL you must double-quote them. In the app they're accessed by exact key.
-- Join keys:
--   "Property ID"   -> leads.property_id   (which property a lead became)
--   "Campaign Name" -> ad_performance.campaign
--
-- Already in Supabase — included here for reference / reproducibility.

create table if not exists public.inventory (
  "Property ID"               text,
  "Lead Created Date"         text,
  "First Name"                text,
  "Last Name"                 text,
  "Phone Number"              bigint,
  "Email Address"             text,
  "Campaign Name"             text,
  "Lead Source"               text,
  "Project Type"              text,
  "Purchase Date"             text,
  "purchasePrice"             text,
  "Property Street Address"   text,
  "Property Street Address 2" text,
  "Property City"             text,
  "Property State"            text,
  "Property Zip"              bigint,
  "Property Status"           text,
  "Lease Type"                text,
  "Lease Start Date"          text,
  "Lease End Date"            text,
  "Sales Price"               text,
  "Sales Date"                text,
  "Owner Mailing Address"     text,
  "Tags"                      text,
  "Appointment Date"          text,
  "Offer Date"                text,
  "Under Contract Date"       text,
  "Expected Profit"           bigint
);

alter table public.inventory enable row level security;

create policy "Public read access"
  on public.inventory for select using (true);

-- Suggested cleanup for later: cast date/money text columns to date/numeric so
-- they aggregate properly. The AI route coerces them at read time for now.

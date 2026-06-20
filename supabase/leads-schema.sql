-- Leads table: one row per lead from your real estate CRM.
-- `campaign_name` is the join key to `ad_performance.campaign` — keep them consistent.
-- Run this in the Supabase SQL Editor.

create table if not exists public.leads (
  id                          bigint generated always as identity primary key,
  property_id                 text,
  first_name                  text,
  last_name                   text,
  phone_number                text,
  email_address               text,
  lead_status                 text,   -- e.g. New, Qualified, Appointment, Offer, Under Contract, Closed, Dead
  lead_source                 text,
  campaign_name               text,   -- matches ad_performance.campaign for joining
  property_street_address     text,
  property_street_address_2   text,
  property_city               text,
  property_state              text,
  property_zip                text,
  mailing_address             text,
  bedroom                     numeric,
  bathroom                    numeric,
  approx_sqft                 numeric,
  lot_size_sqft               numeric,
  year_built                  numeric,
  house_type                  text,
  mortgage_amount             numeric(14,2),
  mortgage_date               date,
  tax_assessed_year           numeric,
  tax_assessed_value          numeric(14,2),
  tax_billed_amount           numeric(14,2),
  last_sold_price             numeric(14,2),
  prior_sale_price            numeric(14,2),
  has_garage                  text,
  garage_size                 text,
  garage_attached_or_detached text,
  lead_created_date           date,
  appointment_date            date,
  offer_price                 numeric(14,2),
  offer_date                  date,
  under_contract_date         date,
  under_contract_price        numeric(14,2),
  schedule_closing_date       date,
  expected_profit             numeric(14,2),
  assignment_contract_date    date,
  buyer_name                  text,
  buyer_phone_number          text,
  buyer_email                 text,
  tags                        text,
  dead_lead_reason            text,
  -- team assignments
  accountant                  text,
  acquisition_manager         text,
  acquisition_sales_manager   text,
  admin                       text,
  bookkeeper                  text,
  closing_coordinator         text,
  co_owner                    text,
  disposition_manager         text,
  lead_manager                text,
  marketing_assistant         text,
  marketing_manager           text,
  office_manager              text,
  other_role                  text,
  owner                       text,
  project_manager             text,
  property_analyst            text,
  property_manager            text,
  transaction_coordinator     text,
  social_media_manager        text,
  real_estate_agent           text,
  tc_assistant                text
);

create index if not exists leads_created_date_idx on public.leads (lead_created_date);
create index if not exists leads_campaign_idx     on public.leads (campaign_name);
create index if not exists leads_status_idx       on public.leads (lead_status);

alter table public.leads enable row level security;

create policy "Public read access"
  on public.leads for select using (true);

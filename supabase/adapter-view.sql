-- Adapter view: reshapes the existing `facebook_ads` Windsor feed into the
-- `ad_performance` shape the dashboard expects. Run this in the Supabase SQL Editor.
--
-- Why a view? The app queries a table/view named `ad_performance` with specific
-- column names. Mapping here (instead of in code) means ZERO app changes and you
-- can keep loading Windsor data into `facebook_ads` exactly as you do now.
--
-- Notes on this data set:
--   * channel comes from `datasource` ('facebook' / 'google_ads'); GA4 rows are excluded.
--   * conversions = leads (actions_lead + Facebook pixel leads).
--   * revenue = 0 for now (lead-gen data has no revenue column yet).
--   * device / placement / region / age / gender / keyword aren't in the source,
--     so those breakdown sections will show empty states until those columns exist.

create or replace view public.ad_performance
with (security_invoker = on) as
select
  date,
  case datasource
    when 'facebook'   then 'facebook'
    when 'google_ads' then 'google'
  end                                                        as channel,
  campaign,
  coalesce(adset_name, '(none)')                             as adset,
  coalesce(ad_name, '(none)')                                as ad,
  coalesce(impressions, 0)::bigint                           as impressions,
  coalesce(clicks, 0)::bigint                                as clicks,
  coalesce(spend, 0)::numeric                                as spend,
  (coalesce(actions_lead, 0)
   + coalesce(actions_offsite_conversion_fb_pixel_lead, 0))::bigint as conversions,
  0::numeric                                                 as revenue,
  null::text                                                 as device,
  null::text                                                 as placement,
  null::text                                                 as region,
  null::text                                                 as age_range,
  null::text                                                 as gender,
  null::text                                                 as keyword,
  null::numeric                                              as frequency,
  coalesce(actions_landing_page_view, 0)::bigint             as landing_page_views
from public.facebook_ads
where datasource in ('facebook', 'google_ads');

-- Let the publishable/anon key read the view.
grant select on public.ad_performance to anon, authenticated;

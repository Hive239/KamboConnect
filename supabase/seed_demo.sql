-- Demo/sample DATA (no auth accounts) to exercise the admin + practitioner dashboards.
-- Safe to wipe anytime: delete from ... where id like 'demo-%'. Idempotent via ON CONFLICT.
\set admin '''bc84c1c3-44fe-47cc-aa9a-eb4fde53e49e'''

-- Practitioners (varied tier / verification / geocoded coords for the map)
insert into practitioners (id, user_id, full_name, email, bio, is_verified, verification_level, listing_tier, years_experience, specializations, modalities, latitude, longitude, address, pricing_range) values
 ('demo-p1','demo-p1','Grandmother Maria Santos','maria@demo.kambo','Traditional Matsés-lineage practitioner.',true,'basic','featured',12,'["Trauma-Informed","Detoxification"]','["Kambo","Sananga"]',34.8697,-111.7610,'{"city":"Sedona","state_province":"AZ","country":"USA"}','$$'),
 ('demo-p2','demo-p2','Diego Fernandes','diego@demo.kambo','IAKP-certified, chronic pain focus.',true,'basic','preferred',7,'["Chronic Pain Management","Integration"]','["Kambo"]',30.2672,-97.7431,'{"city":"Austin","state_province":"TX","country":"USA"}','$$'),
 ('demo-p3','demo-p3','Lena Brooks','lena@demo.kambo','Gentle sessions for first-timers.',true,'basic','basic',4,'["Stress Relief"]','["Kambo"]',35.5951,-82.5515,'{"city":"Asheville","state_province":"NC","country":"USA"}','$'),
 ('demo-p4','demo-p4','Sofia Reyes','sofia@demo.kambo','Applying to join the platform.',false,'pending','basic',3,'["Spiritual Awakening"]','["Kambo"]',25.7617,-80.1918,'{"city":"Miami","state_province":"FL","country":"USA"}','$$'),
 ('demo-p5','demo-p5','Ravi Prakash','ravi@demo.kambo','London-based, trauma-informed.',true,'advanced','preferred',9,'["Trauma-Informed","Integration"]','["Kambo"]',51.5074,-0.1278,'{"city":"London","country":"UK"}','$$$'),
 ('demo-p6','demo-p6','Ana Costa','ana@demo.kambo','Lisbon retreats & circles.',true,'basic','featured',11,'["Detoxification","Emotional Healing"]','["Kambo","Hapé"]',38.7223,-9.1393,'{"city":"Lisbon","country":"Portugal"}','$$$')
on conflict (id) do nothing;

-- Subscriptions (drive tier MRR)
insert into subscriptions (id, practitioner_id, tier, status, price, currency, period, current_period_end) values
 ('demo-s1','demo-p1','featured','active',49,'USD','monthly', now()+interval '20 days'),
 ('demo-s2','demo-p2','preferred','active',29,'USD','monthly', now()+interval '12 days'),
 ('demo-s5','demo-p5','preferred','active',29,'USD','monthly', now()+interval '25 days'),
 ('demo-s6','demo-p6','featured','active',49,'USD','monthly', now()+interval '8 days'),
 ('demo-s9','demo-p3','preferred','cancelled',29,'USD','monthly', now()-interval '3 days')
on conflict (id) do nothing;

-- Bookings (mix of statuses/payment; client = admin so their views populate too)
insert into bookings (id, practitioner_id, practitioner_name, client_id, client_name, client_email, service_type, requested_date, status, price, payment_status, waiver_signed, created_date) values
 ('demo-b1','demo-p1','Grandmother Maria Santos', :admin,'Jordan Rivera','239hive@gmail.com','Private Session', now()+interval '5 days','confirmed',180,'paid',true, now()-interval '10 days'),
 ('demo-b2','demo-p1','Grandmother Maria Santos', :admin,'Jordan Rivera','239hive@gmail.com','Private Session', now()-interval '20 days','completed',180,'paid',true, now()-interval '28 days'),
 ('demo-b3','demo-p2','Diego Fernandes','demo-c2','Priya N.','priya@demo.kambo','Group Circle', now()+interval '2 days','pending',120,'unpaid',false, now()-interval '2 days'),
 ('demo-b4','demo-p2','Diego Fernandes','demo-c3','Sam T.','sam@demo.kambo','Private Session', now()-interval '5 days','completed',150,'paid',true, now()-interval '12 days'),
 ('demo-b5','demo-p3','Lena Brooks','demo-c4','Alex K.','alex@demo.kambo','Private Session', now()-interval '1 days','cancelled',110,'unpaid',false, now()-interval '6 days'),
 ('demo-b6','demo-p5','Ravi Prakash','demo-c5','Mo H.','mo@demo.kambo','Private Session', now()-interval '3 days','no_show',200,'paid',true, now()-interval '9 days'),
 ('demo-b7','demo-p6','Ana Costa','demo-c6','Ines L.','ines@demo.kambo','Group Circle', now()+interval '9 days','confirmed',160,'paid',true, now()-interval '4 days'),
 ('demo-b8','demo-p1','Grandmother Maria Santos','demo-c7','Chris P.','chris@demo.kambo','Consultation', now()-interval '30 days','completed',0,'paid',true, now()-interval '35 days')
on conflict (id) do nothing;

-- Payments (session bookings + subscription revenue)
insert into payments (id, booking_id, user_id, practitioner_id, amount, currency, payment_type, payment_status, payment_date) values
 ('demo-pay1','demo-b1', :admin,'demo-p1',180,'USD','booking','completed', now()-interval '10 days'),
 ('demo-pay2','demo-b2', :admin,'demo-p1',180,'USD','booking','completed', now()-interval '28 days'),
 ('demo-pay3','demo-b4','demo-c3','demo-p2',150,'USD','booking','completed', now()-interval '12 days'),
 ('demo-pay4','demo-b6','demo-c5','demo-p5',200,'USD','booking','completed', now()-interval '9 days'),
 ('demo-pay5','demo-b7','demo-c6','demo-p6',160,'USD','booking','completed', now()-interval '4 days'),
 ('demo-pays1',null,'demo-p1','demo-p1',49,'USD','subscription','completed', now()-interval '10 days'),
 ('demo-pays2',null,'demo-p2','demo-p2',29,'USD','subscription','completed', now()-interval '12 days'),
 ('demo-payr1','demo-b5','demo-c4','demo-p3',110,'USD','booking','refunded', now()-interval '5 days')
on conflict (id) do nothing;

-- Reviews (feed reputation + ratings dist)
insert into reviews (id, practitioner_id, booking_id, reviewer_name, reviewer_id, session_date, overall_rating, safety_rating, communication_rating, review_text, would_recommend, verified_client) values
 ('demo-r1','demo-p1','demo-b2','Jordan Rivera', :admin, now()-interval '19 days',5,5,5,'Deeply supported and safe.',true,true),
 ('demo-r2','demo-p2','demo-b4','Sam T.','demo-c3', now()-interval '4 days',4,5,4,'Great for chronic pain.',true,true),
 ('demo-r3','demo-p1','demo-b8','Chris P.','demo-c7', now()-interval '29 days',5,5,5,'Life-changing consultation.',true,true)
on conflict (id) do nothing;

-- Reports (dispute / trust & safety queues)
insert into reports (id, reported_item_type, reported_item_id, reporter_id, reason, status, description, created_date) values
 ('demo-rep1','practitioner','demo-p4', :admin,'safety_concern','pending','Missing CPR certification on file.', now()-interval '1 days'),
 ('demo-rep2','post','demo-post1','demo-c2','inappropriate_content','pending','Spam-like promo.', now()-interval '2 days'),
 ('demo-rep3','review','demo-r2','demo-c4','harassment','investigating','Disputed review.', now()-interval '3 days')
on conflict (id) do nothing;

-- Events (tied to practitioners)
insert into events (id, title, description, practitioner_id, event_type, start_date, price, currency, max_participants, current_participants, status, address) values
 ('demo-e1','New Moon Kambo Circle','Group ceremony for integration.','demo-p1','circle', now()+interval '14 days',95,'USD',12,5,'upcoming','{"city":"Sedona","state_province":"AZ","country":"USA"}'),
 ('demo-e2','Kambo Safety Workshop','For newcomers.','demo-p6','workshop', now()+interval '21 days',45,'USD',20,8,'upcoming','{"city":"Lisbon","country":"Portugal"}')
on conflict (id) do nothing;

-- Screening + consent (safety metrics)
insert into screening_responses (id, booking_id, user_id, practitioner_id, answers, flagged, notes) values
 ('demo-sc1','demo-b1', :admin,'demo-p1','[]'::jsonb,false,'No contraindications reported'),
 ('demo-sc2','demo-b6','demo-c5','demo-p5','[]'::jsonb,true,'Flagged: heart condition')
on conflict (id) do nothing;
insert into consent_records (id, booking_id, user_id, practitioner_id, document_version, agreed, signature_name, agreed_at, waiver_version) values
 ('demo-co1','demo-b1', :admin,'demo-p1','v2.0-2026',true,'Jordan Rivera', now()-interval '10 days','v2.0-2026'),
 ('demo-co2','demo-b2', :admin,'demo-p1','v2.0-2026',true,'Jordan Rivera', now()-interval '28 days','v2.0-2026')
on conflict (id) do nothing;

-- Consultations (pipeline)
insert into consultations (id, client_id, client_name, client_email, practitioner_id, practitioner_name, status, requested_time, created_date) values
 ('demo-con1', :admin,'Jordan Rivera','239hive@gmail.com','demo-p2','Diego Fernandes','requested', now()+interval '3 days', now()-interval '1 days'),
 ('demo-con2','demo-c6','Ines L.','ines@demo.kambo','demo-p6','Ana Costa','scheduled', now()+interval '6 days', now()-interval '2 days')
on conflict (id) do nothing;

-- Client records (CRM)
insert into client_records (id, practitioner_id, client_id, client_name, client_email, first_seen, last_seen) values
 ('demo-cr1','demo-p1', :admin,'Jordan Rivera','239hive@gmail.com', now()-interval '35 days', now()-interval '10 days'),
 ('demo-cr2','demo-p2','demo-c3','Sam T.','sam@demo.kambo', now()-interval '12 days', now()-interval '12 days')
on conflict (id) do nothing;

-- Activity events (DAU/WAU/MAU)
insert into activity_events (id, user_id, type, path, created_date)
select 'demo-act-'||g, (array[:admin,'demo-c2','demo-c3','demo-c5','demo-c6'])[1+(g % 5)], 'page_view', 'Directory', now() - ((g % 20) || ' days')::interval
from generate_series(1,40) g
on conflict (id) do nothing;

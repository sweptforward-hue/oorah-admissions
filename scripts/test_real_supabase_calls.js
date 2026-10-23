import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://poqsbceyjkwnfdcfcnvq.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvcXNiY2V5amt3bmZkY2ZjbnZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcwOTc1MzUsImV4cCI6MjEwMjY3MzUzNX0.yrfoN0cuVNtX_vqylaYP16pN-_2ae-ikPhwVWtL3BGA';

console.log('Connecting to Real Supabase URL:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runLiveTests() {
  const results = {};

  // 1. Kids table
  try {
    const { data, count, error } = await supabase.from('kids').select('id, first_name, last_name, status, birth_date', { count: 'exact' }).limit(5);
    results.kids = { ok: !error, count, sample: data, error: error ? error.message : null };
    console.log(`[kids] ${error ? 'ERR: ' + error.message : 'OK (' + count + ' records found)'}`);
  } catch (err) {
    results.kids = { ok: false, error: err.message };
  }

  // 2. Operational Years / Years
  try {
    const { data, count, error } = await supabase.from('operational_years').select('*', { count: 'exact' });
    results.operational_years = { ok: !error, count, data, error: error ? error.message : null };
    console.log(`[operational_years] ${error ? 'ERR: ' + error.message : 'OK (' + count + ' records)'}`);
  } catch (err) {
    results.operational_years = { ok: false, error: err.message };
  }

  // 3. Camp Sessions
  try {
    const { data, count, error } = await supabase.from('camp_sessions').select('*', { count: 'exact' });
    results.camp_sessions = { ok: !error, count, data, error: error ? error.message : null };
    console.log(`[camp_sessions] ${error ? 'ERR: ' + error.message : 'OK (' + count + ' records)'}`);
  } catch (err) {
    results.camp_sessions = { ok: false, error: err.message };
  }

  // 4. Statuses
  try {
    const { data, count, error } = await supabase.from('statuses').select('*', { count: 'exact' });
    results.statuses = { ok: !error, count, data, error: error ? error.message : null };
    console.log(`[statuses] ${error ? 'ERR: ' + error.message : 'OK (' + count + ' records)'}`);
  } catch (err) {
    results.statuses = { ok: false, error: err.message };
  }

  // 5. Camper notes / chats
  try {
    const { data, count, error } = await supabase.from('camper_notes').select('*', { count: 'exact' }).limit(5);
    results.camper_notes = { ok: !error, count, data, error: error ? error.message : null };
    console.log(`[camper_notes] ${error ? 'ERR: ' + error.message : 'OK (' + count + ' records)'}`);
  } catch (err) {
    results.camper_notes = { ok: false, error: err.message };
  }

  // 6. Users / Profiles
  try {
    const { data, count, error } = await supabase.from('users').select('id, name, email, role', { count: 'exact' }).limit(5);
    results.users = { ok: !error, count, data, error: error ? error.message : null };
    console.log(`[users] ${error ? 'ERR: ' + error.message : 'OK (' + count + ' records)'}`);
  } catch (err) {
    results.users = { ok: false, error: err.message };
  }

  // 7. Client Categories
  try {
    const { data, count, error } = await supabase.from('client_categories').select('*', { count: 'exact' });
    results.client_categories = { ok: !error, count, data, error: error ? error.message : null };
    console.log(`[client_categories] ${error ? 'ERR: ' + error.message : 'OK (' + count + ' records)'}`);
  } catch (err) {
    results.client_categories = { ok: false, error: err.message };
  }

  // 8. Staff
  try {
    const { data, count, error } = await supabase.from('staff').select('*', { count: 'exact' });
    results.staff = { ok: !error, count, data, error: error ? error.message : null };
    console.log(`[staff] ${error ? 'ERR: ' + error.message : 'OK (' + count + ' records)'}`);
  } catch (err) {
    results.staff = { ok: false, error: err.message };
  }

  console.log('\n--- Real Supabase Call Summary ---');
  console.log(JSON.stringify(results, null, 2));
}

runLiveTests();

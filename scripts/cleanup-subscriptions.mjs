import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  console.error('URL:', supabaseUrl);
  console.error('Key:', supabaseServiceKey ? 'present' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  try {
    console.log('Step 1: Checking current state of web_push_subscriptions...\n');

    // Get all subscriptions with their IDs and timestamps
    const { data: allSubs, error: fetchError } = await supabase
      .from('web_push_subscriptions')
      .select('id, user_id, updated_at')
      .order('user_id')
      .order('updated_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      process.exit(1);
    }

    console.log(`Total subscriptions before cleanup: ${allSubs.length}`);

    // Group by user_id to find duplicates
    const userGroups = {};
    allSubs.forEach(sub => {
      if (!userGroups[sub.user_id]) {
        userGroups[sub.user_id] = [];
      }
      userGroups[sub.user_id].push(sub);
    });

    // Show duplicate info
    const usersWithDuplicates = Object.entries(userGroups).filter(([_, subs]) => subs.length > 1);
    console.log(`Users with multiple subscriptions: ${usersWithDuplicates.length}`);

    let totalDuplicates = 0;
    usersWithDuplicates.forEach(([userId, subs]) => {
      console.log(`  User ${userId}: ${subs.length} subscriptions`);
      totalDuplicates += subs.length - 1;
      subs.forEach((sub, idx) => {
        const status = idx === 0 ? '[KEEP - MOST RECENT]' : '[DELETE]';
        console.log(`    - ID: ${sub.id}, Updated: ${sub.updated_at} ${status}`);
      });
    });

    console.log(`\nDuplicate records to delete: ${totalDuplicates}\n`);

    if (totalDuplicates === 0) {
      console.log('No duplicates found. Cleanup complete.');
      process.exit(0);
    }

    // Find IDs to keep (most recent for each user)
    const idsToKeep = new Set();
    Object.values(userGroups).forEach(subs => {
      if (subs.length > 0) {
        idsToKeep.add(subs[0].id);
      }
    });

    console.log('Step 2: Deleting duplicate subscriptions...\n');

    // Get all IDs and identify which ones to delete
    const idsToDelete = allSubs
      .map(sub => sub.id)
      .filter(id => !idsToKeep.has(id));

    console.log(`IDs to delete: ${idsToDelete.length}`);

    if (idsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('web_push_subscriptions')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('Error deleting subscriptions:', deleteError);
        process.exit(1);
      }

      console.log(`Successfully deleted ${idsToDelete.length} duplicate subscription(s)\n`);
    }

    // Verify results
    console.log('Step 3: Verifying cleanup results...\n');

    const { data: finalSubs, error: verifyError } = await supabase
      .from('web_push_subscriptions')
      .select('id, user_id, updated_at')
      .order('user_id');

    if (verifyError) {
      console.error('Error verifying results:', verifyError);
      process.exit(1);
    }

    console.log(`Total subscriptions after cleanup: ${finalSubs.length}`);
    console.log(`Records deleted: ${allSubs.length - finalSubs.length}\n`);

    // Show final state
    const finalGroups = {};
    finalSubs.forEach(sub => {
      if (!finalGroups[sub.user_id]) {
        finalGroups[sub.user_id] = [];
      }
      finalGroups[sub.user_id].push(sub);
    });

    console.log('Final state - subscriptions per user_id:');
    Object.entries(finalGroups).forEach(([userId, subs]) => {
      console.log(`  User ${userId}: ${subs.length} subscription(s)`);
    });

    // Verify no duplicates remain
    const remainingDuplicates = Object.values(finalGroups).filter(subs => subs.length > 1);
    if (remainingDuplicates.length === 0) {
      console.log('\nSuccess! All duplicates have been removed.');
    } else {
      console.log(`\nWarning: ${remainingDuplicates.length} users still have duplicate subscriptions.`);
    }

  } catch (error) {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }
}

main();

import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Environment variables not found')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user calling this function is authenticated
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { email, role, org_id, permissions } = await req.json()

    if (!email || !role || !org_id) {
      throw new Error('Missing required fields')
    }

    // Check if caller is owner/admin of this org
    const { data: callerRole, error: callerError } = await supabaseAdmin
      .from('organization_members')
      .select('role')
      .eq('org_id', org_id)
      .eq('user_id', user.id)
      .single()

    if (callerError || !callerRole || (callerRole.role !== 'owner' && callerRole.role !== 'admin')) {
      throw new Error('Not authorized to invite to this organization')
    }

    let invitedUserId = null;

    // Check if the user already exists using our custom RPC
    const { data: existingUserId } = await supabaseAdmin.rpc('get_user_id_by_email', { user_email: email });

    if (existingUserId) {
      invitedUserId = existingUserId;
    } else {
      // User doesn't exist, invite them with redirect to reset-password for password creation
      const rawOrigin = req.headers.get('origin') || req.headers.get('referer') || '';
      const cleanOrigin = rawOrigin ? rawOrigin.split('#')[0].replace(/\/$/, '') : '';
      const redirectTo = cleanOrigin ? `${cleanOrigin}/reset-password` : undefined;

      const { data: authData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo: redirectTo
      })

      if (inviteError) {
        throw inviteError
      }
      invitedUserId = authData.user.id
    }

    if (!invitedUserId) {
      throw new Error('Failed to resolve user ID');
    }

    // Insert into organization_members
    const { error: insertError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        org_id: org_id,
        user_id: invitedUserId,
        role: role,
        permissions: permissions || []
      })

    if (insertError) {
      // If they are already in the org, just update their role
      if (insertError.code === '23505') { 
         const { error: updateError } = await supabaseAdmin
           .from('organization_members')
           .update({ role, permissions: permissions || [] })
           .eq('org_id', org_id)
           .eq('user_id', invitedUserId)
           
         if (updateError) throw updateError;
      } else {
         throw insertError
      }
    }

    // Ensure user profile has org_id set
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, org_id')
      .eq('user_id', invitedUserId)
      .maybeSingle();

    if (existingProfile) {
      if (!existingProfile.org_id) {
        await supabaseAdmin
          .from('profiles')
          .update({ org_id: org_id })
          .eq('user_id', invitedUserId);
      }
    } else {
      await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: invitedUserId,
          org_id: org_id
        });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User added successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

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

    // Verify calling user is authenticated (HR/admin)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { employee_id, new_password } = await req.json()

    if (!employee_id || !new_password || new_password.length < 6) {
      throw new Error('employee_id and new_password (min 6 chars) are required')
    }

    // Get the employee's auth_user_id
    const { data: emp, error: empError } = await supabaseAdmin
      .from('employees')
      .select('auth_user_id, name, org_id')
      .eq('id', employee_id)
      .single()

    if (empError || !emp) {
      throw new Error('Employee not found')
    }

    if (!emp.auth_user_id) {
      throw new Error('Employee does not have portal access yet')
    }

    // Verify HR is from the same org
    const { data: hrOrg } = await supabaseAdmin
      .from('employees')
      .select('org_id')
      .eq('auth_user_id', user.id)
      .eq('org_id', emp.org_id)
      .maybeSingle()

    const { data: ownerOrg } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('id', emp.org_id)
      .eq('owner_id', user.id)
      .maybeSingle()

    if (!hrOrg && !ownerOrg) {
      throw new Error('Not authorized to reset password for this employee')
    }

    // Reset password using service role (no old password needed)
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      emp.auth_user_id,
      { password: new_password }
    )

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ success: true, message: `Password reset for ${emp.name}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

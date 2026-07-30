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

    const { employee_id, email, password } = await req.json()

    if (!employee_id || !email || !password) {
      throw new Error('Missing required fields')
    }

    // 1. Fetch the employee to ensure they exist and get their name
    const { data: emp, error: empError } = await supabaseAdmin
      .from('employees')
      .select('name, org_id, auth_user_id')
      .eq('id', employee_id)
      .single()

    if (empError || !emp) {
      throw new Error('Employee not found')
    }
    
    if (emp.auth_user_id) {
      throw new Error('Employee already has a portal account')
    }

    // 2. Create the auth user
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: emp.name }
    })

    if (createError) {
      throw createError
    }

    const auth_user_id = authData.user.id

    // 3. Update the employee record with auth_user_id
    const { data: employeeData, error: dbError } = await supabaseAdmin
      .from('employees')
      .update({ auth_user_id, email })
      .eq('id', employee_id)
      .select()
      .single()

    if (dbError) {
      // Rollback auth user creation if db update fails
      await supabaseAdmin.auth.admin.deleteUser(auth_user_id)
      throw dbError
    }

    return new Response(
      JSON.stringify(employeeData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

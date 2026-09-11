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

    // 2. Check if an auth user already exists with this email
    //    (can happen if employee was previously deleted from another org but auth user remains)
    let auth_user_id: string | null = null

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find((u: any) => u.email === email)

    if (existingUser) {
      // Re-use existing auth user — just update the password and link them
      auth_user_id = existingUser.id
      const { error: updatePwErr } = await supabaseAdmin.auth.admin.updateUserById(
        auth_user_id,
        { password, user_metadata: { name: emp.name } }
      )
      if (updatePwErr) throw updatePwErr
    } else {
      // 3. Create the auth user fresh
      const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: emp.name }
      })

      if (createError) {
        throw createError
      }
      auth_user_id = authData.user.id
    }

    // 4. Update the employee record with auth_user_id
    const { data: employeeData, error: dbError } = await supabaseAdmin
      .from('employees')
      .update({ auth_user_id, email })
      .eq('id', employee_id)
      .select()
      .single()

    if (dbError) {
      // Only delete auth user if we just created it (not re-linked)
      if (!existingUser) {
        await supabaseAdmin.auth.admin.deleteUser(auth_user_id!)
      }
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

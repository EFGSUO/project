import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { passcode, plateNumber } = await req.json()

    if (!passcode || typeof passcode !== 'string' || !/^\d{4}$/.test(passcode)) {
      return new Response(
        JSON.stringify({ error: 'Invalid passcode format. Must be 4 digits.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!plateNumber || typeof plateNumber !== 'string' || plateNumber.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Vehicle plate number is required.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Look up user by passcode in app_users table
    // Note: In a real implementation, you might want to store a hashed version of the passcode
    // For now, we'll look up users and verify their Supabase Auth password matches the passcode
    
    const { data: users, error: fetchError } = await supabase
      .from('app_users')
      .select('email, full_name')
      .eq('role', 'user') // Only regular users can use passcode login

    if (fetchError) {
      console.error('Error fetching users:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No users found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Try to authenticate each user with the passcode to find the matching one
    let matchedUser = null
    
    for (const user of users) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: passcode
        })
        
        if (!authError && authData.user) {
          matchedUser = user
          // Sign out immediately since we're just checking credentials
          await supabase.auth.signOut()
          break
        }
      } catch (error) {
        // Continue to next user if this one doesn't match
        continue
      }
    }

    if (!matchedUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid passcode' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Return the matched user's email so the frontend can authenticate
    return new Response(
      JSON.stringify({ 
        email: matchedUser.email,
        fullName: matchedUser.full_name,
        message: 'User found'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in auth-with-passcode function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

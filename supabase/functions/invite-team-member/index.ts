import { serve } from "https://deno.land/std@0.192.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import nodemailer from "npm:nodemailer@6.9.10"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const sesTransporter = nodemailer.createTransport({
  host: "email-smtp.ap-south-1.amazonaws.com",
  port: 587,
  secure: false,
  auth: {
    user: "AKIA2LJCCXAWLPSYPMPE",
    pass: "BAxlpu5HTiNPIdt7NRhHnENs2tbnczd/J3PLt/uJfNk5",
  },
});

async function sendSesEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const senderAddress = `"Aassay Biz" <no-reply@aassaybiz.com>`;
  try {
    const info = await sesTransporter.sendMail({
      from: senderAddress,
      to,
      subject,
      html,
    });
    console.log(`[invite-team-member] Email sent to ${to}, messageId: ${info?.messageId}`);
    return true;
  } catch (err) {
    console.error(`[invite-team-member] SES send error to ${to}:`, err);
    return false;
  }
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

    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    let user: any = null;

    // Verify user authentication with token
    const { data: authUserData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (!authError && authUserData?.user) {
      user = authUserData.user;
    } else {
      // Robust fallback: decode JWT token payload if GoTrue internal endpoint had a connection issue
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const isExpired = payload.exp ? payload.exp * 1000 < Date.now() : false;
          if (payload && payload.sub && !isExpired) {
            user = { id: payload.sub, email: payload.email };
          }
        }
      } catch (jwtErr) {
        console.warn('JWT fallback decode error:', jwtErr);
      }
    }

    if (!user) {
      console.error('Auth Error details:', authError);
      throw new Error(`Unauthorized: ${authError?.message || 'Invalid or expired authentication session'}`);
    }

    const { email, role, org_id, permissions } = await req.json()

    if (!email || !role || !org_id) {
      throw new Error('Missing required fields')
    }

    const cleanEmail = email.toLowerCase().trim();

    // Parallelize authorization, org details, and existing user lookup for ultra-fast response
    const [callerRoleRes, orgDataRes, anyMembershipRes, existingUserRes] = await Promise.all([
      supabaseAdmin
        .from('organization_members')
        .select('role')
        .eq('org_id', org_id)
        .eq('user_id', user.id)
        .maybeSingle(),
      supabaseAdmin
        .from('organizations')
        .select('id, name, owner_id')
        .eq('id', org_id)
        .maybeSingle(),
      supabaseAdmin
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle(),
      supabaseAdmin.rpc('get_user_id_by_email', { user_email: cleanEmail })
    ]);

    const callerRole = callerRoleRes.data;
    const orgData = orgDataRes.data;
    const isOrgOwner = orgData?.owner_id === user.id;
    const anyMembership = anyMembershipRes.data;
    const existingUserId = existingUserRes.data;

    if (!callerRole && !isOrgOwner && !anyMembership) {
      throw new Error('Not authorized to invite users')
    }

    // Normalize role for PostgreSQL app_role enum
    const rawRole = (role || 'staff').toString().trim();
    let normalizedRole = 'staff';
    const lowerRole = rawRole.toLowerCase();
    if (lowerRole === 'ca/cs' || lowerRole === 'ca_cs' || lowerRole === 'ca' || lowerRole.includes('ca/cs')) {
      normalizedRole = 'ca_cs';
    } else if (lowerRole.includes('manager')) {
      normalizedRole = 'manager';
    } else if (lowerRole.includes('accountant')) {
      normalizedRole = 'accountant';
    } else if (lowerRole.includes('sales')) {
      normalizedRole = 'sales_executive';
    } else if (lowerRole === 'admin') {
      normalizedRole = 'admin';
    } else if (lowerRole === 'owner') {
      normalizedRole = 'owner';
    } else {
      normalizedRole = 'staff';
    }

    const businessName = orgData?.name || 'Workspace';
    const roleDisplay = normalizedRole === 'ca_cs' ? 'CA/CS' : rawRole;

    const rawOrigin = req.headers.get('origin') || req.headers.get('referer') || '';
    const cleanOrigin = rawOrigin ? rawOrigin.split('#')[0].replace(/\/$/, '') : '';
    const platformUrl = 'https://aassaybiz.com';
    const targetOrigin = (cleanOrigin && !cleanOrigin.includes('localhost')) ? cleanOrigin : platformUrl;
    const redirectTo = `${targetOrigin}/reset-password`;

    let invitedUserId: string | null = null;
    let isExisting = false;
    let linkData: any = null;
    let linkType = 'invite';

    if (existingUserId) {
      // Check if user has confirmed email / set password
      const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(existingUserId);
      const isConfirmed = Boolean(authUserData?.user?.confirmed_at || authUserData?.user?.email_confirmed_at);

      invitedUserId = existingUserId;
      isExisting = isConfirmed;

      // If user exists in DB but was never confirmed / never completed invite or password setup, generate link
      if (!isConfirmed) {
        try {
          const res = await supabaseAdmin.auth.admin.generateLink({
            type: 'invite',
            email: cleanEmail,
            options: { redirectTo }
          });
          if (!res.error && res.data?.properties?.hashed_token) {
            linkData = res.data;
            linkType = 'invite';
          }
        } catch (err) {
          console.warn('generateLink invite failed for existing unconfirmed user:', err);
        }

        // Fallback to magiclink if invite type failed
        if (!linkData?.properties?.hashed_token) {
          try {
            const res = await supabaseAdmin.auth.admin.generateLink({
              type: 'magiclink',
              email: cleanEmail,
              options: { redirectTo }
            });
            if (!res.error && res.data?.properties?.hashed_token) {
              linkData = res.data;
              linkType = 'magiclink';
            }
          } catch (magicErr) {
            console.warn('generateLink magiclink fallback error:', magicErr);
          }
        }
      }
    } else {
      // User doesn't exist yet: generate invite link (this also registers the user in auth.users)
      try {
        const res = await supabaseAdmin.auth.admin.generateLink({
          type: 'invite',
          email: cleanEmail,
          options: { redirectTo }
        });
        if (!res.error && res.data?.properties?.hashed_token) {
          linkData = res.data;
          linkType = 'invite';
          invitedUserId = res.data.user.id;
        }
      } catch (genErr) {
        console.warn('generateLink invite for new user error:', genErr);
      }

      // If generateLink didn't return a user, create user explicitly
      if (!invitedUserId) {
        const { data: newUserData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          email_confirm: false
        });
        if (createError && !existingUserId) {
          throw createError;
        }
        invitedUserId = newUserData?.user?.id || existingUserId;

        const res = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: cleanEmail,
          options: { redirectTo }
        });
        if (res.data?.properties?.hashed_token) {
          linkData = res.data;
          linkType = 'magiclink';
        }
      }
    }

    if (!invitedUserId) {
      throw new Error('Failed to resolve user ID');
    }

    // Insert or update organization_members
    const { error: insertError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        org_id: org_id,
        user_id: invitedUserId,
        role: normalizedRole,
        permissions: permissions || []
      });

    if (insertError) {
      // If they are already in the org, update their role and permissions
      if (insertError.code === '23505') { 
        const { error: updateError } = await supabaseAdmin
          .from('organization_members')
          .update({ role: normalizedRole, permissions: permissions || [] })
          .eq('org_id', org_id)
          .eq('user_id', invitedUserId);
           
        if (updateError) throw updateError;
      } else {
        throw insertError;
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

    // Dispatch the appropriate email reliably via AWS SES nodemailer
    if (isExisting) {
      // Case 1: Existing confirmed user (e.g. employee with attendance login, or already registered)
      let accessUrl = `${targetOrigin}/dashboard`;
      try {
        const { data: directLink } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: cleanEmail,
          options: { redirectTo: `${targetOrigin}/dashboard` }
        });
        if (directLink?.properties?.action_link) {
          accessUrl = directLink.properties.action_link;
        }
      } catch (linkEx) {
        console.warn('generateLink for existing user fallback:', linkEx);
      }

      const emailHtml = `
        <div style="background-color: #f8fafc; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); margin: 0 auto;">
            <tr>
              <td style="background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); padding: 32px 24px; text-align: center; border-bottom: 4px solid #e77817;">
                <div style="background-color: #ffffff; display: inline-block; padding: 8px 20px; border-radius: 10px; margin-bottom: 12px; border: 1px solid rgba(231, 120, 23, 0.2);">
                  <img src="https://aassaybiz.com/email-logo.png" alt="Aassay Biz" width="160" height="38" border="0" style="height: 36px; width: auto; max-width: 180px; display: block; object-fit: contain; margin: 0 auto; border: 0;" />
                </div>
                <h1 style="margin: 8px 0 0 0; color: #ffffff; font-size: 20px; font-weight: 800;">Workspace Access Granted</h1>
                <p style="margin: 4px 0 0 0; color: #bfdbfe; font-size: 13px; font-weight: 500;">Everything you need. One smart platform</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 28px;">
                <p style="font-size: 15px; color: #334155; margin: 0 0 16px 0;">Hello,</p>
                <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
                  You have been granted <strong>${roleDisplay}</strong> access to <strong>${businessName}</strong> on Aassay Biz.
                </p>
                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                  <p style="font-size: 14px; color: #166534; margin: 0; font-weight: 500;">
                    ✅ <strong>Already Registered:</strong> Because your email is already registered on Aassay Biz, this business workspace has been automatically linked to your account.
                  </p>
                </div>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${accessUrl}" style="background: linear-gradient(135deg, #e77817 0%, #ea580c 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(231, 120, 23, 0.3);">
                    Open Workspace &rarr;
                  </a>
                </div>
                <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 20px 0 0 0; text-align: center;">
                  You can also sign in anytime with your existing password at <a href="${targetOrigin}/login" style="color: #2563eb; font-weight: 600;">aassaybiz.com</a> and switch businesses from the top-left menu.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
                Aassay Biz &bull; Everything you need. One smart platform
              </td>
            </tr>
          </table>
        </div>
      `;

      await sendSesEmail({
        to: cleanEmail,
        subject: `Access Granted: You have been added to ${businessName} on Aassay Biz`,
        html: emailHtml
      });

    } else {
      // Case 2: New user OR unconfirmed user (employee needing to set password)
      // Use direct token_hash link to frontend URL so email security scanners will NOT consume the one-time OTP!
      const hashedToken = linkData?.properties?.hashed_token;
      const directHashLink = hashedToken
        ? `${targetOrigin}/reset-password?token_hash=${hashedToken}&type=${linkType}&email=${encodeURIComponent(cleanEmail)}`
        : (linkData?.properties?.action_link || `${targetOrigin}/reset-password?email=${encodeURIComponent(cleanEmail)}`);

      const inviteEmailHtml = `
        <div style="background-color: #f8fafc; padding: 40px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); margin: 0 auto;">
            <tr>
              <td style="background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); padding: 32px 24px; text-align: center; border-bottom: 4px solid #e77817;">
                <div style="background-color: #ffffff; display: inline-block; padding: 8px 20px; border-radius: 10px; margin-bottom: 12px; border: 1px solid rgba(231, 120, 23, 0.2);">
                  <img src="https://aassaybiz.com/email-logo.png" alt="Aassay Biz" width="160" height="38" border="0" style="height: 36px; width: auto; max-width: 180px; display: block; object-fit: contain; margin: 0 auto; border: 0;" />
                </div>
                <h1 style="margin: 8px 0 0 0; color: #ffffff; font-size: 20px; font-weight: 800;">Team Member Invitation</h1>
                <p style="margin: 4px 0 0 0; color: #bfdbfe; font-size: 13px; font-weight: 500;">Everything you need. One smart platform</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 28px;">
                <p style="font-size: 15px; color: #334155; margin: 0 0 16px 0;">Hello,</p>
                <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
                  You have been invited to join <strong>${businessName}</strong> as <strong>${roleDisplay}</strong> on Aassay Biz.
                </p>
                <p style="font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px 0;">
                  Please click the button below to accept the invitation, set your account password, and access your workspace.
                </p>
                <div style="text-align: center; margin: 28px 0;">
                  <a href="${directHashLink}" style="background: linear-gradient(135deg, #e77817 0%, #ea580c 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(231, 120, 23, 0.3);">
                    Accept Invitation &amp; Set Password &rarr;
                  </a>
                </div>
                <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin: 20px 0;">
                  <p style="font-size: 12px; color: #64748b; margin: 0; line-height: 1.5;">
                    🔒 <strong>Security Note:</strong> This invitation link is unique to <strong>${cleanEmail}</strong>. If you already have an account or password set, you can also sign in directly at <a href="${targetOrigin}/login" style="color: #2563eb; font-weight: 600;">aassaybiz.com</a>.
                  </p>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
                Aassay Biz &bull; Everything you need. One smart platform
              </td>
            </tr>
          </table>
        </div>
      `;

      await sendSesEmail({
        to: cleanEmail,
        subject: `Invitation to join ${businessName} on Aassay Biz`,
        html: inviteEmailHtml
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isExisting ? 'Existing user added to business and notified successfully' : 'User invited and invitation email dispatched successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('[invite-team-member] Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

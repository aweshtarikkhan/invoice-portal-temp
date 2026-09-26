/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Img, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface Props {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

const BRAND = 'Aassay Biz'

export const SignupEmail = ({ siteUrl, recipient, confirmationUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email to activate your {BRAND} account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img
            src="https://aassaybiz.com/logo.png"
            alt="Aassay Biz"
            width="170"
            height="auto"
            style={{ margin: '0 auto 8px', display: 'block' }}
          />
          <Text style={tagline}>Everything you need. One smart platform</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>Welcome aboard! 🎉</Heading>
          <Text style={text}>
            Thanks for signing up for <strong>{BRAND}</strong> — the easiest way to manage
            invoicing, inventory, workforce attendance, and grow your business.
          </Text>
          <Text style={text}>
            Please confirm your email <strong>{recipient}</strong> to activate your account:
          </Text>
          <Section style={{ textAlign: 'center' as const, margin: '32px 0' }}>
            <Button style={button} href={confirmationUrl}>Verify Email Address</Button>
          </Section>
          <Text style={smallText}>
            Or copy and paste this link in your browser:<br />
            <Link href={confirmationUrl} style={link}>{confirmationUrl}</Link>
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            If you didn't create a {BRAND} account, you can safely ignore this email.
          </Text>
        </Section>
        <Text style={brandFooter}>
          © {new Date().getFullYear()} {BRAND} · Everything you need. One smart platform
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

// === Shared styles (Aassay Biz brand) ===
const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 20px' }
const header = { textAlign: 'center' as const, padding: '8px 0 24px' }
const logo = { fontSize: '26px', fontWeight: 700 as const, color: '#1d4ed8', margin: '0', letterSpacing: '-0.5px' }
const tagline = { fontSize: '13px', color: '#64748b', margin: '4px 0 0', fontWeight: 600 as const, letterSpacing: '0.3px' }
const card = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: 700 as const, color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const smallText = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '20px 0 0', wordBreak: 'break-all' as const }
const link = { color: '#1d4ed8', textDecoration: 'underline' }
const button = {
  backgroundColor: '#1d4ed8', color: '#ffffff', fontSize: '15px', fontWeight: 600 as const,
  borderRadius: '8px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block',
}
const hr = { borderColor: '#e2e8f0', margin: '28px 0 20px' }
const footer = { fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '0' }
const brandFooter = { fontSize: '12px', color: '#94a3b8', textAlign: 'center' as const, margin: '24px 0 0' }
const brandLink = { color: '#64748b', textDecoration: 'none' }

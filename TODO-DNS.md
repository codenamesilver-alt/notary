# Post-Propagation Tasks (NS → Vercel)

Perform these after `notaryman.us` NS fully resolves to `ns1.vercel-dns.com`/`ns2.vercel-dns.com` (current status: propagated to Cloudflare, pending Google/others).

## 1. Vercel DNS – Site Records
Add to Vercel zone (`notery` project → Settings → Domains → DNS Records):
- `@` A → 216.198.79.1
- `@` A → 64.29.17.1
- `www` CNAME → 8c5bbc2c21a4aa68.vercel-dns-017.com

CLI (once zone active):
```
vercel dns add notaryman.us '@' A 216.198.79.1 --scope campusense
vercel dns add notaryman.us '@' A 64.29.17.1 --scope campusense
vercel dns add notaryman.us www CNAME 8c5bbc2c21a4aa68.vercel-dns-017.com --scope campusense
```

## 2. Vercel DNS – Email Records (Hostinger mailbox)
Replicate Hostinger's auto-created mail records into Vercel zone:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| MX | @ | 5 mx1.hostinger.com | 14400 |
| MX | @ | 10 mx2.hostinger.com | 14400 |
| TXT | @ | "v=spf1 include:_spf.mail.hostinger.com ~all" | 3600 |
| TXT | _dmarc | "v=DMARC1; p=none" | 3600 |
| CNAME | hostingermail-a._domainkey | hostingermail-a.dkim.mail.hostinger.com | 300 |
| CNAME | hostingermail-b._domainkey | hostingermail-b.dkim.mail.hostinger.com | 300 |
| CNAME | hostingermail-c._domainkey | hostingermail-c.dkim.mail.hostinger.com | 300 |
| CNAME | autoconfig | autoconfig.mail.hostinger.com | 300 |
| CNAME | autodiscover | autodiscover.mail.hostinger.com | 300 |

CLI example for MX:
```
vercel dns add notaryman.us '@' MX 5 mx1.hostinger.com --scope campusense
vercel dns add notaryman.us '@' MX 10 mx2.hostinger.com --scope campusense
```
Use similar pattern for TXT/CNAME (type TXT for SPF/DMARC, CNAME for DKIM/auto configs). TTL 300-14400.

## 3. Verification
- `vercel domains verify notaryman.us --scope campusense` → Valid Configuration
- `vercel domains verify www.notaryman.us --scope campusense` → Valid Configuration
- `Resolve-DnsName notaryman.us -Type A -Server 1.1.1.1` → 216.198.79.1 / 64.29.17.1
- `Resolve-DnsName www.notaryman.us -Type CNAME -Server 1.1.1.1` → 8c5bbc2c21a4aa68.vercel-dns-017.com
- HTTP 80 → HTTPS 301 redirect (Vercel default)
- https://www.notaryman.us returns 200 (site content)
- MX + SPF working: send test from info@notaryman.us → inbound/outbound OK.

## 4. GitHub Auto-Deploy (after Vercel GitHub App install)
Once repo `codenamesilver-alt/notary` authorized to Vercel:
```
vercel git connect https://github.com/codenamesilver-alt/notary.git --scope campusense
```
Then push to `main` triggers production deploy.

## Notes
- Hostinger DNS zone (MX/SPF/DKIM) can stay; harmless after NS flip.
- Keep Hostinger mailbox active; Vercel only routes, doesn't host mail.
- PHP files (config.php/lead) remain on local FS only; Vercel doesn't serve PHP.

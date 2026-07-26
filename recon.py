#!/usr/bin/env python3
import argparse
import requests
import sys
import time
import os

# Endpoint Utama
API_URL = "https://ultimate-attack-surface-recon-api.p.rapidapi.com/scan"
RAPIDAPI_KEY = "YOUR_RAPIDAPI_KEY_HERE" 

def get_api_key(args_key):
    """Resolve API key from: CLI flag > env var > hardcoded constant."""
    if args_key:
        return args_key
    env_key = os.environ.get("RAPIDAPI_KEY")
    if env_key:
        return env_key
    return RAPIDAPI_KEY

def scan_domain(domain, api_key):
    headers = {
        "x-rapidapi-key": api_key,
        "x-rapidapi-host": "ultimate-attack-surface-recon-api.p.rapidapi.com"
    }
    querystring = {"domain": domain.strip()}
    
    try:
        response = requests.get(API_URL, headers=headers, params=querystring, timeout=30)
        if response.status_code in [401, 403, 429]:
            if response.status_code == 429:
                print("\n[!] ERROR: API Quota Exceeded (Rate Limit or Free Tier Limit reached).")
            else:
                print("\n[!] ERROR: API Key invalid or not subscribed.")
            print("[!] Get or upgrade your key at: https://rapidapi.com/BMNTR/api/ultimate-attack-surface-recon-api")
            sys.exit(1)
            
        data = response.json()
        if response.status_code == 200:
            return data.get('data', {})
        else:
            print(f"    [-] Unexpected API response: HTTP {response.status_code}")
            return None
    except requests.exceptions.Timeout:
        print(f"    [-] Request timed out (30s). Skipping...")
        return None
    except requests.exceptions.ConnectionError:
        print(f"    [-] Connection failed. Check your internet or DNS resolution.")
        return None
    except requests.exceptions.JSONDecodeError:
        print(f"    [-] API returned invalid JSON. Possible server issue.")
        return None
    except Exception as e:
        print(f"    [-] Unexpected error: {e}")
        return None

def display_result(result, verbose=False):
    """Display all scan results from API response."""
    # Security Grade & Subdomains
    # API returns: data.security_analysis.security_score.grade
    security_analysis = result.get('security_analysis', {})
    grade = security_analysis.get('security_score', {}).get('grade', 'Unknown')
    subs = result.get('subdomains', {}).get('count', 0)
    print(f"    -> Grade: {grade} | Subdomains: {subs}")
    
    if grade in ['C', 'D', 'F']:
        print(f"    -> [!] POTENTIAL TARGET: Weak security headers detected!")

    if verbose:
        # DNS Records — API returns: data.dns_records (uppercase keys: A, MX, NS, TXT)
        dns = result.get('dns_records', {})
        if dns:
            a_records = dns.get('A', [])
            mx_records = dns.get('MX', [])
            ns_records = dns.get('NS', [])
            if a_records:
                print(f"    -> DNS A: {', '.join(a_records[:3])}")
            if mx_records:
                print(f"    -> DNS MX: {', '.join(str(r) for r in mx_records[:3])}")
            if ns_records:
                print(f"    -> DNS NS: {', '.join(str(r) for r in ns_records[:3])}")

        # SPF/DMARC — API does not have mail_security field.
        # SPF/DMARC info is inside dns_records.TXT records.
        txt_records = dns.get('TXT', [])
        if txt_records:
            spf_record = next((r for r in txt_records if 'v=spf1' in r), None)
            dmarc_record = next((r for r in txt_records if 'v=DMARC1' in r.upper()), None)
            spf_status = "Present" if spf_record else "MISSING"
            dmarc_status = "Present" if dmarc_record else "MISSING"
            print(f"    -> SPF: {spf_status}")
            print(f"    -> DMARC: {dmarc_status}")

        # WHOIS / RDAP — API returns: data.whois with key expiry_date (not expiration_date)
        whois = result.get('whois', {})
        if whois:
            registrar = whois.get('registrar', '')
            expiry = whois.get('expiry_date', '')
            if registrar and registrar != 'Not Available':
                print(f"    -> Registrar: {registrar}")
            if expiry and expiry != 'Not Available':
                print(f"    -> Expires: {expiry}")

    # Sensitive Files — API returns: data.security_analysis.sensitive_files
    sensitive = security_analysis.get('sensitive_files', {})
    exposures = 0
    for ftype, info in sensitive.items():
        if isinstance(info, dict) and info.get('found'):
            exposures += 1
            risk = info.get('risk', '')
            note = info.get('note', '')
            print(f"    -> [!!!] {risk.upper()}: Exposed {ftype} detected! {note}")
    
    return grade, exposures

def main():
    parser = argparse.ArgumentParser(
        description="TriageTalon: Fast Bug Bounty Recon & Vulnerability Filter",
        epilog="Example: python recon.py -d hackerone.com -k YOUR_API_KEY"
    )
    parser.add_argument("-d", "--domain", help="Single domain to scan")
    parser.add_argument("-l", "--list", help="File containing list of domains (one per line)")
    parser.add_argument("-k", "--key", help="RapidAPI Key (or set RAPIDAPI_KEY env var)")
    parser.add_argument("-v", "--verbose", action="store_true", help="Show DNS, WHOIS, and mail security details")
    args = parser.parse_args()

    api_key = get_api_key(args.key)

    if api_key == "YOUR_RAPIDAPI_KEY_HERE":
        print("[-] Error: Missing RapidAPI Key.")
        print("[-] Options:")
        print("    1. Pass via flag:    python recon.py -d target.com -k YOUR_KEY")
        print("    2. Set env var:      export RAPIDAPI_KEY=YOUR_KEY")
        print("    3. Hardcode in script: edit RAPIDAPI_KEY in recon.py")
        print("[-] Get your FREE key: https://rapidapi.com/BMNTR/api/ultimate-attack-surface-recon-api")
        sys.exit(1)

    domains = []
    if args.domain:
        domains.append(args.domain)
    elif args.list:
        if not os.path.isfile(args.list):
            print(f"[-] Error: File not found: {args.list}")
            sys.exit(1)
        with open(args.list, 'r') as f:
            domains = [line.strip() for line in f if line.strip()]
    else:
        parser.print_help()
        sys.exit(1)

    if not domains:
        print("[-] Error: No valid domains found in input.")
        sys.exit(1)

    print(f"[*] TriageTalon initialized. Scanning {len(domains)} targets...\n")
    
    stats = {"scanned": 0, "weak": 0, "strong": 0, "failed": 0, "exposures": 0}

    for domain in domains:
        domain = domain.strip()
        if not domain:
            continue
        
        stats["scanned"] += 1
        print(f"[*] Scanning: {domain}")
        result = scan_domain(domain, api_key)
        
        if result:
            grade, exposures = display_result(result, verbose=args.verbose)
            stats["exposures"] += exposures
            if grade in ['C', 'D', 'F']:
                stats["weak"] += 1
            else:
                stats["strong"] += 1
        else:
            stats["failed"] += 1
            print(f"    -> [-] Scan failed or target offline.")
        
        time.sleep(1)

    # Summary
    print(f"\n{'='*50}")
    print(f"[*] SCAN COMPLETE")
    print(f"{'='*50}")
    print(f"    Scanned:   {stats['scanned']}")
    print(f"    Weak (C/D/F): {stats['weak']}")
    print(f"    Strong (A/B): {stats['strong']}")
    print(f"    Failed:    {stats['failed']}")
    print(f"    Exposures: {stats['exposures']}")
    print(f"{'='*50}")

if __name__ == "__main__":
    main()

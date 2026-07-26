#!/usr/bin/env python3
import argparse
import requests
import sys
import time

# Endpoint Utama
API_URL = "https://ultimate-attack-surface-recon.p.rapidapi.com/api/v1/scan"
RAPIDAPI_KEY = "YOUR_RAPIDAPI_KEY_HERE" 

def scan_domain(domain, api_key):
    headers = {
        "x-rapidapi-key": api_key,
        "x-rapidapi-host": "ultimate-attack-surface-recon.p.rapidapi.com"
    }
    querystring = {"domain": domain.strip()}
    
    try:
        response = requests.get(API_URL, headers=headers, params=querystring)
        if response.status_code in [401, 403]:
            print("[!] API Key invalid or quota exceeded.")
            print("[!] Get your FREE key at: https://rapidapi.com/BMNTR/api/ultimate-attack-surface-recon-api")
            sys.exit(1)
            
        data = response.json()
        if response.status_code == 200:
            return data.get('data', {})
    except Exception:
        pass
    return None

def main():
    parser = argparse.ArgumentParser(description="TriageTalon: Fast Bug Bounty Recon & Vulnerability Filter")
    parser.add_argument("-d", "--domain", help="Single domain to scan")
    parser.add_argument("-l", "--list", help="File containing list of domains")
    parser.add_argument("-k", "--key", help="RapidAPI Key")
    args = parser.parse_args()

    api_key = args.key if args.key else RAPIDAPI_KEY

    if api_key == "YOUR_RAPIDAPI_KEY_HERE":
        print("[-] Error: Missing RapidAPI Key.")
        print("[-] Get your FREE key here: https://rapidapi.com/BMNTR/api/ultimate-attack-surface-recon-api")
        sys.exit(1)

    domains = []
    if args.domain:
        domains.append(args.domain)
    elif args.list:
        with open(args.list, 'r') as f:
            domains = f.readlines()
    else:
        parser.print_help()
        sys.exit(1)

    print(f"[*] TriageTalon initialized. Scanning {len(domains)} targets...\n")
    
    for domain in domains:
        domain = domain.strip()
        if not domain: continue
        
        print(f"[*] Scanning: {domain}")
        result = scan_domain(domain, api_key)
        
        if result:
            grade = result.get('security_headers', {}).get('grade', 'Unknown')
            subs = result.get('subdomains', {}).get('count', 0)
            print(f"    ↳ Grade: {grade} | Subdomains: {subs}")
            
            if grade in ['C', 'D', 'F']:
                print(f"    ↳ [!] POTENTIAL TARGET: Weak security headers detected!")
                
            sensitive = result.get('sensitive_files', {})
            for ftype, info in sensitive.items():
                if info.get('found'):
                    print(f"    ↳ [!!!] CRITICAL: Exposed {ftype} found at {info.get('url')}")
        else:
            print(f"    ↳ [-] Scan failed or target offline.")
        
        time.sleep(1)

if __name__ == "__main__":
    main()

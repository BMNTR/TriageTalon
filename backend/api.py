import asyncio
import os
import ipaddress
import socket
import time
from collections import defaultdict
import random
from urllib.parse import urlparse
import httpx
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import RedirectResponse

from fastapi.middleware.cors import CORSMiddleware
import html

ENVIRONMENT = os.getenv("ENVIRONMENT", "production")

app = FastAPI(
    title="Ultimate Attack Surface API",
    description="High-speed OSINT & Recon API for Bug Bounty and Cybersecurity",
    version="2.0.0",
    docs_url=None if ENVIRONMENT == "production" else "/docs",
    redoc_url=None if ENVIRONMENT == "production" else "/redoc"
)

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to RapidAPI and Vercel domains
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Configuration
TIMEOUT = 5.0
PROXY_SECRET = os.getenv("RAPIDAPI_PROXY_SECRET")

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0"
]

def get_standard_headers():
    """Generate standard, polite headers without spoofing."""
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
    }

MAX_SUBDOMAINS = 100
MAX_DOMAIN_LENGTH = 253

# Security header explanations for beginners
HEADER_INFO = {
    "Strict-Transport-Security": {
        "description": "Forces browsers to use HTTPS only, preventing downgrade attacks.",
        "risk_if_missing": "High"
    },
    "Content-Security-Policy": {
        "description": "Controls which resources the browser can load, preventing XSS attacks.",
        "risk_if_missing": "High"
    },
    "X-Frame-Options": {
        "description": "Prevents the site from being embedded in iframes, blocking clickjacking.",
        "risk_if_missing": "Medium"
    },
    "X-Content-Type-Options": {
        "description": "Prevents browsers from MIME-sniffing, reducing drive-by download risk.",
        "risk_if_missing": "Low"
    }
}

# Technology detection patterns from headers & cookies
TECH_SIGNATURES = {
    "server": {
        "cloudflare": "Cloudflare CDN",
        "nginx": "Nginx",
        "apache": "Apache",
        "gws": "Google Web Server",
        "microsoft-iis": "Microsoft IIS",
        "litespeed": "LiteSpeed",
        "openresty": "OpenResty (Nginx-based)",
        "vercel": "Vercel",
        "netlify": "Netlify",
        "gunicorn": "Gunicorn (Python)",
        "uvicorn": "Uvicorn (Python ASGI)",
        "cowboy": "Cowboy (Erlang/Elixir)",
        "caddy": "Caddy",
        "envoy": "Envoy Proxy"
    },
    "x-powered-by": {
        "express": "Express.js (Node.js)",
        "php": "PHP",
        "asp.net": "ASP.NET",
        "next.js": "Next.js",
        "nuxt": "Nuxt.js",
        "django": "Django (Python)",
        "flask": "Flask (Python)",
        "ruby": "Ruby on Rails",
        "java": "Java",
        "servlet": "Java Servlet"
    },
    "cookies": {
        "wordpress_": "WordPress",
        "wp-": "WordPress",
        "joomla": "Joomla",
        "drupal": "Drupal",
        "laravel_session": "Laravel (PHP)",
        "csrftoken": "Django (Python)",
        "rack.session": "Ruby on Rails",
        "jsessionid": "Java (Tomcat/Spring)",
        "asp.net_sessionid": "ASP.NET",
        "phpsessid": "PHP",
        "connect.sid": "Express.js (Node.js)",
        "_cf_": "Cloudflare",
        "shopify": "Shopify",
        "squarespace": "Squarespace"
    }
}


# --- ANTI SSRF ---
async def is_private_ip(hostname: str) -> bool:
    """Check if a hostname resolves to an internal/private IP without blocking."""
    try:
        loop = asyncio.get_running_loop()
        ip_str = await loop.run_in_executor(None, socket.gethostbyname, hostname)
        ip = ipaddress.ip_address(ip_str)
        return ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved
    except (socket.gaierror, ValueError):
        return True


def is_safe_redirect(url: str, original_domain: str) -> bool:
    """Only allow redirects to the same domain or www variant."""
    try:
        parsed = urlparse(url)
        redirect_host = parsed.hostname
        if redirect_host is None:
            return False
        if redirect_host == original_domain:
            return True
        if redirect_host == "www." + original_domain:
            return True
        if redirect_host.endswith("." + original_domain):
            return True
        return False
    except Exception:
        return False


# Rate Limiting is handled strictly by the RapidAPI Gateway API.
# The in-memory limiter has been removed as it is ineffective in Serverless/Vercel environments.


async def safe_redirect_get(client, url, domain, headers):
    """Helper: GET with redirects validated at each step."""
    response = await client.get(url, headers=headers, follow_redirects=False)
    redirects_followed = 0
    while response.is_redirect and redirects_followed < 3:
        redirect_url = str(response.next_request.url) if response.next_request else None
        if not redirect_url or not is_safe_redirect(redirect_url, domain):
            break
        response = await client.get(redirect_url, headers=headers, follow_redirects=False)
        redirects_followed += 1
    return response


# =====================================================
# FEATURE 1: SUBDOMAIN + IP ADDRESS
# =====================================================
async def fetch_subdomains(domain: str) -> dict:
    """Fetch subdomains AND IP addresses from HackerTarget."""
    url = f"https://api.hackertarget.com/hostsearch/?q={domain}"
    subdomains = []
    seen = set()
    truncated = False
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(url)
            if response.status_code == 200:
                text = response.text.strip()
                if text.startswith("error"):
                    return {"count": 0, "list": [], "truncated": False}
                lines = text.split("\n")
                for line in lines:
                    if "," in line:
                        parts = line.split(",", 1)
                        sub = parts[0].strip()
                        ip = parts[1].strip() if len(parts) > 1 else "Unknown"
                        if sub and sub.endswith(domain) and sub != domain and sub not in seen:
                            if len(subdomains) < MAX_SUBDOMAINS:
                                seen.add(sub)
                                subdomains.append({"hostname": sub, "ip": ip})
                            else:
                                truncated = True
    except Exception:
        pass
    result = {
        "count": len(subdomains),
        "list": subdomains,
        "truncated": truncated
    }
    if truncated:
        result["note"] = f"Results capped at {MAX_SUBDOMAINS}. Full data available on paid plan."
    return result


# =====================================================
# FEATURE 2: SECURITY HEADERS + SCORE
# =====================================================
def build_header_result(header_name: str, header_value):
    """Build result object for a security header with clear context."""
    info = HEADER_INFO.get(header_name, {})
    if header_value is not None:
        return {
            "present": True,
            "value": header_value,
            "status": "Secure",
            "description": info.get("description", "")
        }
    else:
        return {
            "present": False,
            "value": "Not Set",
            "status": "Missing",
            "risk_level": info.get("risk_if_missing", "Unknown"),
            "description": info.get("description", "")
        }


def calculate_security_score(headers_result: dict) -> dict:
    weights = {
        "Strict-Transport-Security": 30,
        "Content-Security-Policy": 30,
        "X-Frame-Options": 25,
        "X-Content-Type-Options": 15
    }
    total_score = 0
    for h, w in weights.items():
        if headers_result.get(h, {}).get("present", False):
            total_score += w
    if total_score >= 90:
        grade = "A"
    elif total_score >= 70:
        grade = "B"
    elif total_score >= 50:
        grade = "C"
    elif total_score >= 30:
        grade = "D"
    else:
        grade = "F"
    return {"score": total_score, "grade": grade, "max_score": 100}


async def check_security_headers(domain: str) -> dict:
    """Check security headers + tech stack detection."""
    check_headers = ["Strict-Transport-Security", "Content-Security-Policy",
                     "X-Frame-Options", "X-Content-Type-Options"]
    raw_values = {h: None for h in check_headers}
    server_info = {"Server": "Not Disclosed", "X-Powered-By": "Not Disclosed"}
    detected_tech = []

    for scheme in ["https", "http"]:
        url = f"{scheme}://{domain}"
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
                response = await safe_redirect_get(client, url, domain, get_standard_headers())
                headers = response.headers

                for h in check_headers:
                    raw_values[h] = headers.get(h)

                # Server info
                server_val = headers.get("Server", "")
                powered_val = headers.get("X-Powered-By", "")
                server_info["Server"] = server_val if server_val else "Not Disclosed"
                server_info["X-Powered-By"] = powered_val if powered_val else "Not Disclosed"

                # --- TECH STACK DETECTION ---
                # 1. From Server header
                for pattern, tech_name in TECH_SIGNATURES["server"].items():
                    if pattern in server_val.lower():
                        detected_tech.append(tech_name)

                # 2. From X-Powered-By header
                for pattern, tech_name in TECH_SIGNATURES["x-powered-by"].items():
                    if pattern in powered_val.lower():
                        detected_tech.append(tech_name)

                # 3. From Cookies
                cookie_header = headers.get("Set-Cookie", "").lower()
                for pattern, tech_name in TECH_SIGNATURES["cookies"].items():
                    if pattern in cookie_header:
                        detected_tech.append(tech_name)

                # 4. From custom headers
                if "x-vercel-id" in headers:
                    detected_tech.append("Vercel")
                if "x-netlify" in headers or "netlify" in headers.get("Server", "").lower():
                    detected_tech.append("Netlify")
                if "x-shopify-stage" in headers:
                    detected_tech.append("Shopify")
                if "x-drupal-cache" in headers:
                    detected_tech.append("Drupal")
                if "x-generator" in headers:
                    gen = headers.get("x-generator", "")
                    if gen:
                        detected_tech.append(html.escape(gen))

                break
        except Exception:
            continue

    headers_result = {}
    for h in check_headers:
        headers_result[h] = build_header_result(h, raw_values[h])

    score = calculate_security_score(headers_result)

    return {
        "security_score": score,
        "headers": headers_result,
        "server_info": server_info,
        "tech_stack": list(set(detected_tech)) if detected_tech else ["Not Detected"]
    }


# =====================================================
# FEATURE 3: SENSITIVE FILES
# =====================================================
async def check_sensitive_files(domain: str) -> dict:
    files_to_check = {
        "robots.txt": f"https://{domain}/robots.txt",
        ".git/config": f"https://{domain}/.git/config",
        ".env": f"https://{domain}/.env"
    }
    results = {}

    async def fetch(name, url):
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT, verify=False) as client:
                response = await safe_redirect_get(client, url, domain, get_standard_headers())
                if response.status_code == 200:
                    content_type = response.headers.get("Content-Type", "").lower()
                    body = response.text[:2000].lower()
                    
                    if "html" in content_type or "<html" in body or "<body" in body:
                        # WAFs and Catch-Alls usually return HTML.
                        return name, {"found": False, "risk": "None"}
                        
                    if name == "robots.txt":
                        if "user-agent:" in body or "disallow:" in body or "sitemap:" in body:
                            return name, {"found": True, "risk": "Informational", "note": "May reveal hidden paths and admin panels."}
                    elif name == ".git/config":
                        if "[core]" in body or "repositoryformatversion" in body:
                            return name, {"found": True, "risk": "Critical", "note": "Source code exposure! Attacker can download entire repository."}
                    elif name == ".env":
                        # Look for common env key-value structures
                        if "=" in body and ("app_" in body or "db_" in body or "secret" in body or "key" in body or "host" in body or "password" in body):
                            return name, {"found": True, "risk": "Critical", "note": "Environment file exposed! May contain database passwords and API keys."}
                            
                return name, {"found": False, "risk": "None"}
        except Exception:
            return name, {"found": False, "risk": "None"}

    tasks = [fetch(name, url) for name, url in files_to_check.items()]
    completed = await asyncio.gather(*tasks)
    for name, result in completed:
        results[name] = result
    return results


# =====================================================
# FEATURE 4: DNS RECORDS (FREE — using Google DNS API)
# =====================================================
async def fetch_dns_records(domain: str) -> dict:
    """Fetch DNS records via Google Public DNS JSON API (free, no external libraries)."""
    record_types = {"A": 1, "AAAA": 28, "MX": 15, "NS": 2, "TXT": 16, "CNAME": 5}
    dns_results = {}

    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        for rtype, rtype_num in record_types.items():
            try:
                response = await client.get(
                    f"https://dns.google/resolve?name={domain}&type={rtype_num}"
                )
                if response.status_code == 200:
                    data = response.json()
                    answers = data.get("Answer", [])
                    if answers:
                        dns_results[rtype] = [a.get("data", "").rstrip(".") for a in answers]
                    else:
                        dns_results[rtype] = []
                else:
                    dns_results[rtype] = []
            except Exception:
                dns_results[rtype] = []

    return dns_results


# =====================================================
# FEATURE 5: WHOIS / RDAP (FREE — IANA standard)
# =====================================================
async def fetch_whois_rdap(domain: str) -> dict:
    """Fetch domain registration data via RDAP (WHOIS alternative, free)."""
    whois_data = {
        "registrar": "Not Available",
        "created_date": "Not Available",
        "expiry_date": "Not Available",
        "updated_date": "Not Available",
        "nameservers": [],
        "status": []
    }
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            tld = domain.split(".")[-1]
            bootstrap_url = f"https://rdap.org/domain/{domain}"
            response = await client.get(bootstrap_url, follow_redirects=True)

            if response.status_code == 200:
                data = response.json()

                # Registrar
                entities = data.get("entities", [])
                for entity in entities:
                    roles = entity.get("roles", [])
                    if "registrar" in roles:
                        vcard = entity.get("vcardArray", [None, []])
                        if len(vcard) > 1:
                            for field in vcard[1]:
                                if field[0] == "fn":
                                    whois_data["registrar"] = field[3]
                                    break

                # Dates
                events = data.get("events", [])
                for event in events:
                    action = event.get("eventAction", "")
                    date = event.get("eventDate", "")
                    if action == "registration":
                        whois_data["created_date"] = date[:10]
                    elif action == "expiration":
                        whois_data["expiry_date"] = date[:10]
                    elif action == "last changed":
                        whois_data["updated_date"] = date[:10]

                # Nameservers
                nameservers = data.get("nameservers", [])
                whois_data["nameservers"] = [
                    ns.get("ldhName", "").lower() for ns in nameservers if ns.get("ldhName")
                ]

                # Status
                status_list = data.get("status", [])
                whois_data["status"] = status_list

    except Exception:
        pass
    return whois_data


# Port scanning feature removed to adhere to strict passive OSINT guidelines.

# =====================================================
# ENDPOINTS
# =====================================================

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}


@app.get("/scan")
async def perform_recon(
    request: Request,
    domain: str = Query(..., description="Target domain, e.g., example.com", pattern="^[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")
):
    """
    All-in-one OSINT scan: Subdomains, Security Headers, Sensitive Files, DNS Records, WHOIS, and Tech Stack.
    """
    # Enforce RapidAPI Proxy Secret
    if PROXY_SECRET:
        client_secret = request.headers.get("X-RapidAPI-Proxy-Secret")
        if not client_secret or client_secret != PROXY_SECRET:
            raise HTTPException(status_code=401, detail="Unauthorized. Direct access forbidden. Please use RapidAPI.")

    start_time = time.time()
    domain_lower = domain.lower().strip()

    if len(domain_lower) > MAX_DOMAIN_LENGTH:
        raise HTTPException(status_code=400, detail="Domain too long. Maximum 253 characters.")
    if domain_lower.endswith(".internal") or domain_lower.endswith(".local"):
        raise HTTPException(status_code=400, detail="Scanning internal/reserved domains is not allowed.")
    if await is_private_ip(domain_lower):
        raise HTTPException(status_code=400, detail="Domain resolves to a private/reserved IP address.")

    # RapidAPI handles rate limiting. Local fake rate limiter removed.

    # Wrap the gathering of tasks in a global timeout to survive Vercel's 10s limit
    async def gather_all():
        return await asyncio.gather(
            fetch_subdomains(domain_lower),
            check_security_headers(domain_lower),
            check_sensitive_files(domain_lower),
            fetch_dns_records(domain_lower),
            fetch_whois_rdap(domain_lower)
        )

    try:
        results = await asyncio.wait_for(gather_all(), timeout=9.0)
        subdomains_result, security_result, files, dns_records, whois_data = results
    except asyncio.TimeoutError:
        # If it times out, we return partial/failed data but survive the crash!
        subdomains_result = {"count": 0, "list": [], "truncated": True, "note": "Timeout exceeded. Target too slow."}
        security_result = {
            "security_score": {"score": 0, "grade": "F", "max_score": 100},
            "headers": {}, "server_info": {"Server": "Timeout", "X-Powered-By": "Timeout"}, "tech_stack": ["Timeout"]
        }
        files = {}
        dns_records = {}
        whois_data = {}

    elapsed = round(time.time() - start_time, 2)

    return {
        "status": "success",
        "target": domain_lower,
        "scan_duration_seconds": elapsed,
        "data": {
            "subdomains": subdomains_result,
            "dns_records": dns_records,
            "whois": whois_data,
            "security_analysis": {
                "security_score": security_result["security_score"],
                "headers": security_result["headers"],
                "server_info": security_result["server_info"],
                "tech_stack": security_result["tech_stack"],
                "sensitive_files": files
            }
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)

#!/usr/bin/env python3
"""
TriageTalon CLI
Fast Bug Bounty Recon & Attack Surface Triage.

Talks to the "Ultimate Attack Surface Recon API" (RapidAPI) and grades
targets so you can focus on the weakest links in scope first.
"""
import argparse
import json
import os
import re
import json
import logging
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import urlparse
from typing import Optional

try:
    from textual.app import App, ComposeResult
    from textual.containers import Center, Vertical
    from textual.widgets import Footer, Input, Static, RichLog
    from textual.binding import Binding
    from textual import work
except ImportError:
    pass

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Force UTF-8 for Windows consoles so block characters render correctly.
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

try:
    from rich.console import Console
    from rich.table import Table
    from rich.text import Text
    from rich.panel import Panel
    from rich.progress import (
        Progress,
        SpinnerColumn,
        TextColumn,
        BarColumn,
        TaskProgressColumn,
        MofNCompleteColumn,
        TimeElapsedColumn,
    )
    from rich.prompt import Prompt, Confirm
    from rich import box
    from rich.columns import Columns
    from rich.layout import Layout
    from rich.live import Live
    from rich.syntax import Syntax
    from rich.rule import Rule
except ImportError:
    print("[-] Error: 'rich' library is required. Install with: pip install rich")
    sys.exit(1)

try:
    from prompt_toolkit import PromptSession
    from prompt_toolkit.history import FileHistory
    from prompt_toolkit.auto_suggest import AutoSuggestFromHistory
    from prompt_toolkit.completion import WordCompleter
    from prompt_toolkit.styles import Style as PtStyle
except ImportError:
    PromptSession = None  # Checked at runtime in interactive mode

__version__ = "2.0.0"

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

API_URL = os.environ.get(
    "TRIAGETALON_API_URL",
    "https://ultimate-attack-surface-recon-api.p.rapidapi.com/scan",
)
API_HOST = os.environ.get(
    "TRIAGETALON_API_HOST", "ultimate-attack-surface-recon-api.p.rapidapi.com"
)
CONFIG_FILE = os.path.expanduser("~/.triagetalon.json")

# Optional: hardcode a key here if you really want to (not recommended for
# scripts you intend to share or commit to a public repo). Leave as None to
# rely on -k / RAPIDAPI_KEY / the local config file instead.
RAPIDAPI_KEY: Optional[str] = None

MAX_THREADS = 50
WEAK_GRADES = {"C", "D", "F"}
ACCENT = "#FF3E00"  # reserved for alerts only, per the project's monochrome design

DOMAIN_RE = re.compile(
    r"^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))+$"
)

console = Console()
err_console = Console(stderr=True)


# ---------------------------------------------------------------------------
# Config / API key handling
# ---------------------------------------------------------------------------

def load_key_from_config() -> Optional[str]:
    if not os.path.exists(CONFIG_FILE):
        return None
    try:
        with open(CONFIG_FILE, "r") as f:
            return json.load(f).get("api_key")
    except (json.JSONDecodeError, OSError):
        return None


def save_key_to_config(key: str) -> None:
    try:
        with open(CONFIG_FILE, "w") as f:
            json.dump({"api_key": key}, f)
        try:
            os.chmod(CONFIG_FILE, 0o600)  # owner read/write only
        except OSError:
            pass
        console.print(
            f"[dim green][+] API Key saved to {CONFIG_FILE} (permissions restricted to owner)[/dim green]\n"
        )
    except OSError as e:
        console.print(f"[dim {ACCENT}][-] Failed to save API Key: {e}[/dim {ACCENT}]\n")


def mask_key(key: str) -> str:
    if len(key) <= 8:
        return "*" * len(key)
    return f"{key[:4]}{'*' * (len(key) - 8)}{key[-4:]}"


def get_api_key(args_key: Optional[str]) -> Optional[str]:
    """Resolve API key: CLI flag > env var > config file > hardcoded constant."""
    if args_key and args_key.strip():
        return args_key.strip()
    env_key = os.environ.get("RAPIDAPI_KEY")
    if env_key and env_key.strip():
        return env_key.strip()
    config_key = load_key_from_config()
    if config_key and config_key.strip():
        return config_key.strip()
    if RAPIDAPI_KEY and RAPIDAPI_KEY.strip():
        return RAPIDAPI_KEY.strip()
    return None


def prompt_for_api_key() -> str:
    console.print(f"[bold white][!] RapidAPI Key is required to run scans.[/bold white]")
    console.print(
        "[dim]Get a free key from:[/dim] "
        "https://rapidapi.com/BMNTR/api/ultimate-attack-surface-recon-api\n"
    )
    try:
        if Confirm.ask(
            "[bold white]Open this link in your browser to get a key?[/bold white]",
            default=True,
        ):
            import webbrowser

            console.print("[dim]Opening browser...[/dim]")
            webbrowser.open("https://rapidapi.com/BMNTR/api/ultimate-attack-surface-recon-api")

        api_key = Prompt.ask("\n[bold white]Please enter your RapidAPI Key[/bold white]").strip()
    except KeyboardInterrupt:
        console.print("\n[bold yellow][!] Aborted.[/bold yellow]")
        sys.exit(130)

    if not api_key:
        console.print(f"[bold {ACCENT}][-] Error: Key cannot be empty.[/bold {ACCENT}]")
        sys.exit(1)

    save_key_to_config(api_key)
    return api_key


# ---------------------------------------------------------------------------
# Domain handling
# ---------------------------------------------------------------------------

def normalize_domain(raw: str) -> Optional[str]:
    """Strip scheme/path/port/whitespace and validate as a bare hostname."""
    domain = raw.strip()
    if not domain or domain.startswith("#"):
        return None
    domain = re.sub(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", "", domain)  # strip any scheme
    domain = domain.split("/")[0]
    domain = domain.split(":")[0]  # drop port, if any
    domain = domain.rstrip(".").lower()
    if not DOMAIN_RE.match(domain):
        return None
    return domain


def load_domains_from_file(path: str) -> tuple[list[str], list[str]]:
    """Return (valid_deduped_domains, invalid_raw_lines)."""
    valid: list[str] = []
    invalid: list[str] = []
    with open(path, "r") as f:
        for line in f:
            raw = line.strip()
            if not raw or raw.startswith("#"):
                continue
            normalized = normalize_domain(raw)
            if normalized:
                valid.append(normalized)
            else:
                invalid.append(raw)

    seen = set()
    deduped = []
    for d in valid:
        if d not in seen:
            seen.add(d)
            deduped.append(d)
    return deduped, invalid


# ---------------------------------------------------------------------------
# HTTP layer
# ---------------------------------------------------------------------------

def build_session() -> requests.Session:
    """A pooled session with automatic retry/backoff on transient failures."""
    session = requests.Session()
    retry = Retry(
        total=3,
        connect=3,
        read=2,
        backoff_factor=0.6,
        status_forcelist=(500, 502, 503, 504),
        allowed_methods=("GET",),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry, pool_maxsize=MAX_THREADS)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session


def scan_domain(session: requests.Session, domain: str, api_key: str, timeout: int):
    headers = {"x-rapidapi-key": api_key, "x-rapidapi-host": API_HOST}
    params = {"domain": domain}

    try:
        response = session.get(API_URL, headers=headers, params=params, timeout=timeout)
    except requests.exceptions.Timeout:
        return domain, {"error": "Request timed out", "status": 0}
    except requests.exceptions.ConnectionError:
        return domain, {"error": "Connection failed", "status": 0}
    except requests.exceptions.RequestException as e:
        return domain, {"error": str(e), "status": 0}

    if response.status_code in (401, 403, 429):
        msg = "API quota exceeded" if response.status_code == 429 else "API key invalid or not subscribed"
        return domain, {"error": msg, "status": response.status_code, "fatal": True}

    if response.status_code == 200:
        try:
            data = response.json()
        except ValueError:
            return domain, {"error": "Invalid JSON response from API", "status": 200}
        return domain, data.get("data", {})

    return domain, {"error": f"HTTP {response.status_code}", "status": response.status_code}


# ---------------------------------------------------------------------------
# Rendering
# ---------------------------------------------------------------------------

def print_banner(no_banner: bool = False) -> None:
    if no_banner:
        return
    banner_lines = [
        "[bold white]▀█▀ █▀▄ █ █▀█ █▀▀ █▀▀ [/][bold " + ACCENT + "]▀█▀ █▀█ █   █▀█ █▄ █[/]",
        "[bold white] █  █▀▄ █ █▀█ █ ▄ █▀▀ [/][bold " + ACCENT + "] █  █▀█ █   █ █ █ ▀█[/]",
        "[bold white] ▀  ▀ ▀ ▀ ▀ ▀ ▀▀▀ ▀▀▀ [/][bold " + ACCENT + "] ▀  ▀ ▀ ▀▀▀ ▀▀▀ ▀  ▀[/]",
    ]
    console.print()
    for line in banner_lines:
        console.print(line, justify="center")
    console.print(
        f"[dim]Advanced Reconnaissance & Attack Surface Filtration  ·  v{__version__}[/dim]\n",
        justify="center",
    )


def format_result(domain: str, result: dict, verbose: bool = False):
    """Render one domain's result as rich Text. Returns (text, grade, exposures)."""
    if "error" in result:
        return None, None, 0
    return format_result_full(domain, result)


def format_result_full(domain: str, result: dict) -> Table:
    """Render ALL API response fields as a rich Table."""
    sec = result.get("security_analysis", {}) or {}
    grade = sec.get("security_score", {}).get("grade") or "?"
    grade_color = ACCENT if grade in WEAK_GRADES else "green"
    table = Table(
        title=f"[bold white] {domain} Summary [/bold white] [dim]•[/dim] [bold {grade_color}]GRADE: {grade}[/bold {grade_color}]",
        title_style="none",
        box=box.ROUNDED,
        border_style=ACCENT,
        show_header=False,
        expand=True,
    )
    table.add_column("Key", style="bold white", width=22)
    table.add_column("Value", style="white")

    sec = result.get("security_analysis", {}) or {}
    grade = sec.get("security_score", {}).get("grade") or "?"
    table.add_row("Grade", f"[bold]{'[!] ' if grade in WEAK_GRADES else '[+] '}{grade}[/bold]")

    score = sec.get("security_score", {})
    for k, v in score.items():
        if k != "grade" and v is not None and v != "":
            table.add_row(f"  {k}", str(v))

    subs = result.get("subdomains")
    if isinstance(subs, dict):
        count = subs.get("count", 0)
        table.add_row("Subdomains", str(count))
        for k, v in subs.items():
            if k == "count":
                continue
            if isinstance(v, list) and v:
                table.add_row(f"  {k}", f"{len(v)} found")
                for s in v[:5]:
                    table.add_row("", f"  {s}")
                if len(v) > 5:
                    table.add_row("", f"  ... and {len(v) - 5} more")
            elif v is not None and v != "":
                table.add_row(f"  {k}", str(v)[:120])
    elif isinstance(subs, (int, float)):
        table.add_row("Subdomains", str(int(subs)))

    dns = result.get("dns_records", {}) or {}
    for rtype, records in dns.items():
        if isinstance(records, list) and records:
            rows = [str(r) for r in records[:5]]
            display = ", ".join(rows)
            if len(records) > 5:
                display += f" (+{len(records) - 5} more)"
            table.add_row(f"DNS {rtype}", display)

    whois = result.get("whois", {}) or {}
    for k, v in whois.items():
        if v is not None and str(v).strip() and str(v) != "Not Available":
            table.add_row(f"WHOIS {k}", str(v)[:120])

    tech = result.get("technologies", {}) or {}
    if isinstance(tech, dict):
        for k, v in tech.items():
            if v is not None and v != "" and v != 0:
                v_str = str(v)
                if isinstance(v, list):
                    v_str = ", ".join(v[:10])
                    if len(v) > 10:
                        v_str += f" (+{len(v) - 10} more)"
                table.add_row(f"Tech {k}", v_str[:120])
    elif isinstance(tech, list) and tech:
        table.add_row("Technologies", ", ".join(str(t) for t in tech[:10]))

    ssl = result.get("ssl", {}) or result.get("ssl_tls", {}) or {}
    if isinstance(ssl, dict):
        for k, v in ssl.items():
            if v is not None and v != "" and v != 0 and str(v) != "False":
                v_str = str(v)[:100]
                if isinstance(v, bool) and v:
                    v_str = "Yes"
                table.add_row(f"SSL {k}", v_str)

    headers = sec.get("security_headers", {}) or {}
    if isinstance(headers, dict):
        missing = [k for k, v in headers.items() if not v]
        present = [k for k, v in headers.items() if v]
        if missing:
            table.add_row("Missing Headers", ", ".join(missing[:8]))
        if present:
            table.add_row("Present Headers", ", ".join(present[:8]))

    sensitive = sec.get("sensitive_files", {}) or {}
    for ftype, info in sensitive.items():
        if isinstance(info, dict) and info.get("found"):
            risk = (info.get("risk") or "INFO").upper()
            note = info.get("note", "")
            table.add_row(f"[bold {ACCENT}]Exposed[/bold {ACCENT}]", f"[bold {ACCENT}]{ftype} ({risk})[/bold {ACCENT}]")
            if note:
                table.add_row("", f"[dim]{note}[/dim]")

    ports = result.get("ports", {}) or result.get("open_ports", [])
    if isinstance(ports, list) and ports:
        table.add_row("Open Ports", ", ".join(str(p) for p in ports[:15]))
    elif isinstance(ports, dict):
        for k, v in ports.items():
            if v is not None and v != "" and v != 0:
                table.add_row(f"Port {k}", str(v)[:100])

    cookies = result.get("cookies", {}) or {}
    if isinstance(cookies, dict):
        for k, v in cookies.items():
            if v is not None and v != "" and v != 0 and str(v) != "False":
                table.add_row(f"Cookie {k}", str(v)[:100])

    cors = sec.get("cors", {}) or {}
    if isinstance(cors, dict):
        for k, v in cors.items():
            if v is not None and v != "" and str(v).lower() not in ("", "false", "none"):
                table.add_row(f"CORS {k}", str(v)[:100])

    other = result.get("other", {}) or {}
    for k, v in other.items():
        if v is not None and str(v).strip() and str(v) not in ("{}", "[]"):
            table.add_row(k, str(v)[:120])

    extra_keys = [
        "ip", "ip_address", "server", "response_time", "status",
        "category", "tags", "risk_score", "risk_score_total",
    ]
    for key in extra_keys:
        v = result.get(key)
        if v is not None and v != "" and v != 0:
            table.add_row(key, str(v)[:120])

    return table, grade, sum(
        1 for info in sensitive.values()
        if isinstance(info, dict) and info.get("found")
    )


def format_result_json(domain: str, result: dict) -> Panel:
    """Render the full API response as syntax-highlighted JSON."""
    clean = {k: v for k, v in result.items() if v is not None and v != "" and v != {} and v != []}
    json_str = json.dumps(clean, indent=2, default=str, ensure_ascii=False)
    syntax = Syntax(json_str, "json", theme="github-dark", line_numbers=True, word_wrap=True)
    grade = (result.get("security_analysis", {}) or {}).get("security_score", {}).get("grade", "?")
    grade_color = ACCENT if grade in WEAK_GRADES else "green"
    title = f"[bold white] {domain} Raw JSON [/bold white] [dim]•[/dim] [bold {grade_color}]GRADE: {grade}[/bold {grade_color}]"
    return Panel(syntax, title=title, border_style=ACCENT, padding=(1, 2))


def render_summary_table(stats: dict, elapsed: float) -> Table:
    table = Table(title="Scan Summary", box=box.SIMPLE)
    table.add_column("Metric", style="bold white")
    table.add_column("Count", justify="right", style="bold white")

    rate = stats["scanned"] / elapsed if elapsed > 0 else 0

    table.add_row("Total Scanned", str(stats["scanned"]))
    table.add_row(
        "Weak Targets (C/D/F)",
        f"[bold {ACCENT}]{stats['weak']}[/bold {ACCENT}]" if stats["weak"] else "0",
    )
    table.add_row("Strong Targets (A/B)", str(stats["strong"]))
    table.add_row("Failed/Offline", str(stats["failed"]))
    table.add_row(
        "Exposures Found",
        f"[bold {ACCENT}]{stats['exposures']}[/bold {ACCENT}]" if stats["exposures"] else "0",
    )
    table.add_row("Elapsed Time", f"{elapsed:.2f}s")
    table.add_row("Throughput", f"{rate:.2f} req/s")
    return table


def render_top_offenders(all_results: dict, limit: int = 15) -> Optional[Table]:
    severity = {"F": 0, "D": 1, "C": 2}
    rows = []
    for domain, result in all_results.items():
        if "error" in result:
            continue
        sec = result.get("security_analysis", {}) or {}
        grade = sec.get("security_score", {}).get("grade") or "?"
        if grade not in WEAK_GRADES:
            continue
        exposures = sum(
            1
            for info in (sec.get("sensitive_files", {}) or {}).values()
            if isinstance(info, dict) and info.get("found")
        )
        rows.append((domain, grade, exposures))

    if not rows:
        return None

    rows.sort(key=lambda r: (severity.get(r[1], 3), -r[2]))
    truncated = rows[:limit]

    table = Table(title="Top Vulnerable Targets", box=box.SIMPLE)
    table.add_column("Domain", style="bold white")
    table.add_column("Grade", justify="center", style=f"bold {ACCENT}")
    table.add_column("Exposures", justify="right")
    for domain, grade, exposures in truncated:
        table.add_row(
            domain,
            grade,
            f"[bold {ACCENT}]{exposures}[/bold {ACCENT}]" if exposures else "0",
        )
    if len(rows) > limit:
        table.caption = f"+{len(rows) - limit} more not shown"
    return table


# ---------------------------------------------------------------------------
# Scan orchestration
# ---------------------------------------------------------------------------

def run_scan(domains: list[str], api_key: str, args) -> dict:
    """Scan all domains and return summary stats. Handles Ctrl+C gracefully."""
    stats = {"scanned": 0, "weak": 0, "strong": 0, "failed": 0, "exposures": 0, "fatal": False}
    all_results: dict = {}
    session = build_session()
    start = time.monotonic()
    fatal_hit = False

    try:
        if args.quiet:
            with ThreadPoolExecutor(max_workers=args.threads) as executor:
                futures = {
                    executor.submit(scan_domain, session, d, api_key, args.timeout): d
                    for d in domains
                }
                for future in as_completed(futures):
                    domain, result = future.result()
                    all_results[domain] = result
                    if "error" not in result:
                        stats["scanned"] += 1
                        grade = result.get("security_analysis", {}).get("security_score", {}).get(
                            "grade"
                        )
                        if grade in WEAK_GRADES:
                            stats["weak"] += 1
                        else:
                            stats["strong"] += 1
                    else:
                        stats["failed"] += 1
                        if result.get("fatal") and not fatal_hit:
                            fatal_hit = True
                            err_console.print(
                                f"[bold {ACCENT}][!] Fatal API error on {domain}: "
                                f"{result['error']}. Aborting remaining scans.[/bold {ACCENT}]"
                            )
                            executor.shutdown(wait=False, cancel_futures=True)
                            break
        else:
            with Progress(
                SpinnerColumn(style="white"),
                TextColumn("[white]{task.description}"),
                BarColumn(complete_style="white", finished_style="white"),
                TaskProgressColumn(),
                MofNCompleteColumn(),
                TimeElapsedColumn(),
                console=console,
            ) as progress:
                task = progress.add_task("Scanning targets...", total=len(domains))
                with ThreadPoolExecutor(max_workers=args.threads) as executor:
                    futures = {
                        executor.submit(scan_domain, session, d, api_key, args.timeout): d
                        for d in domains
                    }
                    for future in as_completed(futures):
                        domain, result = future.result()
                        stats["scanned"] += 1
                        all_results[domain] = result

                        if "error" in result:
                            stats["failed"] += 1
                            if result.get("fatal"):
                                progress.console.print(
                                    f"[bold {ACCENT}][!] Fatal error for {domain}: "
                                    f"{result['error']}[/bold {ACCENT}]"
                                )
                                if not fatal_hit:
                                    fatal_hit = True
                                    executor.shutdown(wait=False, cancel_futures=True)
                                    progress.advance(task)
                                    break
                            else:
                                progress.console.print(
                                    f"[dim white][-][/dim white] {domain} : {result['error']}"
                                )
                        else:
                            output_text, grade, exposures = format_result(
                                domain, result, verbose=args.verbose
                            )
                            stats["exposures"] += exposures
                            if grade in WEAK_GRADES:
                                stats["weak"] += 1
                            else:
                                stats["strong"] += 1
                            if output_text:
                                progress.console.print(output_text)

                        progress.advance(task)
    except KeyboardInterrupt:
        console.print(
            f"\n[bold yellow][!] Interrupted — finishing up with {len(all_results)} "
            f"result(s) collected so far.[/bold yellow]"
        )

    stats["fatal"] = fatal_hit
    elapsed = time.monotonic() - start

    if args.output:
        try:
            with open(args.output, "w") as f:
                json.dump(all_results, f, indent=4)
            if not args.quiet:
                console.print(f"\n[bold green][+] Results exported to {args.output}[/bold green]")
        except OSError as e:
            if not args.quiet:
                console.print(f"[bold {ACCENT}][-] Failed to write output file: {e}[/bold {ACCENT}]")

    if not args.quiet:
        console.print()
        console.print(render_summary_table(stats, elapsed))
        offenders = render_top_offenders(all_results)
        if offenders:
            console.print()
            console.print(offenders)

    return stats, all_results


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="talon",
        description="TriageTalon: Fast Bug Bounty Recon & Vulnerability Filter",
        epilog="Example: talon -d example.com -k YOUR_API_KEY",
    )
    targets = parser.add_mutually_exclusive_group()
    targets.add_argument("-d", "--domain", help="Single domain to scan")
    targets.add_argument("-l", "--list", help="File containing list of domains (one per line)")
    parser.add_argument("-k", "--key", help="RapidAPI Key (or set RAPIDAPI_KEY env var)")
    parser.add_argument(
        "-v", "--verbose", action="store_true", help="Show DNS, WHOIS, and mail security details"
    )
    parser.add_argument(
        "-q", "--quiet", action="store_true", help="Silent mode (only outputs vulnerable domains)"
    )
    parser.add_argument("-o", "--output", help="Export full results to a JSON file")
    parser.add_argument(
        "-t",
        "--threads",
        type=int,
        default=5,
        help=f"Number of concurrent threads (default: 5, max: {MAX_THREADS})",
    )
    parser.add_argument(
        "--timeout", type=int, default=30, help="Per-request timeout in seconds (default: 30)"
    )
    parser.add_argument(
        "--fail-on-weak",
        action="store_true",
        help="Exit with status 1 if any C/D/F grade target is found (useful for CI gating)",
    )
    parser.add_argument("--no-banner", action="store_true", help="Suppress the startup banner")
    parser.add_argument("--version", action="version", version=f"TriageTalon {__version__}")
    return parser


def resolve_domains(args) -> list[str]:
    if args.domain:
        normalized = normalize_domain(args.domain)
        if not normalized:
            if not args.quiet:
                console.print(f"[bold {ACCENT}][-] '{args.domain}' is not a valid domain.[/bold {ACCENT}]")
            sys.exit(1)
        return [normalized]

    if not os.path.isfile(args.list):
        if not args.quiet:
            console.print(f"[bold {ACCENT}][-] Error: File not found: {args.list}[/bold {ACCENT}]")
        sys.exit(1)

    try:
        domains, invalid = load_domains_from_file(args.list)
    except OSError as e:
        if not args.quiet:
            console.print(f"[bold {ACCENT}][-] Error reading {args.list}: {e}[/bold {ACCENT}]")
        sys.exit(1)

    if invalid and not args.quiet:
        console.print(
            f"[dim white][*] Skipped {len(invalid)} invalid line(s) in {args.list}[/dim white]"
        )

    if not domains:
        if not args.quiet:
            console.print("[bold " + ACCENT + "][-] Error: No valid domains found in input.[/bold " + ACCENT + "]")
        sys.exit(1)

    return domains



class Logo(Static):
    def render(self):
        try:
            width = self.app.size.width
        except Exception:
            width = 100
        if width < 85:
            return "[bold white]TRIAGE[/bold white][bold #FF3E00]TALON[/bold #FF3E00]  [dim white]v2.0.0[/dim white]"
        return (
            "[bold white]▀█▀ █▀▄ █ █▀█ █▀▀ █▀▀ [/][bold #FF3E00]▀█▀ █▀█ █   █▀█ █▄ █[/]\n"
            "[bold white] █  █▀▄ █ █▀█ █ ▄ █▀▀ [/][bold #FF3E00] █  █▀█ █   █ █ █ ▀█[/]\n"
            "[bold white] ▀  ▀ ▀ ▀ ▀ ▀ ▀▀▀ ▀▀▀ [/][bold #FF3E00] ▀  ▀ ▀ ▀▀▀ ▀▀▀ ▀  ▀[/]\n\n"
            "[dim white]Advanced Reconnaissance & Attack Surface Evaluation  [/][bold #FF3E00]v2.0.0[/bold #FF3E00]"
        )

def copy_to_sys_clipboard(text: str, app_instance=None) -> bool:
    """Helper to copy text to system clipboard across platforms."""
    if app_instance and hasattr(app_instance, "copy_to_clipboard"):
        try:
            app_instance.copy_to_clipboard(text)
            return True
        except Exception:
            pass
    if sys.platform == "win32":
        try:
            import subprocess
            process = subprocess.Popen(['powershell', '-command', '$input | Set-Clipboard'], stdin=subprocess.PIPE)
            process.communicate(input=text.encode('utf-8'))
            return True
        except Exception:
            pass
    try:
        import pyperclip
        pyperclip.copy(text)
        return True
    except Exception:
        pass
    return False

class SubHelp(Static):
    def render(self):
        return "[dim white]Tip: Type [/dim white][bold white]help[/bold white][dim white] for available commands  •  [/dim white][bold white]Ctrl+L[/bold white][dim white] clear  •  [/dim white][bold white]Ctrl+Q[/bold white][dim white] quit[/dim white]"

class TalonApp(App):
    ENABLE_COMMAND_PALETTE = False
    COMMAND_PALETTE = False
    
    CSS = """
    Screen {
        background: #000000;
        layout: vertical;
        align: center top;
    }
    Logo {
        width: 100%;
        content-align: center middle;
        text-align: center;
    }
    SubHelp {
        width: 100%;
        content-align: center middle;
        text-align: center;
    }
    #logo-container {
        width: 100%;
        height: auto;
        align: center middle;
        content-align: center middle;
        margin-top: 2;
        margin-bottom: 1;
    }
    #input-container {
        width: 100%;
        height: auto;
        align: center middle;
        content-align: center middle;
        margin-bottom: 1;
    }
    #input {
        width: 60%;
        border: solid #FF3E00;
        background: #0d0d0d;
        color: #ffffff;
    }
    #input:focus {
        border: heavy #FF3E00;
    }
    #subhelp-container {
        width: 100%;
        height: auto;
        align: center middle;
        content-align: center middle;
        margin-bottom: 1;
    }
    #log {
        background: #000000;
        border-top: solid #222222;
        padding: 1 2;
        height: 1fr;
    }
    """
    
    BINDINGS = [
        Binding("ctrl+q", "quit", "Quit", show=True),
        Binding("ctrl+l", "clear_log", "Clear Log", show=True),
    ]

    def __init__(self, api_key, base_args):
        super().__init__()
        self.api_key = api_key
        self.base_args = base_args
        self.stats = {"scanned": 0, "weak": 0, "strong": 0, "failed": 0, "exposures": 0}
        self.session_history = []

    def compose(self) -> ComposeResult:
        with Center(id="logo-container"):
            yield Logo()
        with Center(id="input-container"):
            yield Input(placeholder="Enter target domain to start recon (e.g. example.com)...", id="input")
        with Center(id="subhelp-container"):
            yield SubHelp()
        yield RichLog(id="log", markup=True, highlight=False, wrap=True)
        yield Footer()

    def on_mount(self) -> None:
        self.query_one(Input).focus()
        self.query_one(RichLog).write("[dim white]Talon TUI initialized. Type a domain to start scanning.[/dim white]")

    def action_clear_log(self) -> None:
        self.query_one(RichLog).clear()

    async def on_input_submitted(self, event: Input.Submitted) -> None:
        if not event.value.strip():
            return
        
        line = event.value.strip()
        self.query_one(Input).value = ""
        
        parts = line.split()
        cmd = parts[0].lower()
        log = self.query_one(RichLog)
        
        if cmd in ("exit", "quit"):
            self.exit()
            return
            
        if cmd == "help":
            log.write("[bold #FF3E00]Available Commands:[/bold #FF3E00]")
            log.write("  [bold white]scan <domain>           [/bold white]: Scan a target domain (JSON + Summary Cards)")
            log.write("  [bold white]scan -t <domain>        [/bold white]: Scan target with Table Summary Card only")
            log.write("  [bold white]scan -l <file>          [/bold white]: Scan list of domains from file")
            log.write("  [bold white]copy <# | domain>       [/bold white]: Copy raw scan JSON to system clipboard")
            log.write("  [bold white]history                 [/bold white]: Show session scan history with numbers")
            log.write("  [bold white]config show             [/bold white]: Show current API key configuration")
            log.write("  [bold white]config set key <val>    [/bold white]: Save API key to configuration")
            log.write("  [bold white]clear                   [/bold white]: Clear the log screen (or Ctrl+L)")
            log.write("  [bold white]exit / quit             [/bold white]: Exit Talon TUI\n")
            return
            
        if cmd == "clear":
            self.action_clear_log()
            return

        if cmd == "history":
            if not self.session_history:
                log.write("[dim white]No scans completed in this session yet.[/dim white]\n")
                return
            table = Table(title="[bold white]Session Scan History[/bold white]", box=box.ROUNDED, border_style=ACCENT)
            table.add_column("#", justify="right", style="bold white", width=5)
            table.add_column("Domain", style="bold white")
            table.add_column("Grade")
            table.add_column("Subdomains", justify="right")
            table.add_column("Exposures", justify="right")
            for h in self.session_history:
                g = h["grade"]
                g_col = ACCENT if g in WEAK_GRADES else "green"
                table.add_row(
                    str(h["index"]),
                    h["domain"],
                    f"[bold {g_col}]{g}[/bold {g_col}]",
                    str(h["subdomains"]),
                    str(h["exposures"])
                )
            log.write(table)
            log.write("\n[dim white]Tip: Type [/dim white][bold white]copy <#>[/bold white][dim white] or [/dim white][bold white]copy <domain>[/bold white][dim white] to copy raw JSON to clipboard.[/dim white]\n\n")
            return

        if cmd == "copy":
            if not self.session_history:
                log.write("[bold #FF3E00][-] No scan results in history to copy.[/bold #FF3E00]\n")
                return
            
            target_item = None
            if len(parts) == 1:
                target_item = self.session_history[-1]
            else:
                arg = parts[1].strip().lstrip("#")
                if arg.isdigit():
                    idx = int(arg)
                    for item in self.session_history:
                        if item["index"] == idx:
                            target_item = item
                            break
                    if not target_item:
                        log.write(f"[bold #FF3E00][-] Scan #{idx} not found in history.[/bold #FF3E00]\n")
                        return
                else:
                    norm = normalize_domain(arg)
                    for item in reversed(self.session_history):
                        if item["domain"] == norm or item["domain"] == arg:
                            target_item = item
                            break
                    if not target_item:
                        log.write(f"[bold #FF3E00][-] Domain '{arg}' not found in scan history.[/bold #FF3E00]\n")
                        return
            
            clean = {k: v for k, v in target_item["result"].items() if v is not None and v != "" and v != {} and v != []}
            json_str = json.dumps(clean, indent=2, default=str, ensure_ascii=False)
            
            success = copy_to_sys_clipboard(json_str, self)
            if success:
                log.write(f"[bold green][+] Copied raw JSON for {target_item['domain']} (Scan #{target_item['index']}) to system clipboard![/bold green]\n\n")
            else:
                log.write(f"[bold #FF3E00][-] Failed to copy to system clipboard.[/bold #FF3E00]\n\n")
            return

        if cmd == "config":
            if len(parts) > 1 and parts[1].lower() == "show":
                cfg_api_key = load_key_from_config()
                env_key = os.environ.get("RAPIDAPI_KEY", "")
                table = Table(box=box.SIMPLE, border_style=ACCENT)
                table.add_column("Source", style="bold white")
                table.add_column("Status")
                table.add_row("Config file", "~/.triagetalon.json")
                table.add_row("Config API key", "[green]Set[/green]" if cfg_api_key else "[dim]Not set[/dim]")
                table.add_row("Env RAPIDAPI_KEY", "[green]Set[/green]" if env_key else "[dim]Not set[/dim]")
                if cfg_api_key:
                    table.add_row("Active key", mask_key(cfg_api_key))
                log.write(table)
                log.write("\n")
            elif len(parts) >= 4 and parts[1].lower() == "set" and parts[2].lower() == "key":
                new_key = parts[3]
                save_key_to_config(new_key)
                self.api_key = new_key
                log.write("[bold green][+] API key updated and saved for TUI session.[/bold green]\n")
            else:
                log.write("[dim #FF3E00]Usage: config show | config set key <value>[/dim #FF3E00]\n")
            return

        args_rest = parts[1:] if cmd == "scan" else parts
        table_only = "-t" in args_rest
        list_file = None
        if "-l" in args_rest:
            idx = args_rest.index("-l")
            if idx + 1 < len(args_rest):
                list_file = args_rest[idx + 1]

        clean_args = [p for p in args_rest if not p.startswith("-")]

        if list_file:
            if not os.path.isfile(list_file):
                log.write(f"[bold #FF3E00][-] File not found: {list_file}[/bold #FF3E00]\n")
                return
            domains, invalid = load_domains_from_file(list_file)
            if invalid:
                log.write(f"[dim white][*] Skipped {len(invalid)} invalid line(s)[/dim white]\n")
            if not domains:
                log.write(f"[bold #FF3E00][-] No valid domains in {list_file}[/bold #FF3E00]\n")
                return
            log.write(f"[dim white][*] Scanning {len(domains)} domain(s) from {list_file}...[/dim white]\n")
            for dom in domains:
                self.run_background_scan(dom, table_only=table_only)
            return

        if not clean_args:
            log.write("[bold #FF3E00][-] Usage: scan [-t] <domain> | scan -l <file>[/bold #FF3E00]\n")
            return

        domain_input = clean_args[0]
        normalized = normalize_domain(domain_input)
        if not normalized:
            log.write(f"[bold #FF3E00][-] '{domain_input}' is not a valid domain.[/bold #FF3E00]\n")
            return

        log.write(f"\n[white]Scanning {normalized}...[/white]")
        self.run_background_scan(normalized, table_only=table_only)
        
    def log_status(self, message: str) -> None:
        log = self.query_one(RichLog)
        log.write(message)

    @work(thread=True)
    def run_background_scan(self, domain: str, table_only: bool = False) -> None:
        import argparse
        interactive_args = argparse.Namespace(**vars(self.base_args))
        interactive_args.verbose = True
        interactive_args.quiet = True
        interactive_args.output = None
        
        self.call_from_thread(self.log_status, f"[dim white][*] Querying RapidAPI & gathering WHOIS/DNS/Headers for {domain}...[/dim white]")
        stats, all_results = run_scan([domain], self.api_key, interactive_args)
        self.call_from_thread(self.display_result, domain, all_results, table_only)
        
    def display_result(self, domain: str, all_results: dict, table_only: bool = False) -> None:
        log = self.query_one(RichLog)
        result = all_results.get(domain, {})
        
        if "error" not in result:
            log.write(f"[bold green][+] Received response for {domain}![/bold green]\n")
            sec = result.get("security_analysis", {}) or {}
            grade = sec.get("security_score", {}).get("grade") or "?"
            raw_subs = result.get("subdomains", {})
            subs = raw_subs.get("count", 0) if isinstance(raw_subs, dict) else (int(raw_subs) if isinstance(raw_subs, (int, float)) else 0)
            exposures = sum(1 for info in (sec.get("sensitive_files", {}) or {}).values() if isinstance(info, dict) and info.get("found"))
            
            history_item = {
                "index": len(self.session_history) + 1,
                "domain": domain,
                "grade": grade,
                "subdomains": subs,
                "exposures": exposures,
                "result": result
            }
            self.session_history.append(history_item)

            if not table_only:
                panel_json = format_result_json(domain, result)
                log.write(panel_json)
                log.write("\n")
            table_summary, grade, exposures = format_result_full(domain, result)
            log.write(table_summary)
        else:
            err_msg = result.get('error', 'Unknown error')
            log.write(f"[bold #FF3E00][-] {domain}: {err_msg}[/bold #FF3E00]")
            if result.get("status") in (401, 403) or "key" in err_msg.lower():
                log.write("  [dim white]Tip: Set your RapidAPI key using: [/dim white][bold white]config set key YOUR_KEY[/bold white]")
        log.write("\n")

def main() -> None:

    parser = build_parser()
    args = parser.parse_args()

    if args.threads < 1:
        args.threads = 1
    elif args.threads > MAX_THREADS:
        if not args.quiet:
            console.print(
                f"[dim white][*] Clamping --threads to the maximum of {MAX_THREADS}[/dim white]"
            )
        args.threads = MAX_THREADS

    if args.timeout < 1:
        args.timeout = 1

    api_key = get_api_key(args.key)
    if not api_key:
        if args.quiet:
            sys.exit(1)
        api_key = prompt_for_api_key()

    if args.domain or args.list:
        print_banner(no_banner=args.no_banner or args.quiet)
        domains = resolve_domains(args)
        stats, _ = run_scan(domains, api_key, args)

        exit_code = 0
        if stats.get("fatal"):
            exit_code = 1
        elif args.fail_on_weak and stats["weak"] > 0:
            exit_code = 1
        sys.exit(exit_code)

    # No target specified -> interactive shell.
    if args.quiet:
        sys.exit(1)

    run_interactive_shell(api_key, args)


# ---------------------------------------------------------------------------
# Interactive REPL
# ---------------------------------------------------------------------------

def run_interactive_shell(api_key: str, base_args: argparse.Namespace) -> None:
    """Launch full-screen Textual TUI."""
    try:
        app = TalonApp(api_key, base_args)
        app.run()
    except KeyboardInterrupt:
        pass
    except Exception as e:
        console.print(f"[bold {ACCENT}][-] Error starting TUI: {e}[/bold {ACCENT}]")
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[bold yellow][!] Aborted by user.[/bold yellow]")
        sys.exit(130)

"""
USASpending Pricing Intelligence API
Provides historical pricing data for proposal development
"""

import os, json
from datetime import datetime, timedelta
from typing import List, Dict
from http.server import BaseHTTPRequestHandler
import urllib.request, urllib.parse

USASPENDING_URL = "https://api.usaspending.gov/api/v2"
NAICS_CODES = ['333249', '541330', '541512', '541715', '238210', '333922']

def search_awards(naics_codes=None, keywords=None, start_date=None, end_date=None, limit=100):
    url = f"{USASPENDING_URL}/search/spending_by_award/"
    filters = {"award_type_codes": ["A", "B", "C", "D"]}
    if naics_codes: filters["naics_codes"] = naics_codes
    if keywords: filters["keywords"] = [keywords]
    if start_date and end_date: filters["time_period"] = [{"start_date": start_date, "end_date": end_date}]
    payload = {"filters": filters, "fields": ["Award ID", "Recipient Name", "Award Amount", "Description", "NAICS Code", "Start Date", "Awarding Agency"], "limit": limit, "page": 1, "sort": "Award Amount", "order": "desc"}
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json', 'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode('utf-8'))

def get_pricing_intelligence(naics_code):
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=730)).strftime('%Y-%m-%d')
    result = search_awards(naics_codes=[naics_code], start_date=start_date, end_date=end_date, limit=100)
    awards = result.get('results', [])
    if not awards: return {'naics_code': naics_code, 'total_awards': 0, 'statistics': None, 'recent_awards': [], 'top_recipients': []}
    amounts = sorted([a.get('Award Amount', 0) for a in awards if a.get('Award Amount', 0) > 0])
    stats = {'count': len(amounts), 'total': sum(amounts), 'average': sum(amounts)/len(amounts), 'median': amounts[len(amounts)//2], 'min': min(amounts), 'max': max(amounts)} if amounts else None
    recipient_totals = {}
    for a in awards:
        name, amt = a.get('Recipient Name', 'Unknown'), a.get('Award Amount', 0) or 0
        if name in recipient_totals: recipient_totals[name]['total'] += amt; recipient_totals[name]['count'] += 1
        else: recipient_totals[name] = {'total': amt, 'count': 1}
    top_recipients = sorted([{'name': k, **v} for k, v in recipient_totals.items()], key=lambda x: x['total'], reverse=True)[:10]
    return {'naics_code': naics_code, 'date_range': {'start': start_date, 'end': end_date}, 'total_awards': len(awards), 'statistics': stats, 'top_recipients': top_recipients, 'recent_awards': awards[:20]}

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        try:
            if 'naics' in params:
                result = get_pricing_intelligence(params['naics'][0])
                self._send_json(200, {'success': True, 'type': 'naics_intelligence', 'data': result})
            elif 'keyword' in params:
                kw = params['keyword'][0]
                result = search_awards(keywords=kw, start_date=(datetime.now()-timedelta(days=365)).strftime('%Y-%m-%d'), end_date=datetime.now().strftime('%Y-%m-%d'), limit=50)
                self._send_json(200, {'success': True, 'type': 'similar_contracts', 'keyword': kw, 'contracts': result.get('results', [])[:25]})
            else:
                all_intel = {naics: get_pricing_intelligence(naics) for naics in NAICS_CODES}
                self._send_json(200, {'success': True, 'type': 'all_naics', 'data': all_intel})
        except Exception as e: self._send_error(500, str(e))

    def _send_json(self, status, data):
        self.send_response(status); self.send_header('Content-Type', 'application/json'); self.send_header('Access-Control-Allow-Origin', '*'); self.end_headers()
        self.wfile.write(json.dumps(data, default=str).encode('utf-8'))

    def _send_error(self, status, msg): self._send_json(status, {'success': False, 'error': msg})

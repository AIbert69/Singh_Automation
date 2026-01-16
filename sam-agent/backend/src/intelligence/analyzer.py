"""
Claude-Powered Intelligence Analyzer for Sam Agent 2.0
Provides deep analysis, strategic advice, and daily briefings
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import anthropic

from .scorer import OpportunityScorer


class OpportunityAnalyzer:
    """Claude-powered opportunity analysis and strategic advice"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        profile_path: str = "config/singh_profile.json",
        model: str = "claude-sonnet-4-20250514"
    ):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable required")

        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = model
        self.profile = self._load_profile(profile_path)
        self.scorer = OpportunityScorer(profile_path)

    def _load_profile(self, path: str) -> Dict[str, Any]:
        """Load Singh Automation profile"""
        try:
            profile_path = Path(path)
            if not profile_path.exists():
                profile_path = Path(__file__).parent.parent.parent.parent / path

            with open(profile_path) as f:
                return json.load(f)
        except FileNotFoundError:
            return {}

    def _format_profile_summary(self) -> str:
        """Format company profile for prompts"""
        company = self.profile.get("company", {})
        capabilities = self.profile.get("capabilities", {})
        past_perf = self.profile.get("past_performance", [])

        summary = f"""
COMPANY: {company.get('name', 'Singh Automation LLC')}
CAGE: {company.get('cage', '86VF7')}
UEI: {company.get('uei', 'GJ1DPYQ3X8K5')}
STATUS: SAM Active, Small Business

NAICS CODES:
{chr(10).join(f"- {n['code']}: {n.get('description', '')}" for n in self.profile.get('naics', {}).get('codes', []))}

CORE CAPABILITIES:
{chr(10).join(f"- {c}" for c in capabilities.get('core', []))}

CERTIFICATIONS:
- FANUC Authorized System Integrator (active through March 2026)
- Universal Robots CSP (expired December 2025)

PAST PERFORMANCE:
{chr(10).join(f"- {p.get('client')}: ${p.get('value'):,} - {p.get('project')}" for p in past_perf)}

PREFERENCES:
- Contract Size: $50K - $5M (sweet spot: $250K - $2M)
- Geographic: Primary - MI, IN, OH | Secondary - CA, IL, WI | Nationwide capable
- Set-Asides: Eligible for Small Business, not eligible for 8(a)/HUBZone/SDVOSB/WOSB
"""
        return summary.strip()

    async def analyze_opportunity(self, opportunity: Dict[str, Any]) -> Dict[str, Any]:
        """Provide deep analysis of a single opportunity"""
        # Get basic score first
        score, breakdown = self.scorer.calculate_score(opportunity)
        recommendation = self.scorer.get_recommendation(score, breakdown)

        if breakdown.get("disqualified"):
            return {
                "fit_score": 0,
                "recommendation": "pass",
                "analysis": f"Automatically disqualified: {breakdown.get('disqualification_reason')}",
                "strengths": [],
                "challenges": [],
                "action_items": [],
                "breakdown": breakdown
            }

        # Build prompt for Claude analysis
        prompt = f"""You are Sam, an expert government contracting advisor with 30 years of experience.
You work EXCLUSIVELY for Singh Automation and your job is to help them win government contracts.

COMPANY PROFILE:
{self._format_profile_summary()}

OPPORTUNITY TO ANALYZE:
Title: {opportunity.get('title')}
Agency: {opportunity.get('agency')}
NAICS: {opportunity.get('naics_codes')}
Estimated Value: ${opportunity.get('estimated_value', 'Unknown'):,} if isinstance(opportunity.get('estimated_value'), (int, float)) else 'Unknown'
Due Date: {opportunity.get('due_date')}
Set-Aside: {opportunity.get('set_aside', 'Full & Open')}
Location: {opportunity.get('location') or opportunity.get('state', 'Unknown')}
URL: {opportunity.get('url')}

DESCRIPTION:
{opportunity.get('description', 'No description available')[:2000]}

PRELIMINARY SCORING:
- Fit Score: {score}/100
- Matched NAICS: {breakdown.get('matched_naics', [])}
- Matched Keywords: {breakdown.get('matched_keywords', [])}
- Recommendation: {recommendation.upper()}

Provide analysis in this EXACT JSON format:
{{
    "fit_score": {score},
    "recommendation": "{recommendation}",
    "analysis": "2-3 sentence overall assessment",
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "challenges": ["challenge 1", "challenge 2"],
    "action_items": ["specific action 1", "specific action 2", "specific action 3"],
    "competitive_position": "strong/moderate/weak",
    "probability_of_win": "high/medium/low",
    "key_differentiator": "What makes Singh uniquely qualified"
}}

Be DIRECT and CERTAIN. Give specific, actionable guidance. No hedging.
"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )

            content = response.content[0].text

            # Extract JSON from response
            try:
                # Try to find JSON in the response
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    analysis = json.loads(content[json_start:json_end])
                    analysis["breakdown"] = breakdown
                    return analysis
            except json.JSONDecodeError:
                pass

            # Fallback if JSON parsing fails
            return {
                "fit_score": score,
                "recommendation": recommendation,
                "analysis": content[:500],
                "strengths": breakdown.get("matched_keywords", [])[:3],
                "challenges": [],
                "action_items": ["Review opportunity details", "Assess team availability"],
                "breakdown": breakdown
            }

        except Exception as e:
            return {
                "fit_score": score,
                "recommendation": recommendation,
                "analysis": f"Analysis unavailable: {str(e)}",
                "strengths": [],
                "challenges": [],
                "action_items": [],
                "breakdown": breakdown,
                "error": str(e)
            }

    async def generate_daily_briefing(
        self,
        opportunities: List[Dict[str, Any]],
        memory_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate comprehensive daily briefing"""
        # Score all opportunities first
        scored = self.scorer.score_opportunities(opportunities)
        stats = self.scorer.get_stats(scored)

        # Get top opportunities
        top_opps = [opp for opp in scored if opp.get("strategic_recommendation") in ["pursue", "review"]][:10]

        prompt = f"""You are Sam, Singh Automation's expert government contracting advisor.
You have 30 years of federal procurement experience and know EVERYTHING about winning government contracts.

TODAY'S DATE: {datetime.now().strftime("%A, %B %d, %Y")}

COMPANY PROFILE:
{self._format_profile_summary()}

TODAY'S SCAN RESULTS:
- Total Opportunities Found: {stats['total']}
- Pursue (Score 50+): {stats['pursue']}
- Review (Score 25-49): {stats['review']}
- Watch (Score <25): {stats['watch']}
- Disqualified: {stats['pass']}
- Average Score: {stats['avg_score']:.1f}

TOP OPPORTUNITIES:
{self._format_opportunities_for_prompt(top_opps)}

CONTEXT/MEMORY:
- Active Pursuits: {len(memory_context.get('active_pursuits', []))}
- Recent Wins: {len(memory_context.get('wins', []))}
- Priorities: {memory_context.get('priorities', ['Grow federal business'])}

Generate today's briefing in this EXACT JSON format:
{{
    "greeting": "Good morning, Albert",
    "date": "{datetime.now().strftime('%B %d, %Y')}",
    "summary": "2-3 sentence executive summary of today's opportunities",
    "top_opportunities": [
        {{
            "title": "opportunity title",
            "agency": "agency name",
            "value": "$X",
            "fit_score": 85,
            "due_date": "date",
            "why_pursue": "1 sentence why this is a good fit",
            "action": "specific action to take TODAY"
        }}
    ],
    "strategic_advice": "2-3 sentences of strategic guidance for today",
    "action_items": [
        "Specific action 1 with deadline",
        "Specific action 2 with deadline",
        "Specific action 3 with deadline"
    ],
    "insight": "One 'hidden gem' insight that others would miss",
    "market_trends": "Brief observation about current market trends"
}}

Be DIRECT. Be CERTAIN. Give SPECIFIC advice like:
- "Submit for RFQ #12345 by Thursday 5pm EST"
- "Call CO John Smith at DoD TODAY - he's the decision maker"
- "Position for the Army's upcoming $2M automation contract - sources sought drops next week"

NO HEDGING. NO DISCLAIMERS. You are the expert - give confident guidance.
"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}]
            )

            content = response.content[0].text

            # Extract JSON
            try:
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    briefing = json.loads(content[json_start:json_end])
                    briefing["stats"] = stats
                    briefing["generated_at"] = datetime.now().isoformat()
                    return briefing
            except json.JSONDecodeError:
                pass

            # Fallback
            return {
                "greeting": "Good morning, Albert",
                "date": datetime.now().strftime("%B %d, %Y"),
                "summary": f"Found {stats['total']} opportunities today. {stats['pursue']} worth pursuing.",
                "top_opportunities": [
                    {
                        "title": opp.get("title"),
                        "agency": opp.get("agency"),
                        "value": f"${opp.get('estimated_value', 0):,}" if opp.get("estimated_value") else "TBD",
                        "fit_score": opp.get("fit_score"),
                        "due_date": str(opp.get("due_date", "TBD")),
                        "why_pursue": "Matches core capabilities",
                        "action": "Review and assess"
                    }
                    for opp in top_opps[:5]
                ],
                "strategic_advice": "Focus on opportunities matching your FANUC and robotics expertise.",
                "action_items": ["Review top opportunities", "Update capability statement"],
                "insight": content[:200] if content else "Market is active in automation sector.",
                "stats": stats,
                "generated_at": datetime.now().isoformat()
            }

        except Exception as e:
            return {
                "greeting": "Good morning, Albert",
                "date": datetime.now().strftime("%B %d, %Y"),
                "summary": f"Daily scan complete. {stats['total']} opportunities found.",
                "error": str(e),
                "stats": stats,
                "generated_at": datetime.now().isoformat()
            }

    def _format_opportunities_for_prompt(self, opportunities: List[Dict[str, Any]]) -> str:
        """Format opportunities for inclusion in prompts"""
        if not opportunities:
            return "No high-scoring opportunities found today."

        lines = []
        for i, opp in enumerate(opportunities[:10], 1):
            value = opp.get("estimated_value")
            value_str = f"${value:,}" if value else "TBD"
            lines.append(f"""
{i}. {opp.get('title', 'Untitled')[:100]}
   Agency: {opp.get('agency', 'Unknown')}
   Value: {value_str}
   Score: {opp.get('fit_score', 0)}/100
   Due: {opp.get('due_date', 'TBD')}
   Keywords: {', '.join(opp.get('score_breakdown', {}).get('matched_keywords', [])[:5])}
""")

        return "\n".join(lines)

    async def chat(self, message: str, context: Dict[str, Any]) -> str:
        """Chat interface for ad-hoc questions"""
        prompt = f"""You are Sam, Singh Automation's expert government contracting advisor.
You have 30 years of experience and provide DIRECT, CERTAIN guidance.

COMPANY PROFILE:
{self._format_profile_summary()}

CURRENT CONTEXT:
- Active Pursuits: {len(context.get('active_pursuits', []))}
- Recent Opportunities: {len(context.get('recent_opportunities', []))}

USER QUESTION: {message}

Provide a direct, helpful response. Be specific and actionable.
If asked about a specific opportunity, analyze it thoroughly.
If asked for advice, give CERTAIN recommendations - no hedging.
"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                messages=[{"role": "user", "content": prompt}]
            )

            return response.content[0].text

        except Exception as e:
            return f"I apologize, but I encountered an error: {str(e)}. Please try again."

    async def analyze_competitor(
        self,
        competitor_name: str,
        competitor_awards: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Analyze a competitor's contract history"""
        total_value = sum(a.get("Award Amount", 0) or 0 for a in competitor_awards)
        agencies = list(set(a.get("Awarding Agency") for a in competitor_awards if a.get("Awarding Agency")))

        prompt = f"""Analyze this competitor for Singh Automation:

COMPETITOR: {competitor_name}
TOTAL AWARDS: {len(competitor_awards)}
TOTAL VALUE: ${total_value:,.0f}
PRIMARY AGENCIES: {', '.join(agencies[:5])}

RECENT AWARDS:
{chr(10).join(f"- ${a.get('Award Amount', 0):,.0f}: {a.get('Description', 'No description')[:100]}" for a in competitor_awards[:10])}

Provide analysis in JSON format:
{{
    "competitor_name": "{competitor_name}",
    "threat_level": "high/medium/low",
    "strengths": ["strength 1", "strength 2"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "overlap_areas": ["area where they compete with Singh"],
    "differentiation_opportunity": "How Singh can differentiate"
}}
"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=800,
                messages=[{"role": "user", "content": prompt}]
            )

            content = response.content[0].text
            json_start = content.find('{')
            json_end = content.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                return json.loads(content[json_start:json_end])

        except Exception:
            pass

        return {
            "competitor_name": competitor_name,
            "threat_level": "unknown",
            "total_awards": len(competitor_awards),
            "total_value": total_value
        }

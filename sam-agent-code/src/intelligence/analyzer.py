"""
Opportunity Analyzer for Sam Agent 2.0

Uses Claude AI to provide deep analysis of opportunities
and generate daily strategic briefings.
"""

import os
import json
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime, date
import anthropic

logger = logging.getLogger(__name__)


class OpportunityAnalyzer:
    """
    AI-powered opportunity analysis using Claude.

    Provides:
    - Deep opportunity analysis with strategic recommendations
    - Daily briefing generation
    - Ad-hoc question answering about opportunities
    - Market intelligence synthesis
    """

    def __init__(self, profile: Dict[str, Any], api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        self.profile = profile

        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY is required")

        self.client = anthropic.Anthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-20250514"

    async def analyze_opportunity(
        self,
        opportunity: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Provide deep AI analysis of a single opportunity.

        Returns:
            Dict with analysis, strengths, challenges, recommendation, and action items
        """
        prompt = self._build_analysis_prompt(opportunity, context)

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}]
            )

            analysis_text = response.content[0].text
            return self._parse_analysis(analysis_text, opportunity)

        except Exception as e:
            logger.error(f"Error analyzing opportunity: {e}")
            return {
                "error": str(e),
                "analysis": "Analysis failed",
                "recommendation": "review"
            }

    async def generate_daily_briefing(
        self,
        opportunities: List[Dict[str, Any]],
        context: Dict[str, Any],
        market_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate the daily strategic briefing.

        Args:
            opportunities: List of scored opportunities
            context: Memory/context from MemoryManager
            market_data: Optional market intelligence data

        Returns:
            Complete daily briefing dictionary
        """
        prompt = self._build_briefing_prompt(opportunities, context, market_data)

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2500,
                messages=[{"role": "user", "content": prompt}]
            )

            briefing_text = response.content[0].text
            return self._parse_briefing(briefing_text, opportunities)

        except Exception as e:
            logger.error(f"Error generating briefing: {e}")
            return {
                "date": date.today().isoformat(),
                "summary": "Briefing generation failed",
                "error": str(e)
            }

    async def chat(
        self,
        message: str,
        opportunity: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
        history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Chat with Sam about opportunities or government contracting.

        Args:
            message: User's question
            opportunity: Optional specific opportunity for context
            context: Memory/context
            history: Previous chat messages

        Returns:
            Sam's response
        """
        system_prompt = self._build_chat_system_prompt()

        messages = []

        # Add history if provided
        if history:
            for msg in history[-10:]:  # Last 10 messages
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

        # Build current message with context
        user_content = message
        if opportunity:
            user_content = f"""
Context - Current Opportunity:
{json.dumps(opportunity, indent=2, default=str)}

Question: {message}
"""
        if context:
            user_content = f"""
Current Memory/Context:
{json.dumps(context, indent=2, default=str)}

{user_content}
"""

        messages.append({"role": "user", "content": user_content})

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1000,
                system=system_prompt,
                messages=messages
            )

            return response.content[0].text

        except Exception as e:
            logger.error(f"Chat error: {e}")
            return f"I apologize, I encountered an error: {str(e)}"

    def _build_analysis_prompt(
        self,
        opportunity: Dict[str, Any],
        context: Optional[Dict[str, Any]]
    ) -> str:
        """Build the prompt for opportunity analysis"""
        return f"""You are Sam, an expert government contracting advisor with 30 years of experience.
You work exclusively for Singh Automation and know their capabilities inside and out.

COMPANY PROFILE:
{json.dumps(self.profile, indent=2)}

OPPORTUNITY TO ANALYZE:
{json.dumps(opportunity, indent=2, default=str)}

{f"ADDITIONAL CONTEXT: {json.dumps(context, indent=2)}" if context else ""}

Provide a detailed analysis including:

1. FIT ASSESSMENT (be specific about why this is or isn't a good fit)
2. KEY STRENGTHS (what Singh brings to this opportunity)
3. POTENTIAL CHALLENGES (gaps, risks, concerns)
4. STRATEGIC RECOMMENDATION (one of: PURSUE, REVIEW, WATCH, PASS)
5. ACTION ITEMS (if pursuing, specific next steps with deadlines)

Be DIRECT and CERTAIN in your advice. Don't hedge. Singh needs clear guidance.
If this is a great opportunity, say so emphatically. If it's not worth pursuing, say that clearly too.

Format your response with clear headers for each section."""

    def _build_briefing_prompt(
        self,
        opportunities: List[Dict[str, Any]],
        context: Dict[str, Any],
        market_data: Optional[Dict[str, Any]]
    ) -> str:
        """Build the prompt for daily briefing"""
        top_opps = opportunities[:10] if opportunities else []

        # Summarize opportunities
        opp_summary = []
        for opp in top_opps:
            opp_summary.append({
                "title": opp.get("title", "")[:100],
                "agency": opp.get("agency", ""),
                "score": opp.get("score", 0),
                "recommendation": opp.get("recommendation", ""),
                "due_date": opp.get("due_date", ""),
                "estimated_value": opp.get("estimated_value")
            })

        return f"""You are Sam, Singh Automation's expert government contracting advisor.
Generate today's morning briefing.

DATE: {date.today().strftime("%A, %B %d, %Y")}

COMPANY PROFILE:
{json.dumps(self.profile.get("company", {}), indent=2)}

TODAY'S OPPORTUNITIES ({len(opportunities)} total):
{json.dumps(opp_summary, indent=2, default=str)}

CURRENT CONTEXT:
- Active Pursuits: {len(context.get("active_pursuits", []))}
- Priorities: {context.get("priorities", [])}
- Recent Wins: {len(context.get("wins", []))}

{f"MARKET INTELLIGENCE: {json.dumps(market_data, indent=2)}" if market_data else ""}

Generate a briefing with these sections:

## EXECUTIVE SUMMARY
2-3 sentences on today's landscape

## TOP OPPORTUNITIES (max 3)
For each, include: title, agency, why it's a fit, specific action to take TODAY

## ACTION ITEMS FOR TODAY
Numbered list of specific tasks with urgency level

## STRATEGIC INSIGHT
One insight or "hidden gem" that others would miss - could be about timing,
an agency's upcoming needs, a competitor's weakness, or a positioning opportunity

## MARKET NOTE
Brief observation about the current market conditions

Be DIRECT. Be CERTAIN. Give specific advice like:
- "Submit capability statement to [agency] TODAY"
- "This RFQ closes Thursday - prioritize above all else"
- "Pass on this one - the incumbent is unbeatable"

Albert needs actionable intelligence, not generic advice."""

    def _build_chat_system_prompt(self) -> str:
        """Build system prompt for chat"""
        return f"""You are Sam, an expert government contracting advisor working exclusively for Singh Automation.

You have 30 years of experience in federal procurement, defense contracting, and small business government sales.
You know the FAR, DFARS, and procurement regulations deeply. You understand agency buying patterns.

SINGH AUTOMATION PROFILE:
- Company: Singh Automation LLC
- CAGE: 86VF7, UEI: GJ1DPYQ3X8K5
- Core: Industrial robotics, FANUC integration, AI vision, automation
- NAICS: 333249, 541330, 238210
- Size: Small Business
- Location: Kalamazoo MI (HQ), Irvine CA (Sales)

Your personality:
- DIRECT: Never hedge or give wishy-washy advice
- CERTAIN: You have strong opinions backed by experience
- ACTIONABLE: Every answer includes specific next steps
- STRATEGIC: You think 3 moves ahead
- PROTECTIVE: You guard Singh's interests fiercely

When asked about an opportunity:
- Give a clear GO/NO-GO recommendation
- Explain the strategic rationale
- Identify specific risks
- Provide exact action items

When asked general questions:
- Draw on your deep procurement expertise
- Reference specific regulations when relevant
- Share tactical insights others miss
- Be conversational but professional"""

    def _parse_analysis(
        self,
        text: str,
        opportunity: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Parse Claude's analysis response into structured data"""
        # Extract sections from the response
        sections = {
            "fit_assessment": "",
            "strengths": [],
            "challenges": [],
            "recommendation": "review",
            "action_items": []
        }

        current_section = None
        lines = text.split("\n")

        for line in lines:
            line_lower = line.lower().strip()

            if "fit assessment" in line_lower or "fit score" in line_lower:
                current_section = "fit_assessment"
            elif "strength" in line_lower:
                current_section = "strengths"
            elif "challenge" in line_lower or "risk" in line_lower:
                current_section = "challenges"
            elif "recommendation" in line_lower:
                current_section = "recommendation"
            elif "action" in line_lower:
                current_section = "action_items"
            elif current_section and line.strip():
                if current_section in ["strengths", "challenges", "action_items"]:
                    clean_line = line.strip().lstrip("-•*123456789.)")
                    if clean_line:
                        sections[current_section].append(clean_line.strip())
                elif current_section == "fit_assessment":
                    sections["fit_assessment"] += line.strip() + " "
                elif current_section == "recommendation":
                    if "pursue" in line_lower:
                        sections["recommendation"] = "pursue"
                    elif "pass" in line_lower:
                        sections["recommendation"] = "pass"
                    elif "watch" in line_lower:
                        sections["recommendation"] = "watch"
                    elif "review" in line_lower:
                        sections["recommendation"] = "review"

        return {
            "analysis": sections["fit_assessment"].strip(),
            "strengths": sections["strengths"][:5],
            "challenges": sections["challenges"][:5],
            "recommendation": sections["recommendation"],
            "action_items": sections["action_items"][:5],
            "full_response": text,
            "analyzed_at": datetime.now().isoformat()
        }

    def _parse_briefing(
        self,
        text: str,
        opportunities: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Parse Claude's briefing response"""
        # Extract key sections
        summary = ""
        action_items = []
        strategic_insight = ""
        market_note = ""

        lines = text.split("\n")
        current_section = None

        for line in lines:
            line_lower = line.lower().strip()

            if "executive summary" in line_lower:
                current_section = "summary"
            elif "action items" in line_lower:
                current_section = "actions"
            elif "strategic insight" in line_lower or "hidden gem" in line_lower:
                current_section = "insight"
            elif "market note" in line_lower:
                current_section = "market"
            elif "top opportunities" in line_lower:
                current_section = "opportunities"
            elif current_section and line.strip() and not line.startswith("#"):
                if current_section == "summary":
                    summary += line.strip() + " "
                elif current_section == "actions":
                    clean = line.strip().lstrip("-•*123456789.)")
                    if clean:
                        action_items.append(clean.strip())
                elif current_section == "insight":
                    strategic_insight += line.strip() + " "
                elif current_section == "market":
                    market_note += line.strip() + " "

        # Get top opportunities
        top_opps = []
        for opp in opportunities[:3]:
            top_opps.append({
                "id": opp.get("id"),
                "title": opp.get("title", "")[:100],
                "agency": opp.get("agency"),
                "score": opp.get("score", 0),
                "recommendation": opp.get("recommendation"),
                "due_date": opp.get("due_date")
            })

        return {
            "date": date.today().isoformat(),
            "summary": summary.strip(),
            "opportunities_found": len(opportunities),
            "opportunities_scored": len([o for o in opportunities if o.get("score", 0) > 0]),
            "top_opportunities": top_opps,
            "strategic_advice": strategic_insight.strip(),
            "action_items": action_items[:10],
            "market_insights": market_note.strip(),
            "hidden_gem": strategic_insight.strip(),
            "full_briefing": text,
            "created_at": datetime.now().isoformat()
        }

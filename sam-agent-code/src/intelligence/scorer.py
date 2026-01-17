"""
Opportunity Scorer for Sam Agent 2.0

Scores opportunities based on fit with Singh Automation's profile.
Uses a point-based system with configurable weights.
"""

import json
import logging
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


class OpportunityScorer:
    """
    Scores opportunities against Singh Automation's profile.

    Scoring breakdown (default weights):
    - NAICS match: 30 points (exact) / 15 points (partial)
    - Keyword matches: 5 points each (max 25)
    - Set-aside advantage: 20 points (small business)
    - Geographic fit: 10 points (primary) / 5 points (secondary)
    - Contract size fit: 25 points (sweet spot) / 15 points (acceptable)

    Total possible: 100+ points (capped at 100)
    """

    def __init__(self, profile: Dict[str, Any]):
        self.profile = profile
        self.scoring = profile.get("scoring", {})
        self.thresholds = profile.get("thresholds", {
            "pursue": 50,
            "review": 25,
            "pass": 0
        })

        # Load scoring weights
        self.naics_exact = self.scoring.get("naics_exact", 30)
        self.naics_partial = self.scoring.get("naics_partial", 15)
        self.keyword_match = self.scoring.get("keyword_match", 5)
        self.keyword_max = self.scoring.get("keyword_max", 25)
        self.setaside_small = self.scoring.get("setaside_small_business", 20)
        self.geo_primary = self.scoring.get("geography_primary", 10)
        self.geo_secondary = self.scoring.get("geography_secondary", 5)
        self.size_sweet = self.scoring.get("size_sweet_spot", 25)
        self.size_acceptable = self.scoring.get("size_acceptable", 15)

    def score(self, opportunity: Dict[str, Any]) -> Dict[str, Any]:
        """
        Score an opportunity and return detailed breakdown.

        Args:
            opportunity: Normalized opportunity dictionary

        Returns:
            Dict with score, breakdown, recommendation, and reasons
        """
        breakdown = {}
        reasons = []
        disqualified = False
        disqualification_reason = None

        # Check for disqualification first
        disqualified, disqualification_reason = self._check_disqualification(opportunity)
        if disqualified:
            return {
                "score": 0,
                "breakdown": {},
                "recommendation": "pass",
                "reasons": [disqualification_reason],
                "disqualified": True,
                "disqualification_reason": disqualification_reason
            }

        # NAICS scoring
        naics_score, naics_reason = self._score_naics(opportunity)
        breakdown["naics"] = naics_score
        if naics_reason:
            reasons.append(naics_reason)

        # Keyword scoring
        keyword_score, keyword_reason = self._score_keywords(opportunity)
        breakdown["keywords"] = keyword_score
        if keyword_reason:
            reasons.append(keyword_reason)

        # Set-aside scoring
        setaside_score, setaside_reason = self._score_setaside(opportunity)
        breakdown["set_aside"] = setaside_score
        if setaside_reason:
            reasons.append(setaside_reason)

        # Geographic scoring
        geo_score, geo_reason = self._score_geography(opportunity)
        breakdown["geography"] = geo_score
        if geo_reason:
            reasons.append(geo_reason)

        # Contract size scoring
        size_score, size_reason = self._score_size(opportunity)
        breakdown["contract_size"] = size_score
        if size_reason:
            reasons.append(size_reason)

        # Calculate total (capped at 100)
        total_score = min(sum(breakdown.values()), 100)

        # Determine recommendation
        recommendation = self._get_recommendation(total_score)

        return {
            "score": total_score,
            "breakdown": breakdown,
            "recommendation": recommendation,
            "reasons": reasons,
            "disqualified": False,
            "disqualification_reason": None
        }

    def score_batch(self, opportunities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Score multiple opportunities"""
        scored = []
        for opp in opportunities:
            result = self.score(opp)
            opp_with_score = {**opp, **result}
            scored.append(opp_with_score)

        # Sort by score descending
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored

    def filter_by_recommendation(
        self,
        opportunities: List[Dict[str, Any]],
        recommendations: List[str]
    ) -> List[Dict[str, Any]]:
        """Filter opportunities by recommendation type"""
        return [
            opp for opp in opportunities
            if opp.get("recommendation") in recommendations
        ]

    def _check_disqualification(self, opportunity: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """Check if opportunity should be automatically disqualified"""
        set_aside = (opportunity.get("set_aside") or "").lower()
        ineligible = [sa.lower() for sa in self.profile.get("ineligible_setasides", [])]

        for inel in ineligible:
            if inel in set_aside:
                return True, f"Ineligible set-aside: {inel.upper()}"

        return False, None

    def _score_naics(self, opportunity: Dict[str, Any]) -> Tuple[int, Optional[str]]:
        """Score NAICS code match"""
        opp_naics = set(opportunity.get("naics_codes", []))
        target_naics = set(self.profile.get("naics", []))

        if not opp_naics:
            return 0, None

        # Check for exact match
        if opp_naics & target_naics:
            matched = opp_naics & target_naics
            return self.naics_exact, f"Exact NAICS match: {', '.join(matched)}"

        # Check for partial match (first 4 digits)
        for target in target_naics:
            for opp_code in opp_naics:
                if opp_code[:4] == target[:4]:
                    return self.naics_partial, f"Partial NAICS match: {opp_code} ~ {target}"

        return 0, None

    def _score_keywords(self, opportunity: Dict[str, Any]) -> Tuple[int, Optional[str]]:
        """Score keyword matches in title and description"""
        text = f"{opportunity.get('title', '')} {opportunity.get('description', '')}".lower()
        keywords = [kw.lower() for kw in self.profile.get("keywords", [])]
        exclude = [kw.lower() for kw in self.profile.get("exclude_keywords", [])]

        # Check for excluded keywords (penalty)
        for ex in exclude:
            if ex in text:
                return 0, f"Contains excluded keyword: {ex}"

        # Count matches
        matched = [kw for kw in keywords if kw in text]
        if not matched:
            return 0, None

        score = min(len(matched) * self.keyword_match, self.keyword_max)
        return score, f"Keyword matches ({len(matched)}): {', '.join(matched[:5])}"

    def _score_setaside(self, opportunity: Dict[str, Any]) -> Tuple[int, Optional[str]]:
        """Score set-aside type"""
        set_aside = (opportunity.get("set_aside") or "").lower()

        if not set_aside:
            return 0, "Full and open competition"

        if "small business" in set_aside or "sb" in set_aside:
            if "8(a)" not in set_aside and "hubzone" not in set_aside:
                return self.setaside_small, "Small Business set-aside eligible"

        return 0, None

    def _score_geography(self, opportunity: Dict[str, Any]) -> Tuple[int, Optional[str]]:
        """Score geographic fit"""
        state = opportunity.get("state", "")
        geo_pref = self.profile.get("geographic_preference", {})
        primary = geo_pref.get("primary", [])
        secondary = geo_pref.get("secondary", [])

        if not state:
            return 0, None

        if state in primary:
            return self.geo_primary, f"Primary geographic area: {state}"

        if state in secondary:
            return self.geo_secondary, f"Secondary geographic area: {state}"

        return 0, None

    def _score_size(self, opportunity: Dict[str, Any]) -> Tuple[int, Optional[str]]:
        """Score contract size fit"""
        value = opportunity.get("estimated_value")
        if not value:
            return 0, "Contract value not specified"

        size_config = self.profile.get("contract_size", {})
        min_val = size_config.get("min", 50000)
        max_val = size_config.get("max", 5000000)
        sweet_spot = size_config.get("sweet_spot", [250000, 2000000])

        if sweet_spot[0] <= value <= sweet_spot[1]:
            return self.size_sweet, f"Sweet spot size: ${value:,.0f}"

        if min_val <= value <= max_val:
            return self.size_acceptable, f"Acceptable size: ${value:,.0f}"

        if value < min_val:
            return 0, f"Below minimum: ${value:,.0f} < ${min_val:,.0f}"

        if value > max_val:
            return 0, f"Above maximum: ${value:,.0f} > ${max_val:,.0f}"

        return 0, None

    def _get_recommendation(self, score: int) -> str:
        """Get recommendation based on score"""
        if score >= self.thresholds.get("pursue", 50):
            return "pursue"
        elif score >= self.thresholds.get("review", 25):
            return "review"
        else:
            return "watch"

    def get_top_opportunities(
        self,
        opportunities: List[Dict[str, Any]],
        top_n: int = 10
    ) -> List[Dict[str, Any]]:
        """Get top N opportunities by score"""
        scored = self.score_batch(opportunities)
        return scored[:top_n]

    def summarize_batch(self, opportunities: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate summary statistics for a batch of opportunities"""
        if not opportunities:
            return {"total": 0, "by_recommendation": {}}

        scored = self.score_batch(opportunities)

        by_rec = {"pursue": 0, "review": 0, "watch": 0, "pass": 0}
        scores = []

        for opp in scored:
            rec = opp.get("recommendation", "watch")
            by_rec[rec] = by_rec.get(rec, 0) + 1
            scores.append(opp.get("score", 0))

        return {
            "total": len(scored),
            "by_recommendation": by_rec,
            "avg_score": sum(scores) / len(scores) if scores else 0,
            "max_score": max(scores) if scores else 0,
            "min_score": min(scores) if scores else 0
        }

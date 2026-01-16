"""
Opportunity Scoring Engine for Sam Agent 2.0
Calculates fit scores based on multiple factors
"""

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


class OpportunityScorer:
    """Scores opportunities against Singh Automation's profile"""

    def __init__(self, profile_path: str = "config/singh_profile.json"):
        self.profile = self._load_profile(profile_path)
        self.weights = self.profile.get("scoring", {}).get("weights", {
            "naics_match": 30,
            "keyword_match": 5,
            "set_aside_match": 20,
            "geographic_match": 10,
            "size_fit": 25,
            "past_performance_relevance": 10
        })
        self.thresholds = self.profile.get("scoring", {}).get("thresholds", {
            "go": 50,
            "review": 25,
            "pass": 0
        })

    def _load_profile(self, path: str) -> Dict[str, Any]:
        """Load Singh Automation profile"""
        try:
            profile_path = Path(path)
            if not profile_path.exists():
                profile_path = Path(__file__).parent.parent.parent.parent / path

            with open(profile_path) as f:
                return json.load(f)
        except FileNotFoundError:
            return self._default_profile()

    def _default_profile(self) -> Dict[str, Any]:
        """Default profile if file not found"""
        return {
            "naics": {"codes": [{"code": "333249"}, {"code": "541330"}, {"code": "238210"}]},
            "keywords": {
                "include": ["robotics", "automation", "FANUC", "PLC", "manufacturing"],
                "exclude": ["construction", "janitorial"]
            },
            "contract_preferences": {
                "size": {"minimum": 50000, "maximum": 5000000, "sweet_spot": {"min": 250000, "max": 2000000}},
                "set_asides": {
                    "eligible": ["Small Business", "Total Small Business Set-Aside"],
                    "not_eligible": ["8(a)", "HUBZone", "SDVOSB", "WOSB", "EDWOSB"]
                }
            },
            "geographic_preferences": {
                "primary_states": ["MI", "IN", "OH"],
                "secondary_states": ["CA", "IL", "WI"]
            }
        }

    @property
    def naics_codes(self) -> List[str]:
        """Get NAICS codes from profile"""
        return [n["code"] for n in self.profile.get("naics", {}).get("codes", [])]

    @property
    def include_keywords(self) -> List[str]:
        """Get include keywords from profile"""
        return self.profile.get("keywords", {}).get("include", [])

    @property
    def exclude_keywords(self) -> List[str]:
        """Get exclude keywords from profile"""
        return self.profile.get("keywords", {}).get("exclude", [])

    @property
    def eligible_set_asides(self) -> List[str]:
        """Get eligible set-aside types"""
        return self.profile.get("contract_preferences", {}).get("set_asides", {}).get("eligible", [])

    @property
    def ineligible_set_asides(self) -> List[str]:
        """Get ineligible set-aside types"""
        return self.profile.get("contract_preferences", {}).get("set_asides", {}).get("not_eligible", [])

    def calculate_score(self, opportunity: Dict[str, Any]) -> Tuple[int, Dict[str, Any]]:
        """
        Calculate fit score for an opportunity

        Returns:
            Tuple of (score, breakdown dict)
        """
        breakdown = {
            "naics_score": 0,
            "keyword_score": 0,
            "set_aside_score": 0,
            "geographic_score": 0,
            "size_score": 0,
            "past_performance_score": 0,
            "disqualified": False,
            "disqualification_reason": None,
            "matched_keywords": [],
            "matched_naics": []
        }

        # Check for disqualification first
        if self._is_disqualified(opportunity):
            breakdown["disqualified"] = True
            breakdown["disqualification_reason"] = self._get_disqualification_reason(opportunity)
            return 0, breakdown

        # Check for exclude keywords
        text = self._get_searchable_text(opportunity)
        for keyword in self.exclude_keywords:
            if keyword.lower() in text.lower():
                breakdown["disqualified"] = True
                breakdown["disqualification_reason"] = f"Contains excluded keyword: {keyword}"
                return 0, breakdown

        # Calculate component scores
        breakdown["naics_score"], breakdown["matched_naics"] = self._score_naics(opportunity)
        breakdown["keyword_score"], breakdown["matched_keywords"] = self._score_keywords(opportunity)
        breakdown["set_aside_score"] = self._score_set_aside(opportunity)
        breakdown["geographic_score"] = self._score_geographic(opportunity)
        breakdown["size_score"] = self._score_contract_size(opportunity)
        breakdown["past_performance_score"] = self._score_past_performance(opportunity)

        total_score = (
            breakdown["naics_score"] +
            breakdown["keyword_score"] +
            breakdown["set_aside_score"] +
            breakdown["geographic_score"] +
            breakdown["size_score"] +
            breakdown["past_performance_score"]
        )

        return min(total_score, 100), breakdown

    def _is_disqualified(self, opportunity: Dict[str, Any]) -> bool:
        """Check if opportunity should be automatically disqualified"""
        set_aside = (opportunity.get("set_aside") or "").lower()

        for ineligible in self.ineligible_set_asides:
            if ineligible.lower() in set_aside:
                return True

        return False

    def _get_disqualification_reason(self, opportunity: Dict[str, Any]) -> str:
        """Get the reason for disqualification"""
        set_aside = (opportunity.get("set_aside") or "").lower()

        for ineligible in self.ineligible_set_asides:
            if ineligible.lower() in set_aside:
                return f"Set-aside type not eligible: {ineligible}"

        return "Unknown disqualification"

    def _get_searchable_text(self, opportunity: Dict[str, Any]) -> str:
        """Combine title and description for keyword searching"""
        parts = [
            opportunity.get("title") or "",
            opportunity.get("description") or ""
        ]
        return " ".join(parts)

    def _score_naics(self, opportunity: Dict[str, Any]) -> Tuple[int, List[str]]:
        """Score based on NAICS code match"""
        opp_naics = opportunity.get("naics_codes") or []
        if not opp_naics:
            return 0, []

        matched = []
        max_weight = self.weights.get("naics_match", 30)

        for code in opp_naics:
            if code in self.naics_codes:
                matched.append(code)
                return max_weight, matched  # Full match

            # Partial match (first 4 digits - industry group)
            for our_code in self.naics_codes:
                if code[:4] == our_code[:4]:
                    matched.append(f"{code} (partial match with {our_code})")
                    return int(max_weight * 0.5), matched  # Half score for partial

        return 0, matched

    def _score_keywords(self, opportunity: Dict[str, Any]) -> Tuple[int, List[str]]:
        """Score based on keyword matches"""
        text = self._get_searchable_text(opportunity).lower()
        matched = []
        keyword_weight = self.weights.get("keyword_match", 5)

        for keyword in self.include_keywords:
            if keyword.lower() in text:
                matched.append(keyword)

        # Cap at reasonable maximum (5 keywords = 25 points)
        score = min(len(matched) * keyword_weight, 25)

        return score, matched

    def _score_set_aside(self, opportunity: Dict[str, Any]) -> int:
        """Score based on set-aside type"""
        set_aside = (opportunity.get("set_aside") or "").lower()

        if not set_aside:
            return 0  # Full & Open, no preference

        for eligible in self.eligible_set_asides:
            if eligible.lower() in set_aside:
                return self.weights.get("set_aside_match", 20)

        return 0

    def _score_geographic(self, opportunity: Dict[str, Any]) -> int:
        """Score based on geographic location"""
        state = opportunity.get("state") or ""
        geo_prefs = self.profile.get("geographic_preferences", {})
        max_weight = self.weights.get("geographic_match", 10)

        if state in geo_prefs.get("primary_states", []):
            return max_weight
        elif state in geo_prefs.get("secondary_states", []):
            return int(max_weight * 0.5)
        elif geo_prefs.get("nationwide", True):
            return int(max_weight * 0.25)  # Some credit for nationwide capability

        return 0

    def _score_contract_size(self, opportunity: Dict[str, Any]) -> int:
        """Score based on contract size fit"""
        value = opportunity.get("estimated_value")
        if not value:
            return int(self.weights.get("size_fit", 25) * 0.5)  # Unknown, give half credit

        size_prefs = self.profile.get("contract_preferences", {}).get("size", {})
        min_val = size_prefs.get("minimum", 50000)
        max_val = size_prefs.get("maximum", 5000000)
        sweet_spot = size_prefs.get("sweet_spot", {"min": 250000, "max": 2000000})
        max_weight = self.weights.get("size_fit", 25)

        # In sweet spot = full points
        if sweet_spot["min"] <= value <= sweet_spot["max"]:
            return max_weight

        # Within acceptable range = partial points
        if min_val <= value <= max_val:
            return int(max_weight * 0.6)

        # Too small
        if value < min_val:
            return int(max_weight * 0.25)

        # Too large (might still consider with teaming)
        if value > max_val:
            return int(max_weight * 0.3)

        return 0

    def _score_past_performance(self, opportunity: Dict[str, Any]) -> int:
        """Score based on relevance to past performance"""
        # Check if any NAICS codes match past performance
        opp_naics = opportunity.get("naics_codes") or []
        past_perf = self.profile.get("past_performance", [])
        max_weight = self.weights.get("past_performance_relevance", 10)

        for perf in past_perf:
            relevant_naics = perf.get("relevant_naics", [])
            for code in opp_naics:
                if code in relevant_naics:
                    return max_weight

        return 0

    def get_recommendation(self, score: int, breakdown: Dict[str, Any]) -> str:
        """Get strategic recommendation based on score"""
        if breakdown.get("disqualified"):
            return "pass"

        if score >= self.thresholds.get("go", 50):
            return "pursue"
        elif score >= self.thresholds.get("review", 25):
            return "review"
        else:
            return "watch"

    def score_opportunities(
        self,
        opportunities: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Score and annotate multiple opportunities"""
        scored = []

        for opp in opportunities:
            score, breakdown = self.calculate_score(opp)
            recommendation = self.get_recommendation(score, breakdown)

            scored_opp = {
                **opp,
                "fit_score": score,
                "score_breakdown": breakdown,
                "strategic_recommendation": recommendation
            }
            scored.append(scored_opp)

        # Sort by score descending
        scored.sort(key=lambda x: x["fit_score"], reverse=True)

        return scored

    def filter_by_recommendation(
        self,
        opportunities: List[Dict[str, Any]],
        recommendations: List[str]
    ) -> List[Dict[str, Any]]:
        """Filter opportunities by recommendation type"""
        return [
            opp for opp in opportunities
            if opp.get("strategic_recommendation") in recommendations
        ]

    def get_stats(self, scored_opportunities: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get scoring statistics"""
        if not scored_opportunities:
            return {
                "total": 0,
                "pursue": 0,
                "review": 0,
                "watch": 0,
                "pass": 0,
                "avg_score": 0
            }

        recommendations = [opp.get("strategic_recommendation") for opp in scored_opportunities]
        scores = [opp.get("fit_score", 0) for opp in scored_opportunities]

        return {
            "total": len(scored_opportunities),
            "pursue": recommendations.count("pursue"),
            "review": recommendations.count("review"),
            "watch": recommendations.count("watch"),
            "pass": recommendations.count("pass"),
            "avg_score": sum(scores) / len(scores) if scores else 0,
            "max_score": max(scores) if scores else 0,
            "min_score": min(scores) if scores else 0
        }

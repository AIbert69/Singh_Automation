"""
Tests for Opportunity Scoring Engine
"""

import pytest
from src.intelligence.scorer import OpportunityScorer


@pytest.fixture
def scorer():
    """Create scorer with test profile"""
    return OpportunityScorer()


@pytest.fixture
def sample_opportunity():
    """Sample opportunity for testing"""
    return {
        "title": "Industrial Robotics System Installation",
        "description": "Seeking contractor for FANUC robotics integration and PLC control systems",
        "naics_codes": ["333249"],
        "agency": "Department of Defense",
        "estimated_value": 500000,
        "state": "MI",
        "set_aside": "Total Small Business Set-Aside",
        "due_date": "2026-02-15T17:00:00Z"
    }


class TestOpportunityScorer:
    """Tests for OpportunityScorer class"""

    def test_scorer_initialization(self, scorer):
        """Test scorer initializes correctly"""
        assert scorer is not None
        assert len(scorer.naics_codes) > 0
        assert len(scorer.include_keywords) > 0

    def test_perfect_match_opportunity(self, scorer, sample_opportunity):
        """Test scoring for a perfect match opportunity"""
        score, breakdown = scorer.calculate_score(sample_opportunity)

        assert score >= 70, f"Perfect match should score high, got {score}"
        assert breakdown["naics_score"] == 30, "NAICS should match fully"
        assert breakdown["set_aside_score"] == 20, "Set-aside should match"
        assert breakdown["geographic_score"] == 10, "Geographic should match"
        assert not breakdown["disqualified"]

    def test_disqualified_opportunity(self, scorer):
        """Test automatic disqualification for ineligible set-asides"""
        opportunity = {
            "title": "Robotics System",
            "naics_codes": ["333249"],
            "set_aside": "8(a) Sole Source",
            "estimated_value": 500000
        }

        score, breakdown = scorer.calculate_score(opportunity)

        assert score == 0, "Disqualified opportunities should score 0"
        assert breakdown["disqualified"] is True
        assert "8(a)" in breakdown["disqualification_reason"]

    def test_keyword_matching(self, scorer):
        """Test keyword matching in title and description"""
        opportunity = {
            "title": "FANUC Robot Integration Project",
            "description": "PLC programming and SCADA integration for automation system",
            "naics_codes": [],
            "estimated_value": 300000
        }

        score, breakdown = scorer.calculate_score(opportunity)

        assert len(breakdown["matched_keywords"]) >= 3
        assert "FANUC" in breakdown["matched_keywords"]
        assert breakdown["keyword_score"] > 0

    def test_exclude_keyword_disqualification(self, scorer):
        """Test disqualification for exclude keywords"""
        opportunity = {
            "title": "Janitorial Services for Federal Building",
            "description": "Building cleaning and maintenance services",
            "naics_codes": [],
            "estimated_value": 100000
        }

        score, breakdown = scorer.calculate_score(opportunity)

        assert score == 0
        assert breakdown["disqualified"] is True
        assert "janitorial" in breakdown["disqualification_reason"].lower()

    def test_contract_size_scoring(self, scorer):
        """Test contract size scoring tiers"""
        # Sweet spot ($250K - $2M)
        opp_sweet = {"naics_codes": ["333249"], "estimated_value": 500000}
        score_sweet, breakdown_sweet = scorer.calculate_score(opp_sweet)
        assert breakdown_sweet["size_score"] == 25

        # Within range but not sweet spot
        opp_range = {"naics_codes": ["333249"], "estimated_value": 100000}
        score_range, breakdown_range = scorer.calculate_score(opp_range)
        assert breakdown_range["size_score"] < 25
        assert breakdown_range["size_score"] > 0

        # Unknown value
        opp_unknown = {"naics_codes": ["333249"], "estimated_value": None}
        score_unknown, breakdown_unknown = scorer.calculate_score(opp_unknown)
        assert breakdown_unknown["size_score"] > 0  # Partial credit

    def test_geographic_scoring(self, scorer):
        """Test geographic preference scoring"""
        # Primary state
        opp_mi = {"naics_codes": ["333249"], "state": "MI", "estimated_value": 500000}
        _, breakdown_mi = scorer.calculate_score(opp_mi)
        assert breakdown_mi["geographic_score"] == 10

        # Secondary state
        opp_ca = {"naics_codes": ["333249"], "state": "CA", "estimated_value": 500000}
        _, breakdown_ca = scorer.calculate_score(opp_ca)
        assert breakdown_ca["geographic_score"] == 5

        # Other state (nationwide capable)
        opp_other = {"naics_codes": ["333249"], "state": "FL", "estimated_value": 500000}
        _, breakdown_other = scorer.calculate_score(opp_other)
        assert breakdown_other["geographic_score"] >= 0

    def test_recommendation_thresholds(self, scorer):
        """Test recommendation determination"""
        high_opportunity = {
            "title": "FANUC Robotics Integration",
            "naics_codes": ["333249"],
            "estimated_value": 500000,
            "state": "MI",
            "set_aside": "Small Business"
        }
        score, breakdown = scorer.calculate_score(high_opportunity)
        rec = scorer.get_recommendation(score, breakdown)
        assert rec == "pursue"

        low_opportunity = {
            "title": "Generic services",
            "naics_codes": ["999999"],
            "estimated_value": 10000,
            "state": "AK"
        }
        score, breakdown = scorer.calculate_score(low_opportunity)
        rec = scorer.get_recommendation(score, breakdown)
        assert rec in ["watch", "review"]

    def test_batch_scoring(self, scorer, sample_opportunity):
        """Test batch scoring of multiple opportunities"""
        opportunities = [
            sample_opportunity,
            {
                "title": "Office Supplies",
                "naics_codes": ["339940"],
                "estimated_value": 50000
            },
            {
                "title": "PLC Control System Upgrade",
                "naics_codes": ["541330"],
                "estimated_value": 300000,
                "state": "IN"
            }
        ]

        scored = scorer.score_opportunities(opportunities)

        assert len(scored) == 3
        # Should be sorted by score descending
        assert scored[0]["fit_score"] >= scored[1]["fit_score"]
        assert scored[1]["fit_score"] >= scored[2]["fit_score"]
        # Each should have recommendation
        assert all("strategic_recommendation" in opp for opp in scored)

    def test_stats_calculation(self, scorer):
        """Test statistics calculation"""
        opportunities = [
            {"fit_score": 75, "strategic_recommendation": "pursue"},
            {"fit_score": 60, "strategic_recommendation": "pursue"},
            {"fit_score": 35, "strategic_recommendation": "review"},
            {"fit_score": 15, "strategic_recommendation": "watch"},
            {"fit_score": 0, "strategic_recommendation": "pass"}
        ]

        stats = scorer.get_stats(opportunities)

        assert stats["total"] == 5
        assert stats["pursue"] == 2
        assert stats["review"] == 1
        assert stats["watch"] == 1
        assert stats["pass"] == 1
        assert stats["avg_score"] == 37.0

    def test_empty_opportunities(self, scorer):
        """Test handling of empty opportunity list"""
        stats = scorer.get_stats([])

        assert stats["total"] == 0
        assert stats["avg_score"] == 0


class TestNAICSMatching:
    """Tests specifically for NAICS code matching"""

    def test_exact_naics_match(self, scorer):
        """Test exact NAICS code matching"""
        opp = {"naics_codes": ["333249"], "estimated_value": 500000}
        _, breakdown = scorer.calculate_score(opp)
        assert breakdown["naics_score"] == 30
        assert "333249" in breakdown["matched_naics"]

    def test_partial_naics_match(self, scorer):
        """Test partial NAICS matching (same industry group)"""
        opp = {"naics_codes": ["333248"], "estimated_value": 500000}  # Same group as 333249
        _, breakdown = scorer.calculate_score(opp)
        assert breakdown["naics_score"] == 15
        assert len(breakdown["matched_naics"]) > 0

    def test_no_naics_match(self, scorer):
        """Test no NAICS code match"""
        opp = {"naics_codes": ["999999"], "estimated_value": 500000}
        _, breakdown = scorer.calculate_score(opp)
        assert breakdown["naics_score"] == 0

    def test_multiple_naics_codes(self, scorer):
        """Test opportunity with multiple NAICS codes"""
        opp = {"naics_codes": ["999999", "333249", "111111"], "estimated_value": 500000}
        _, breakdown = scorer.calculate_score(opp)
        assert breakdown["naics_score"] == 30  # Should find the matching one


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

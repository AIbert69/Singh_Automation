"""
Singh Automation Platform - Proposal Generator
Generates proposal content by querying the database and merging with templates.

Usage:
    from proposal_generator import ProposalGenerator
    
    generator = ProposalGenerator(db_path='singh_platform.db')
    proposal = generator.generate(
        opportunity_id=123,
        solicitation_number='TACOM-FY25-WELD',
        title='Army Depot Welding Cells',
        naics='333249',
        tags=['welding', 'robotics', 'DoD']
    )
"""

import sqlite3
from datetime import datetime
from typing import List, Dict, Optional
import json


class ProposalGenerator:
    def __init__(self, db_path: str = 'singh_platform.db'):
        self.db_path = db_path
    
    def _get_connection(self):
        return sqlite3.connect(self.db_path)
    
    # =========================================================================
    # COMPANY PROFILE
    # =========================================================================
    
    def get_company_profile(self) -> Dict:
        """Get complete company profile for proposal boilerplate."""
        conn = self._get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM company_profile LIMIT 1")
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return {}
    
    # =========================================================================
    # KEY PERSONNEL
    # =========================================================================
    
    def get_personnel_by_role(self, role: str) -> Optional[Dict]:
        """Get personnel matching a proposal role."""
        conn = self._get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM key_personnel 
            WHERE proposal_role = ? AND is_key_personnel = TRUE
            LIMIT 1
        """, (role,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None
    
    def get_all_key_personnel(self) -> List[Dict]:
        """Get all key personnel for proposals."""
        conn = self._get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM key_personnel 
            WHERE is_key_personnel = TRUE
            ORDER BY 
                CASE role_category 
                    WHEN 'Executive' THEN 1 
                    WHEN 'Technical' THEN 2 
                    WHEN 'Operations' THEN 3 
                    WHEN 'QA' THEN 4 
                END
        """)
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def format_personnel_section(self, roles_needed: List[str]) -> str:
        """Generate formatted key personnel section."""
        output = []
        
        for role in roles_needed:
            person = self.get_personnel_by_role(role)
            if person:
                output.append(f"""
### {role}: {person['first_name']} {person['last_name']}

**Current Position:** {person['title']}, Singh Automation LLC

**Role on Contract:** {person['proposal_responsibility']}

**Experience:** {person['years_experience']}+ years
""")
                if person['prior_employers']:
                    output.append(f"**Prior Experience:** {person['prior_employers']}")
                
                if person['plant_launches']:
                    output.append(f"\n**Notable Projects:** {person['plant_launches']}")
                
                output.append(f"\n> {person['bio_short']}\n")
        
        return "\n".join(output)
    
    def format_personnel_table(self, roles_needed: List[str]) -> str:
        """Generate personnel as markdown table."""
        rows = ["| Role | Name | Title | Responsibility |",
                "|------|------|-------|----------------|"]
        
        for role in roles_needed:
            person = self.get_personnel_by_role(role)
            if person:
                name = f"{person['first_name']} {person['last_name']}"
                resp = person['proposal_responsibility'][:50] + "..." if len(person['proposal_responsibility']) > 50 else person['proposal_responsibility']
                rows.append(f"| {role} | {name} | {person['title']} | {resp} |")
        
        return "\n".join(rows)
    
    # =========================================================================
    # PAST PERFORMANCE
    # =========================================================================
    
    def search_past_performance(self, 
                                 tags: List[str] = None, 
                                 naics: str = None,
                                 min_value: float = None,
                                 limit: int = 3) -> List[Dict]:
        """Search past performance by relevance tags and criteria."""
        conn = self._get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = """
            SELECT * FROM contracts 
            WHERE status = 'COMPLETE'
        """
        params = []
        
        if naics:
            query += " AND naics_code = ?"
            params.append(naics)
        
        if min_value:
            query += " AND contract_value >= ?"
            params.append(min_value)
        
        # Tag matching - score by number of matching tags
        if tags:
            tag_conditions = " OR ".join(["relevance_tags LIKE ?" for _ in tags])
            query += f" AND ({tag_conditions})"
            params.extend([f"%{tag}%" for tag in tags])
        
        query += " ORDER BY contract_value DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        results = []
        for row in rows:
            result = dict(row)
            # Calculate relevance score
            if tags:
                matched = sum(1 for tag in tags if tag.lower() in (result.get('relevance_tags') or '').lower())
                result['relevance_score'] = matched / len(tags)
                result['matched_tags'] = [t for t in tags if t.lower() in (result.get('relevance_tags') or '').lower()]
            results.append(result)
        
        return sorted(results, key=lambda x: x.get('relevance_score', 0), reverse=True)
    
    def format_past_performance_section(self, contracts: List[Dict]) -> str:
        """Generate formatted past performance section."""
        output = []
        
        for i, contract in enumerate(contracts, 1):
            output.append(f"""
### Reference {i}: {contract['project_name']}

| Field | Details |
|-------|---------|
| **Client** | {contract['client_name']} |
| **Contract Value** | ${contract['contract_value']:,.0f} |
| **Period** | {contract.get('period_of_performance', 'N/A')} |
| **NAICS** | {contract.get('naics_code', 'N/A')} |

**Scope of Work:**
{contract.get('scope_summary', 'N/A')}

**Outcomes & Results:**
{contract.get('outcomes', 'N/A')}

**Relevance to Current Requirement:**
Direct alignment with requirement - {', '.join(contract.get('matched_tags', []))}
""")
            
            if contract.get('reference_name'):
                output.append(f"""
**Reference Contact:**
- Name: {contract['reference_name']}
- Title: {contract.get('reference_title', 'N/A')}
- Phone: {contract.get('reference_phone', 'N/A')}
- Email: {contract.get('reference_email', 'N/A')}
""")
        
        return "\n".join(output)
    
    # =========================================================================
    # PRICING
    # =========================================================================
    
    def get_labor_rates(self) -> List[Dict]:
        """Get current labor rate schedule."""
        conn = self._get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM labor_rates
            WHERE effective_date <= date('now')
            ORDER BY labor_category, bill_rate DESC
        """)
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def get_equipment_pricing(self, category: str = None, search: str = None) -> List[Dict]:
        """Search equipment pricing database."""
        conn = self._get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = """
            SELECT * FROM line_items
            WHERE is_standard_item = TRUE AND category = 'EQUIPMENT'
        """
        params = []
        
        if category:
            query += " AND subcategory = ?"
            params.append(category)
        
        if search:
            query += " AND description LIKE ?"
            params.append(f"%{search}%")
        
        query += " ORDER BY subcategory, description"
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def estimate_pricing(self, 
                         equipment_items: List[Dict],
                         labor_hours: Dict[str, int],
                         target_margin: float = 0.25) -> Dict:
        """Generate pricing estimate based on scope."""
        
        # Get equipment costs
        equipment_cost = 0
        equipment_price = 0
        equipment_detail = []
        
        for item in equipment_items:
            pricing = self.get_equipment_pricing(search=item['item'])
            if pricing:
                p = pricing[0]
                qty = item.get('quantity', 1)
                equipment_cost += p['unit_cost'] * qty
                equipment_price += p['unit_price'] * qty
                equipment_detail.append({
                    'item': p['description'],
                    'quantity': qty,
                    'unit_price': p['unit_price'],
                    'total': p['unit_price'] * qty
                })
        
        # Get labor costs
        rates = {r['role_title']: r for r in self.get_labor_rates()}
        labor_cost = 0
        labor_price = 0
        labor_detail = []
        
        role_mapping = {
            'engineering': 'Senior Controls Engineer',
            'programming': 'Robot Programmer',
            'installation': 'Installation Technician',
            'training': 'Field Service Technician',
            'management': 'Project Manager'
        }
        
        for category, hours in labor_hours.items():
            role = role_mapping.get(category, 'Field Service Technician')
            if role in rates:
                r = rates[role]
                labor_cost += r['loaded_rate'] * hours
                labor_price += r['bill_rate'] * hours
                labor_detail.append({
                    'category': category,
                    'role': role,
                    'hours': hours,
                    'rate': r['bill_rate'],
                    'total': r['bill_rate'] * hours
                })
        
        total_cost = equipment_cost + labor_cost
        total_price = equipment_price + labor_price
        actual_margin = (total_price - total_cost) / total_price if total_price > 0 else 0
        
        return {
            'equipment': {
                'cost': equipment_cost,
                'price': equipment_price,
                'detail': equipment_detail
            },
            'labor': {
                'cost': labor_cost,
                'price': labor_price,
                'detail': labor_detail
            },
            'totals': {
                'cost': total_cost,
                'price': total_price,
                'margin_pct': round(actual_margin * 100, 1)
            }
        }
    
    # =========================================================================
    # BOILERPLATE
    # =========================================================================
    
    def get_boilerplate(self, section_name: str) -> Optional[str]:
        """Get boilerplate content by section name."""
        conn = self._get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT content FROM boilerplate
            WHERE section_name = ? AND is_active = TRUE
        """, (section_name,))
        
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return row['content']
        return None
    
    def get_boilerplate_sections(self, section_names: List[str]) -> Dict[str, str]:
        """Get multiple boilerplate sections."""
        return {name: self.get_boilerplate(name) for name in section_names}
    
    # =========================================================================
    # CERTIFICATIONS
    # =========================================================================
    
    def get_certifications(self, cert_type: str = None) -> List[Dict]:
        """Get certifications, optionally filtered by type."""
        conn = self._get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        if cert_type:
            cursor.execute("""
                SELECT * FROM certifications
                WHERE status = 'Active' AND cert_type = ?
            """, (cert_type,))
        else:
            cursor.execute("SELECT * FROM certifications WHERE status = 'Active'")
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    # =========================================================================
    # FULL PROPOSAL GENERATION
    # =========================================================================
    
    def generate(self,
                 solicitation_number: str,
                 title: str,
                 agency: str,
                 naics: str,
                 estimated_value: float = None,
                 tags: List[str] = None,
                 personnel_roles: List[str] = None,
                 custom_content: Dict = None) -> Dict:
        """
        Generate complete proposal content.
        
        Returns a dictionary with all sections populated from database.
        """
        
        # Defaults
        if not personnel_roles:
            personnel_roles = ['Program Manager', 'Technical Lead', 'Operations Lead', 'QA/Compliance Manager']
        
        if not tags:
            tags = []
        
        if not custom_content:
            custom_content = {}
        
        # Get company data
        company = self.get_company_profile()
        
        # Get certifications
        certs = self.get_certifications()
        oem_certs = [c for c in certs if c['cert_type'] == 'OEM']
        biz_certs = [c for c in certs if c['cert_type'] == 'Business']
        
        # Get personnel
        personnel = []
        for role in personnel_roles:
            person = self.get_personnel_by_role(role)
            if person:
                personnel.append({**person, 'assigned_role': role})
        
        # Get past performance
        past_perf = self.search_past_performance(tags=tags, naics=naics, limit=3)
        
        # Get boilerplate
        boilerplate = self.get_boilerplate_sections([
            'company_overview',
            'value_proposition', 
            'technical_methodology',
            'quality_approach',
            'risk_management',
            'safety_approach',
            'communication_plan',
            'warranty_support'
        ])
        
        # Build proposal structure
        proposal = {
            'metadata': {
                'solicitation_number': solicitation_number,
                'title': title,
                'agency': agency,
                'naics': naics,
                'estimated_value': estimated_value,
                'generated_at': datetime.now().isoformat(),
                'company_name': company.get('company_name'),
                'cage': company.get('cage_code'),
                'uei': company.get('uei')
            },
            'sections': {}
        }
        
        # Section 1: Executive Summary
        proposal['sections']['executive_summary'] = {
            'title': 'Executive Summary',
            'content': self._generate_executive_summary(
                company, title, agency, solicitation_number, 
                boilerplate, oem_certs, custom_content
            )
        }
        
        # Section 2: Technical Approach (placeholder - needs RFP-specific content)
        proposal['sections']['technical_approach'] = {
            'title': 'Technical Approach',
            'content': boilerplate.get('technical_methodology', ''),
            'note': 'Customize based on specific RFP requirements'
        }
        
        # Section 3: Management Approach
        proposal['sections']['management_approach'] = {
            'title': 'Management Approach',
            'content': self._generate_management_section(personnel, boilerplate)
        }
        
        # Section 4: Key Personnel
        proposal['sections']['key_personnel'] = {
            'title': 'Key Personnel',
            'content': self.format_personnel_section(personnel_roles),
            'table': self.format_personnel_table(personnel_roles),
            'personnel_data': personnel
        }
        
        # Section 5: Past Performance
        proposal['sections']['past_performance'] = {
            'title': 'Past Performance',
            'content': self.format_past_performance_section(past_perf),
            'contracts': past_perf
        }
        
        # Section 6: Quality Assurance
        proposal['sections']['quality_assurance'] = {
            'title': 'Quality Assurance',
            'content': f"{boilerplate.get('quality_approach', '')}\n\n{boilerplate.get('safety_approach', '')}"
        }
        
        # Section 7: Risk Management
        proposal['sections']['risk_management'] = {
            'title': 'Risk Management',
            'content': boilerplate.get('risk_management', '')
        }
        
        return proposal
    
    def _generate_executive_summary(self, company, title, agency, sol_num, boilerplate, oem_certs, custom):
        """Generate executive summary section."""
        
        cert_list = ", ".join([c['cert_name'] for c in oem_certs])
        
        return f"""
**{company.get('company_name', 'Singh Automation LLC')}** respectfully submits this proposal in response to Solicitation **{sol_num}** for **{title}**. As a **{cert_list}**, we offer proven technical excellence backed by direct OEM partnerships.

## Understanding of the Requirement

{custom.get('understanding', f'{agency} requires an automated solution meeting stringent performance and compliance requirements. Singh Automation has carefully reviewed the solicitation requirements and possesses complete understanding of the technical, schedule, and compliance requirements necessary for successful contract performance.')}

## Summary of Proposed Solution

{boilerplate.get('company_overview', '')}

## Value Proposition

{boilerplate.get('value_proposition', '')}

## Commitment to Performance

*Singh Automation commits to delivering a high-quality automation solution that meets or exceeds all solicitation requirements, on schedule and within budget. Our leadership team is prepared to authorize immediate commencement of work upon contract award.*
"""
    
    def _generate_management_section(self, personnel, boilerplate):
        """Generate management approach section."""
        
        pm = next((p for p in personnel if p.get('assigned_role') == 'Program Manager'), None)
        pm_name = f"{pm['first_name']} {pm['last_name']}" if pm else "TBD"
        
        return f"""
## Program Organization

Singh Automation will establish a dedicated project team with clear lines of authority and direct Government communication channels. **{pm_name}** will serve as Program Manager with full authority for day-to-day contract execution.

## Communication Plan

{boilerplate.get('communication_plan', '')}
"""
    
    def export_markdown(self, proposal: Dict) -> str:
        """Export proposal as clean markdown for Gamma."""
        
        meta = proposal['metadata']
        sections = proposal['sections']
        
        output = f"""# Technical and Management Proposal
## {meta['title']}

**Solicitation:** {meta['solicitation_number']} | **CAGE:** {meta['cage']} | **UEI:** {meta['uei']}

---

"""
        
        for section_key, section in sections.items():
            output += f"## {section['title']}\n\n"
            output += section['content']
            output += "\n\n---\n\n"
        
        return output


# =============================================================================
# CLI USAGE
# =============================================================================

if __name__ == '__main__':
    import sys
    
    # Initialize generator
    generator = ProposalGenerator('singh_platform.db')
    
    # Example: Generate proposal for Army Depot Welding Cells
    proposal = generator.generate(
        solicitation_number='TACOM-FY25-WELD',
        title='Army Depot Welding Cells (Forecast)',
        agency='US Army TACOM',
        naics='333249',
        estimated_value=1800000,
        tags=['welding', 'robotics', 'FANUC', 'vision', 'DoD'],
        personnel_roles=['Program Manager', 'Technical Lead', 'Operations Lead', 'QA/Compliance Manager']
    )
    
    # Export to markdown
    markdown = generator.export_markdown(proposal)
    
    # Print or save
    print(markdown)

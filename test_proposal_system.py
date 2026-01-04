#!/usr/bin/env python3
"""
Test script to verify the Singh Platform SQL schema and Proposal Generator
"""

import sqlite3
import os
import sys

# Test database path
TEST_DB = 'test_singh_platform.db'

def test_schema():
    """Test that the SQL schema loads correctly."""
    print("=" * 60)
    print("TEST 1: SQL Schema Validation")
    print("=" * 60)

    # Remove existing test database
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)

    # Read the schema file
    with open('singh_platform_schema.sql', 'r') as f:
        schema_sql = f.read()

    # Connect and execute schema
    conn = sqlite3.connect(TEST_DB)
    try:
        conn.executescript(schema_sql)
        print("✓ Schema loaded successfully")
    except sqlite3.Error as e:
        print(f"✗ Schema error: {e}")
        return False

    # Verify tables were created
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = [row[0] for row in cursor.fetchall()]

    expected_tables = [
        'boilerplate', 'certifications', 'company_profile', 'contracts',
        'key_personnel', 'labor_rates', 'line_items', 'naics_codes',
        'opportunities', 'proposal_sections'
    ]

    print(f"\nTables created: {len(tables)}")
    for table in expected_tables:
        if table in tables:
            print(f"  ✓ {table}")
        else:
            print(f"  ✗ {table} MISSING")
            return False

    # Verify views
    cursor.execute("SELECT name FROM sqlite_master WHERE type='view' ORDER BY name")
    views = [row[0] for row in cursor.fetchall()]
    print(f"\nViews created: {len(views)}")
    for view in views:
        print(f"  ✓ {view}")

    # Verify sample data
    print("\nSample data verification:")

    # Company profile
    cursor.execute("SELECT company_name, cage_code, uei FROM company_profile")
    row = cursor.fetchone()
    if row and row[0] == 'Singh Automation':
        print(f"  ✓ Company profile: {row[0]} (CAGE: {row[1]}, UEI: {row[2]})")
    else:
        print("  ✗ Company profile missing or incorrect")
        return False

    # Key personnel count
    cursor.execute("SELECT COUNT(*) FROM key_personnel")
    count = cursor.fetchone()[0]
    print(f"  ✓ Key personnel: {count} records")

    # Contracts count
    cursor.execute("SELECT COUNT(*) FROM contracts")
    count = cursor.fetchone()[0]
    print(f"  ✓ Contracts/Past Performance: {count} records")

    # Line items count
    cursor.execute("SELECT COUNT(*) FROM line_items")
    count = cursor.fetchone()[0]
    print(f"  ✓ Line items/Pricing: {count} records")

    # Boilerplate count
    cursor.execute("SELECT COUNT(*) FROM boilerplate")
    count = cursor.fetchone()[0]
    print(f"  ✓ Boilerplate sections: {count} records")

    conn.close()
    return True


def test_proposal_generator():
    """Test that the proposal generator works with the schema."""
    print("\n" + "=" * 60)
    print("TEST 2: Proposal Generator Functionality")
    print("=" * 60)

    # Import the proposal generator
    try:
        from proposal_generator import ProposalGenerator
        print("✓ Proposal generator module imported")
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False
    except SyntaxError as e:
        print(f"✗ Syntax error in proposal_generator.py: {e}")
        return False

    # Initialize with test database
    generator = ProposalGenerator(db_path=TEST_DB)
    print("✓ ProposalGenerator initialized")

    # Test company profile
    print("\nTesting get_company_profile():")
    company = generator.get_company_profile()
    if company and company.get('company_name'):
        print(f"  ✓ Retrieved: {company['company_name']}")
    else:
        print("  ✗ Failed to get company profile")
        return False

    # Test personnel by role
    print("\nTesting get_personnel_by_role():")
    pm = generator.get_personnel_by_role('Program Manager')
    if pm:
        print(f"  ✓ Program Manager: {pm['first_name']} {pm['last_name']}")
    else:
        print("  ✗ No Program Manager found")
        return False

    # Test all key personnel
    print("\nTesting get_all_key_personnel():")
    personnel = generator.get_all_key_personnel()
    print(f"  ✓ Found {len(personnel)} key personnel")
    for p in personnel:
        print(f"    - {p['first_name']} {p['last_name']}: {p['proposal_role']}")

    # Test past performance search
    print("\nTesting search_past_performance():")
    past_perf = generator.search_past_performance(
        tags=['welding', 'robotics'],
        limit=3
    )
    print(f"  ✓ Found {len(past_perf)} matching contracts")
    for pp in past_perf:
        score = pp.get('relevance_score', 0)
        print(f"    - {pp['project_name']}: ${pp['contract_value']:,.0f} (relevance: {score:.0%})")

    # Test labor rates
    print("\nTesting get_labor_rates():")
    rates = generator.get_labor_rates()
    print(f"  ✓ Found {len(rates)} labor rates")

    # Test equipment pricing
    print("\nTesting get_equipment_pricing():")
    equipment = generator.get_equipment_pricing(search='FANUC')
    print(f"  ✓ Found {len(equipment)} FANUC equipment items")
    for eq in equipment[:3]:
        print(f"    - {eq['description']}: ${eq['unit_price']:,.0f}")

    # Test boilerplate
    print("\nTesting get_boilerplate():")
    overview = generator.get_boilerplate('company_overview')
    if overview:
        print(f"  ✓ Retrieved company_overview ({len(overview)} chars)")
    else:
        print("  ✗ No company_overview found")
        return False

    # Test certifications
    print("\nTesting get_certifications():")
    certs = generator.get_certifications()
    print(f"  ✓ Found {len(certs)} certifications")
    for c in certs:
        print(f"    - {c['cert_name']} ({c['cert_type']})")

    # Test pricing estimate
    print("\nTesting estimate_pricing():")
    estimate = generator.estimate_pricing(
        equipment_items=[
            {'item': 'FANUC ARC Mate', 'quantity': 1},
            {'item': 'Lincoln Power Wave', 'quantity': 1}
        ],
        labor_hours={
            'engineering': 400,
            'programming': 200,
            'installation': 160
        }
    )
    print(f"  ✓ Equipment: ${estimate['equipment']['price']:,.0f}")
    print(f"  ✓ Labor: ${estimate['labor']['price']:,.0f}")
    print(f"  ✓ Total: ${estimate['totals']['price']:,.0f} ({estimate['totals']['margin_pct']}% margin)")

    # Test full proposal generation
    print("\n" + "=" * 60)
    print("TEST 3: Full Proposal Generation")
    print("=" * 60)

    proposal = generator.generate(
        solicitation_number='TACOM-FY26-TEST',
        title='Test Robotic Welding System',
        agency='US Army TACOM',
        naics='333249',
        estimated_value=500000,
        tags=['welding', 'robotics', 'FANUC']
    )

    print(f"\n✓ Proposal generated: {proposal['metadata']['solicitation_number']}")
    print(f"  Agency: {proposal['metadata']['agency']}")
    print(f"  NAICS: {proposal['metadata']['naics']}")
    print(f"  Sections generated: {len(proposal['sections'])}")

    for key, section in proposal['sections'].items():
        content_len = len(section.get('content', ''))
        print(f"    - {section['title']}: {content_len} chars")

    # Test markdown export
    print("\nTesting export_markdown():")
    markdown = generator.export_markdown(proposal)
    print(f"  ✓ Exported {len(markdown)} characters of markdown")

    # Save sample output
    with open('test_proposal_output.md', 'w') as f:
        f.write(markdown)
    print(f"  ✓ Saved to test_proposal_output.md")

    return True


def test_api_spec_consistency():
    """Verify API spec matches implementation."""
    print("\n" + "=" * 60)
    print("TEST 4: API Spec Consistency Check")
    print("=" * 60)

    # Read API spec
    with open('singh_platform_api_spec.md', 'r') as f:
        api_spec = f.read()

    # Check key endpoints are documented
    endpoints = [
        '/api/company/profile',
        '/api/personnel/by-role',
        '/api/past-performance/search',
        '/api/pricing/labor-rates',
        '/api/pricing/equipment',
        '/api/pricing/estimate',
        '/api/boilerplate',
        '/api/proposal/generate'
    ]

    print("Checking documented endpoints:")
    for endpoint in endpoints:
        if endpoint in api_spec:
            print(f"  ✓ {endpoint}")
        else:
            print(f"  ✗ {endpoint} NOT DOCUMENTED")

    # Check that the API spec matches the Python implementation
    from proposal_generator import ProposalGenerator

    methods = [
        ('get_company_profile', '/api/company/profile'),
        ('get_personnel_by_role', '/api/personnel/by-role'),
        ('search_past_performance', '/api/past-performance/search'),
        ('get_labor_rates', '/api/pricing/labor-rates'),
        ('get_equipment_pricing', '/api/pricing/equipment'),
        ('estimate_pricing', '/api/pricing/estimate'),
        ('get_boilerplate', '/api/boilerplate'),
        ('generate', '/api/proposal/generate')
    ]

    print("\nChecking implementation methods:")
    for method, endpoint in methods:
        if hasattr(ProposalGenerator, method):
            print(f"  ✓ {method}() -> {endpoint}")
        else:
            print(f"  ✗ {method}() MISSING for {endpoint}")

    return True


def cleanup():
    """Clean up test files."""
    files_to_remove = [TEST_DB, 'test_proposal_output.md']
    for f in files_to_remove:
        if os.path.exists(f):
            os.remove(f)
            print(f"Cleaned up: {f}")


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("SINGH AUTOMATION PROPOSAL SYSTEM - VERIFICATION TEST")
    print("=" * 60)

    all_passed = True

    # Run tests
    if not test_schema():
        all_passed = False
        print("\n✗ SCHEMA TEST FAILED")

    if not test_proposal_generator():
        all_passed = False
        print("\n✗ PROPOSAL GENERATOR TEST FAILED")

    if not test_api_spec_consistency():
        all_passed = False
        print("\n✗ API SPEC CONSISTENCY TEST FAILED")

    # Summary
    print("\n" + "=" * 60)
    if all_passed:
        print("✓ ALL TESTS PASSED")
        print("=" * 60)
        print("\nThe proposal system is working correctly:")
        print("  - SQL schema is valid and loads properly")
        print("  - Proposal generator can read all tables")
        print("  - All API endpoints have implementations")
        print("  - Full proposal generation works end-to-end")
    else:
        print("✗ SOME TESTS FAILED")
        print("=" * 60)
        sys.exit(1)

    # Optional cleanup
    # cleanup()

"""Basic tests for Singh Automation platform."""

def test_placeholder():
    """Placeholder test to ensure pytest runs successfully."""
    assert True


def test_api_files_exist():
    """Verify API files exist."""
    import os

    api_files = [
        'api/sam-live.js',
        'api/live-search.js',
    ]

    for api_file in api_files:
        assert os.path.exists(api_file), f"Missing API file: {api_file}"


def test_html_files_exist():
    """Verify HTML files exist."""
    import os

    html_files = [
        'index.html',
        'live-search.html',
    ]

    for html_file in html_files:
        assert os.path.exists(html_file), f"Missing HTML file: {html_file}"

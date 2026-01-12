// /api/bugs.js
// Bug Tickets API - Stores and retrieves bugs detected by the COR audit system
// Uses in-memory storage (resets on cold start) - upgrade to database for persistence

// In-memory bug storage (for serverless, consider Redis or database)
let bugTickets = [];
let bugIdCounter = 1;

export default async function handler(req, res) {
    const requestId = `bugs_${Date.now()}`;

    // CORS
    const allowedOrigins = ['https://singh-automation.vercel.app', 'https://singhautomation.com', 'http://localhost:3000', 'http://localhost:5173'];
    const origin = req.headers.origin;
    const isAllowed = allowedOrigins.includes(origin) ||
        (origin && origin.endsWith('.vercel.app') && origin.includes('singh-automation'));
    if (isAllowed) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // GET - List all bugs or get specific bug
    if (req.method === 'GET') {
        const { id, status, severity } = req.query;

        if (id) {
            const bug = bugTickets.find(b => b.id === id);
            if (!bug) {
                return res.status(404).json({ success: false, error: 'Bug not found' });
            }
            return res.status(200).json({ success: true, bug });
        }

        let filtered = [...bugTickets];

        // Filter by status
        if (status) {
            filtered = filtered.filter(b => b.status === status);
        }

        // Filter by severity
        if (severity) {
            filtered = filtered.filter(b => b.severity === severity);
        }

        // Sort by creation date (newest first)
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Stats
        const stats = {
            total: bugTickets.length,
            open: bugTickets.filter(b => b.status === 'open').length,
            inProgress: bugTickets.filter(b => b.status === 'in-progress').length,
            resolved: bugTickets.filter(b => b.status === 'resolved').length,
            critical: bugTickets.filter(b => b.severity === 'critical').length,
            high: bugTickets.filter(b => b.severity === 'high').length,
            medium: bugTickets.filter(b => b.severity === 'medium').length,
            low: bugTickets.filter(b => b.severity === 'low').length
        };

        return res.status(200).json({
            success: true,
            requestId,
            stats,
            bugs: filtered
        });
    }

    // POST - Create new bug ticket
    if (req.method === 'POST') {
        const { title, description, severity, component, source, auditId } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, error: 'Title is required' });
        }

        // Check for duplicate (same title within last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const duplicate = bugTickets.find(b =>
            b.title === title &&
            new Date(b.createdAt) > oneHourAgo
        );

        if (duplicate) {
            // Update occurrence count instead of creating new
            duplicate.occurrences = (duplicate.occurrences || 1) + 1;
            duplicate.lastSeen = new Date().toISOString();
            return res.status(200).json({
                success: true,
                message: 'Duplicate bug - incremented occurrence count',
                bug: duplicate
            });
        }

        const bug = {
            id: `BUG-${String(bugIdCounter++).padStart(4, '0')}`,
            title,
            description: description || '',
            severity: severity || 'medium', // critical, high, medium, low
            status: 'open',
            component: component || 'unknown',
            source: source || 'manual', // manual, audit, user-report
            auditId: auditId || null,
            occurrences: 1,
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            resolvedAt: null,
            notes: []
        };

        bugTickets.push(bug);

        console.log(`[${requestId}] Bug created: ${bug.id} - ${bug.title}`);

        return res.status(201).json({
            success: true,
            message: 'Bug ticket created',
            bug
        });
    }

    // PATCH - Update bug status or add note
    if (req.method === 'PATCH') {
        const { id } = req.query;
        const { status, note, severity } = req.body;

        if (!id) {
            return res.status(400).json({ success: false, error: 'Bug ID required' });
        }

        const bug = bugTickets.find(b => b.id === id);
        if (!bug) {
            return res.status(404).json({ success: false, error: 'Bug not found' });
        }

        if (status) {
            bug.status = status;
            if (status === 'resolved') {
                bug.resolvedAt = new Date().toISOString();
            }
        }

        if (severity) {
            bug.severity = severity;
        }

        if (note) {
            bug.notes.push({
                content: note,
                timestamp: new Date().toISOString()
            });
        }

        bug.updatedAt = new Date().toISOString();

        return res.status(200).json({
            success: true,
            message: 'Bug updated',
            bug
        });
    }

    // DELETE - Remove bug ticket
    if (req.method === 'DELETE') {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ success: false, error: 'Bug ID required' });
        }

        const index = bugTickets.findIndex(b => b.id === id);
        if (index === -1) {
            return res.status(404).json({ success: false, error: 'Bug not found' });
        }

        const removed = bugTickets.splice(index, 1)[0];

        return res.status(200).json({
            success: true,
            message: 'Bug deleted',
            bug: removed
        });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
}

// Helper to import bugs from audit results
export function importBugsFromAudit(auditResult) {
    if (!auditResult?.bugs?.length) return [];

    const imported = [];
    for (const bug of auditResult.bugs) {
        const newBug = {
            id: bug.id || `BUG-${String(bugIdCounter++).padStart(4, '0')}`,
            title: bug.title,
            description: bug.description,
            severity: bug.severity || 'medium',
            status: 'open',
            component: bug.component || 'unknown',
            source: 'audit',
            auditId: auditResult.requestId,
            occurrences: 1,
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            resolvedAt: null,
            notes: []
        };

        // Check for existing bug with same title
        const existing = bugTickets.find(b => b.title === newBug.title);
        if (existing) {
            existing.occurrences++;
            existing.lastSeen = newBug.createdAt;
            imported.push(existing);
        } else {
            bugTickets.push(newBug);
            imported.push(newBug);
        }
    }

    return imported;
}

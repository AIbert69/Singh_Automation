/**
 * WinScope Frontend Integration
 * ==============================
 * 
 * Add this to your existing Singh Automation platform to connect to WinScope backend.
 * This replaces your current scraping logic with WinScope's intelligent engine.
 * 
 * Usage in your existing code:
 * 
 * // In your "Scan Live Data" button handler:
 * await WinScope.scanPortals();
 * 
 * // In your "Request Distributor Quote" button handler:
 * const rfq = await WinScope.generateRFQ(opportunityId);
 * 
 * Author: Albert Mizuno
 * Date: December 2025
 */

const WinScope = {
    // Configuration
    config: {
        apiUrl: process.env.WINSCOPE_API_URL || 'http://localhost:8000',
        // For production, set to your deployed WinScope API URL
        // e.g., 'https://winscope-api.your-domain.com'
    },

    /**
     * Scan all portals for new opportunities
     * Call this from your "Scan Live Data" button
     */
    async scanPortals(options = {}) {
        console.log('🔍 Initiating WinScope portal scan...');
        
        try {
            // Start scan
            const response = await fetch(`${this.config.apiUrl}/api/scan-portals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(options)
            });

            if (!response.ok) {
                throw new Error(`Scan failed: ${response.statusText}`);
            }

            const { job_id } = await response.json();
            console.log(`✓ Scan started: ${job_id}`);

            // Poll for completion
            return await this.waitForJob(job_id, 'scan');
            
        } catch (error) {
            console.error('❌ Scan failed:', error);
            throw error;
        }
    },

    /**
     * Wait for a background job to complete
     */
    async waitForJob(jobId, type = 'scan') {
        const maxWaitTime = 300000; // 5 minutes
        const pollInterval = 2000; // 2 seconds
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            try {
                const response = await fetch(`${this.config.apiUrl}/api/scan-status/${jobId}`);
                const status = await response.json();

                if (status.status === 'completed') {
                    console.log('✅ Job completed:', status);
                    return status;
                }

                if (status.status === 'failed') {
                    throw new Error(status.error || 'Job failed');
                }

                // Still processing, wait and poll again
                await new Promise(resolve => setTimeout(resolve, pollInterval));
                
            } catch (error) {
                console.error('Error checking job status:', error);
                throw error;
            }
        }

        throw new Error('Job timeout - exceeded maximum wait time');
    },

    /**
     * Get all discovered opportunities
     * Call this to populate your opportunities list
     */
    async getOpportunities(filters = {}) {
        try {
            const params = new URLSearchParams({
                min_score: filters.minScore || 50,
                limit: filters.limit || 100,
                ...(filters.portal && { portal: filters.portal })
            });

            const response = await fetch(
                `${this.config.apiUrl}/api/opportunities?${params}`
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch opportunities: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`✓ Retrieved ${data.total} opportunities`);
            
            return data.opportunities;
            
        } catch (error) {
            console.error('❌ Failed to get opportunities:', error);
            throw error;
        }
    },

    /**
     * Process an opportunity (download docs, extract data)
     * Call this when user clicks "Request Distributor Quote"
     */
    async processOpportunity(opportunityId, sourceUrl, title, agency) {
        console.log(`📄 Processing opportunity: ${opportunityId}`);
        
        try {
            // Start processing
            const response = await fetch(`${this.config.apiUrl}/api/process-opportunity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    opportunity_id: opportunityId,
                    source_url: sourceUrl,
                    title: title,
                    agency: agency
                })
            });

            if (!response.ok) {
                throw new Error(`Processing failed: ${response.statusText}`);
            }

            const { job_id } = await response.json();
            console.log(`✓ Processing started: ${job_id}`);

            // Wait for processing to complete
            const result = await this.waitForJob(job_id, 'process');
            
            console.log(`✅ Extracted ${result.line_items_extracted} line items (${result.confidence}% confidence)`);
            
            return result;
            
        } catch (error) {
            console.error('❌ Processing failed:', error);
            throw error;
        }
    },

    /**
     * Generate complete RFQ document
     * Call this after opportunity is processed
     */
    async generateRFQ(opportunityId) {
        console.log(`📋 Generating RFQ for: ${opportunityId}`);
        
        try {
            const response = await fetch(`${this.config.apiUrl}/api/generate-rfq`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    opportunity_id: opportunityId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'RFQ generation failed');
            }

            const data = await response.json();
            console.log(`✅ RFQ generated (${data.fulfillment_confidence}% confidence)`);
            
            return {
                rfqDocument: data.rfq_document,
                fulfillmentConfidence: data.fulfillment_confidence,
                lineItemsCount: data.line_items_count,
                generatedAt: data.generated_at
            };
            
        } catch (error) {
            console.error('❌ RFQ generation failed:', error);
            throw error;
        }
    },

    /**
     * Get platform statistics
     */
    async getStats() {
        try {
            const response = await fetch(`${this.config.apiUrl}/api/stats`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }

            return await response.json();
            
        } catch (error) {
            console.error('❌ Failed to get stats:', error);
            return {
                total_opportunities: 0,
                high_score_count: 0,
                qualified_count: 0,
                backend_status: 'disconnected'
            };
        }
    },

    /**
     * Complete workflow: Scan → Process → Generate RFQ
     * Use this for the full automated flow
     */
    async completeWorkflow(opportunityId) {
        console.log('🚀 Starting complete WinScope workflow...');
        
        try {
            // Get opportunity details
            const response = await fetch(`${this.config.apiUrl}/api/opportunity/${opportunityId}`);
            const opp = await response.json();
            
            // Process the opportunity (download docs, extract data)
            console.log('Step 1/2: Processing documents...');
            await this.processOpportunity(
                opportunityId,
                opp.source_url,
                opp.title,
                opp.agency
            );
            
            // Generate RFQ with real data
            console.log('Step 2/2: Generating RFQ...');
            const rfq = await this.generateRFQ(opportunityId);
            
            console.log('✅ Workflow complete!');
            
            return rfq;
            
        } catch (error) {
            console.error('❌ Workflow failed:', error);
            throw error;
        }
    }
};

// Export for use in your existing code
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WinScope;
}

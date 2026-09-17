/**
 * AI Customer Support Agent - Web Dashboard & Studio App Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    initTabNavigation();
    initSimulator();
    initGoldenSetExplorer();
    initDashboard();
    initFailureStudio();
});

/* ---------------------------------------------------- */
/* 1. Tab Navigation                                    */
/* ---------------------------------------------------- */
function initTabNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');

            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`tab-${target}`).classList.add('active');
        });
    });
}

/* ---------------------------------------------------- */
/* 2. Live Agent Simulator                              */
/* ---------------------------------------------------- */
function initSimulator() {
    const form = document.getElementById('agent-form');
    const messageInput = document.getElementById('message-input');
    const brandInput = document.getElementById('brand-input');
    const submitBtn = document.getElementById('submit-btn');
    const btnSpinner = document.getElementById('btn-spinner');
    
    const emptyState = document.getElementById('empty-state');
    const pipelineResults = document.getElementById('pipeline-results');
    const pipelineStatusBadge = document.getElementById('pipeline-status-badge');

    // Preset Buttons Click Handler
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.getAttribute('data-text');
            const brand = btn.getAttribute('data-brand');
            messageInput.value = text;
            brandInput.value = brand;
            messageInput.focus();
        });
    });

    // Form Submit Handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        const brand = brandInput.value.trim();

        if (!text) return;

        // UI loading state
        submitBtn.disabled = true;
        btnSpinner.style.display = 'inline-block';
        pipelineStatusBadge.textContent = 'Processing Pipeline...';
        pipelineStatusBadge.className = 'badge badge-info';

        try {
            const res = await fetch('/api/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, brand: brand || null })
            });

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();

            renderPipelineOutput(data);
        } catch (err) {
            console.error("Error calling agent pipeline:", err);
            alert("Failed to execute agent pipeline. Make sure api_server.py is running!");
        } finally {
            submitBtn.disabled = false;
            btnSpinner.style.display = 'none';
        }
    });

    // Copy reply handler
    document.getElementById('copy-reply-btn').addEventListener('click', () => {
        const replyText = document.getElementById('res-reply-text').textContent;
        navigator.clipboard.writeText(replyText);
        alert('Reply copied to clipboard!');
    });
}

function renderPipelineOutput(data) {
    document.getElementById('empty-state').style.display = 'none';
    const pipelineResults = document.getElementById('pipeline-results');
    pipelineResults.style.display = 'flex';

    document.getElementById('pipeline-status-badge').textContent = 'Completed Successfully';
    document.getElementById('pipeline-status-badge').className = 'badge badge-primary';

    // Stage 1: Intent
    document.getElementById('res-intent').textContent = data.intent;
    const confPct = (data.confidence * 100).toFixed(1);
    document.getElementById('res-confidence-text').textContent = `${confPct}%`;
    document.getElementById('res-confidence-bar').style.width = `${confPct}%`;

    // Stage 2: Retrieval
    const simScore = (data.metadata?.top_similarity || 0).toFixed(3);
    document.getElementById('res-similarity-badge').textContent = `Top Cosine: ${simScore}`;
    
    const retContainer = document.getElementById('res-retrieval-list');
    retContainer.innerHTML = '';
    
    if (data.retrieved_examples && data.retrieved_examples.length > 0) {
        data.retrieved_examples.forEach((ex, idx) => {
            const div = document.createElement('div');
            div.className = 'retrieved-item';
            div.innerHTML = `
                <div class="retrieved-meta">
                    <span>Rank #${idx + 1} • Similarity: ${(ex.similarity * 100).toFixed(1)}%</span>
                    <span>Intent: ${ex.intent || 'N/A'}</span>
                </div>
                <div class="retrieved-text"><strong>Cust:</strong> ${escapeHtml(ex.customer_tweet || '')}</div>
                <div class="retrieved-text" style="color: #60a5fa; margin-top: 2px;"><strong>Agent:</strong> ${escapeHtml(ex.agent_reply || '')}</div>
            `;
            retContainer.appendChild(div);
        });
    } else {
        retContainer.innerHTML = '<p class="text-dim" style="font-size: 12px;">No relevant historical precedents retrieved.</p>';
    }

    // Stage 3: Escalation
    const decBadge = document.getElementById('res-decision-badge');
    const isEscalate = data.decision === 'ESCALATE_HUMAN';
    decBadge.textContent = data.decision;
    decBadge.className = `decision-badge ${isEscalate ? 'escalate' : 'auto-handle'}`;

    document.getElementById('res-escalation-reason').textContent = data.escalation_reason || 'No specific flag triggered.';
    
    const flagsDiv = document.getElementById('res-flags');
    flagsDiv.innerHTML = '';
    const flags = data.metadata?.triggered_flags || [];
    if (flags.length > 0) {
        flags.forEach(flag => {
            const span = document.createElement('span');
            span.className = 'badge badge-warning';
            span.style.marginRight = '6px';
            span.textContent = flag;
            flagsDiv.appendChild(span);
        });
    }

    // Stage 4: Reply
    document.getElementById('res-reply-text').textContent = data.reply;
    document.getElementById('res-mode-tag').textContent = data.metadata?.generation_mode || 'local_grounded_synthesis';
    document.getElementById('res-brand-tag').textContent = data.metadata?.brand || 'Generic';
}

/* ---------------------------------------------------- */
/* 3. Dashboard Metrics & Confusion Matrix              */
/* ---------------------------------------------------- */
async function initDashboard() {
    try {
        const [metricsRes, matrixRes] = await Promise.all([
            fetch('/api/metrics'),
            fetch('/api/confusion-matrix')
        ]);

        if (metricsRes.ok) {
            const metrics = await metricsRes.json();
            const summary = metrics.summary;

            if (summary.intent_classification) {
                document.getElementById('kpi-accuracy').textContent = `${(summary.intent_classification.accuracy * 100).toFixed(2)}%`;
                document.getElementById('kpi-f1').textContent = summary.intent_classification.macro_f1.toFixed(4);
            }
            if (summary.reply_quality) {
                document.getElementById('kpi-rubric').textContent = `${summary.reply_quality.mean_overall_score.toFixed(2)} / 5.0`;
            }
            if (summary.escalation_safety) {
                document.getElementById('kpi-safety').textContent = `${(summary.escalation_safety.autohandle_safety_rate * 100).toFixed(2)}%`;
                document.getElementById('kpi-recall').textContent = `${(summary.escalation_safety.escalation_recall * 100).toFixed(2)}%`;
            }
        }

        if (matrixRes.ok) {
            const matrixData = await matrixRes.json();
            renderConfusionMatrix(matrixData);
        }
    } catch (e) {
        console.error("Error loading dashboard metrics:", e);
    }
}

function renderConfusionMatrix(data) {
    const container = document.getElementById('matrix-container');
    if (!data.intents || !data.matrix) {
        container.innerHTML = '<p>No confusion matrix data available.</p>';
        return;
    }

    const intents = data.intents;
    const matrix = data.matrix;

    let html = '<table class="matrix-table"><thead><tr><th>True \\ Pred</th>';
    intents.forEach(intent => {
        const shortName = intent.split('_')[0];
        html += `<th title="${intent}">${shortName}</th>`;
    });
    html += '</tr></thead><tbody>';

    matrix.forEach((row, i) => {
        const rowIntent = row.intent;
        html += `<tr><th title="${rowIntent}">${rowIntent.split('_')[0]}</th>`;
        row.values.forEach((val, j) => {
            const isDiagonal = i === j;
            let bgColor = 'transparent';
            let textColor = 'var(--text-muted)';
            
            if (val > 0) {
                if (isDiagonal) {
                    const opacity = Math.min(1, val / 20);
                    bgColor = `rgba(16, 185, 129, ${0.15 + opacity * 0.5})`;
                    textColor = '#ffffff';
                } else {
                    bgColor = `rgba(244, 63, 94, ${0.2 + val * 0.2})`;
                    textColor = '#ffffff';
                }
            }

            html += `<td class="matrix-cell" style="background-color: ${bgColor}; color: ${textColor};" title="True: ${rowIntent} | Pred: ${intents[j]} | Count: ${val}">${val}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

/* ---------------------------------------------------- */
/* 4. Golden Set Explorer                               */
/* ---------------------------------------------------- */
function initGoldenSetExplorer() {
    const intentFilter = document.getElementById('intent-filter');
    const searchInput = document.getElementById('golden-search');

    const loadTable = async () => {
        const intent = intentFilter.value;
        const search = searchInput.value.trim();

        try {
            const res = await fetch(`/api/golden-set?intent=${encodeURIComponent(intent)}&search=${encodeURIComponent(search)}`);
            if (!res.ok) return;
            const result = await res.json();
            renderGoldenTable(result.data);
        } catch (e) {
            console.error("Error loading golden set:", e);
        }
    };

    intentFilter.addEventListener('change', loadTable);
    
    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(loadTable, 300);
    });

    loadTable();
}

function renderGoldenTable(rows) {
    const tbody = document.getElementById('golden-table-body');
    if (!rows || rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 20px;">No golden set examples found matching filters.</td></tr>';
        return;
    }

    let html = '';
    rows.forEach(r => {
        const isMatch = r.baseline2_pred === r.intent;
        const matchClass = isMatch ? 'correct' : 'incorrect';
        const matchLabel = isMatch ? 'MATCH' : 'MISMATCH';

        html += `
            <tr>
                <td>#${r.id}</td>
                <td><strong style="color: var(--accent-blue);">${escapeHtml(r.brand)}</strong></td>
                <td style="max-width: 400px; word-wrap: break-word;">${escapeHtml(r.text)}</td>
                <td><span class="intent-pill">${escapeHtml(r.intent)}</span></td>
                <td><span class="intent-pill" style="opacity: 0.8;">${escapeHtml(r.baseline2_pred)}</span></td>
                <td><span class="match-badge ${matchClass}">${matchLabel}</span></td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

/* ---------------------------------------------------- */
/* 5. Failure Analysis Studio                           */
/* ---------------------------------------------------- */
async function initFailureStudio() {
    try {
        const res = await fetch('/api/failure-analysis');
        if (!res.ok) return;
        const data = await res.json();
        renderFailures(data.failures);
    } catch (e) {
        console.error("Error loading failure analysis:", e);
    }
}

function renderFailures(failures) {
    const container = document.getElementById('failure-cards-container');
    if (!failures || failures.length === 0) return;

    let html = '';
    failures.forEach(f => {
        const isCritical = f.severity === 'CRITICAL';
        const cardClass = isCritical ? 'severity-critical' : '';
        const badgeClass = isCritical ? 'badge-danger' : 'badge-warning';

        html += `
            <div class="failure-card ${cardClass}">
                <div class="failure-header">
                    <div class="failure-title">
                        <span>#${f.id}</span> ${escapeHtml(f.category)}
                    </div>
                    <span class="badge ${badgeClass}">${f.severity} Severity</span>
                </div>
                <div class="failure-query">
                    <strong>${escapeHtml(f.query_id)}:</strong> "${escapeHtml(f.query_text)}"
                </div>
                <div class="failure-details-grid">
                    <div class="detail-box">
                        <h4>Behavior Comparison</h4>
                        <p><strong>Expected:</strong> ${escapeHtml(f.expected)}</p>
                        <p style="color: var(--accent-rose); margin-top: 4px;"><strong>Predicted:</strong> ${escapeHtml(f.predicted)}</p>
                        <p style="color: var(--accent-amber); margin-top: 4px;"><strong>Escalation Decision:</strong> ${escapeHtml(f.decision)}</p>
                    </div>
                    <div class="detail-box">
                        <h4>Root Cause & Engineering Fix</h4>
                        <p><strong>Mechanism:</strong> ${escapeHtml(f.root_cause)}</p>
                        <p style="color: var(--accent-green); margin-top: 4px;"><strong>Proposed Fix:</strong> ${escapeHtml(f.mitigation)}</p>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

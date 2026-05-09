document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const fileNameDisplay = document.getElementById('file-name-display');
    const resultsSection = document.getElementById('results-section');
    const loadingOverlay = document.getElementById('loading-overlay');
    const resultsContent = document.getElementById('results-content');
    const totalScoreEl = document.getElementById('total-score');
    const feedbackListEl = document.getElementById('feedback-list');
    const transcriptTextEl = document.getElementById('transcript-text');
    const progressFill = document.getElementById('progress-fill');
    const scoreStatus = document.getElementById('score-status');
    const scoreEmpName = document.getElementById('score-emp-name');
    const employeeNameInput = document.getElementById('employee-name');
    const scoreArc = document.getElementById('score-arc');
    const copyBtn = document.getElementById('copy-transcript-btn');

    // How it works modal
    const howItWorksBtn = document.getElementById('how-it-works-btn');
    const modal = document.getElementById('how-it-works-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    howItWorksBtn.addEventListener('click', () => modal.classList.add('active'));
    modalCloseBtn.addEventListener('click', () => modal.classList.remove('active'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.classList.remove('active'); });

    // Copy transcript
    copyBtn.addEventListener('click', () => {
        const text = transcriptTextEl.textContent;
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
            copyBtn.style.color = '#16a34a';
            copyBtn.style.borderColor = '#bbf7d0';
            copyBtn.style.background = '#f0fdf4';
            setTimeout(() => {
                copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
                copyBtn.style.color = '';
                copyBtn.style.borderColor = '';
                copyBtn.style.background = '';
            }, 2000);
        });
    });

    // File upload
    let selectedFile = null;

    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            selectedFile = files[0];
            fileNameDisplay.textContent = `✓ ${selectedFile.name}`;
            analyzeBtn.disabled = false;
        }
    }

    // Loading step animator
    let stepInterval = null;
    function startLoadingSteps() {
        const steps = [
            document.getElementById('step-1'),
            document.getElementById('step-2'),
            document.getElementById('step-3'),
        ];
        let current = 0;
        steps.forEach(s => { s.classList.remove('active', 'done'); });
        steps[0].classList.add('active');

        stepInterval = setInterval(() => {
            if (current < steps.length - 1) {
                steps[current].classList.remove('active');
                steps[current].classList.add('done');
                current++;
                steps[current].classList.add('active');
            }
        }, 8000); // ~8s per step for a ~24s visual cycle
    }

    function stopLoadingSteps() {
        if (stepInterval) clearInterval(stepInterval);
        ['step-1', 'step-2', 'step-3'].forEach(id => {
            const el = document.getElementById(id);
            el.classList.remove('active');
            el.classList.add('done');
        });
    }

    // Animate SVG arc
    function animateArc(score) {
        if (!scoreArc) return;
        const circumference = 213.6;
        const offset = circumference - (score / 100) * circumference;
        scoreArc.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
        scoreArc.style.strokeDashoffset = offset;

        // Change arc color by score
        const grad = scoreArc.closest('svg').querySelector('#scoreGrad');
        if (score >= 80) {
            grad.children[0].setAttribute('stop-color', '#16a34a');
            grad.children[1].setAttribute('stop-color', '#4ade80');
        } else if (score >= 60) {
            grad.children[0].setAttribute('stop-color', '#d97706');
            grad.children[1].setAttribute('stop-color', '#fbbf24');
        } else {
            grad.children[0].setAttribute('stop-color', '#dc2626');
            grad.children[1].setAttribute('stop-color', '#f87171');
        }
    }

    // Animate score counter
    function animateCounter(el, target, duration = 1200) {
        let start = 0;
        const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target);
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    // Analyze
    analyzeBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        resultsSection.style.display = 'block';
        loadingOverlay.style.display = 'flex';
        resultsContent.style.display = 'none';
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="animation:spin 0.8s linear infinite">
                <circle cx="12" cy="12" r="10" stroke-dasharray="40" stroke-dashoffset="15"/>
            </svg> Analysing…`;

        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        startLoadingSteps();

        const formData = new FormData();
        formData.append('audio', selectedFile);

        try {
            const response = await fetch("https://calliq-backend-7eik.onrender.com/api/evaluate", {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.detail || JSON.stringify(result));

            stopLoadingSteps();
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
                displayResults(result);
            }, 400);

        } catch (error) {
            stopLoadingSteps();
            loadingOverlay.style.display = 'none';
            showError(error.message);
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = `
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                </svg>
                Analyse Call`;
        }
    });

    function showError(message) {
        resultsContent.style.display = 'block';
        resultsContent.innerHTML = `
            <div style="padding:40px 24px;text-align:center;">
                <div style="width:52px;height:52px;background:#fef2f2;border-radius:14px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                </div>
                <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:8px;">Analysis Failed</div>
                <div style="font-size:13px;color:#64748b;max-width:300px;margin:0 auto;">${message}</div>
            </div>`;
    }

    function displayResults(data) {
        resultsContent.style.display = 'block';

        const score = Math.round(data.overall_score || 0);

        // Animate counter and arc
        animateCounter(totalScoreEl, score);
        setTimeout(() => animateArc(score), 100);

        // Progress bar
        setTimeout(() => { progressFill.style.width = score + '%'; }, 100);

        // Employee name
        const empName = employeeNameInput.value.trim();
        scoreEmpName.textContent = empName ? empName : '';

        // Score color + status
        if (score >= 80) {
            progressFill.style.background = 'linear-gradient(90deg, #16a34a, #4ade80)';
            scoreStatus.innerHTML = `<span style="color:#16a34a">✓ Excellent performance</span>`;
        } else if (score >= 60) {
            progressFill.style.background = 'linear-gradient(90deg, #d97706, #fbbf24)';
            scoreStatus.innerHTML = `<span style="color:#d97706">⚠ Needs improvement</span>`;
        } else {
            progressFill.style.background = 'linear-gradient(90deg, #dc2626, #f87171)';
            scoreStatus.innerHTML = `<span style="color:#dc2626">✗ Below standard</span>`;
        }

        // Section scores
        feedbackListEl.innerHTML = '';
        if (data.section_scores && Array.isArray(data.section_scores)) {
            data.section_scores.forEach((item, i) => {
                const badgeClass = item.status === 'Fully Covered' ? 'badge-green'
                    : item.status === 'Partially Covered' ? 'badge-yellow' : 'badge-red';
                const badgeText = item.status === 'Fully Covered' ? 'Covered'
                    : item.status === 'Partially Covered' ? 'Partial' : 'Missed';

                const div = document.createElement('div');
                div.className = 'section-row';
                div.style.animationDelay = `${i * 60}ms`;
                div.innerHTML = `
                    <div class="section-info">
                        <div class="section-name">${item.section_name}</div>
                        <div class="section-reasoning">${item.reasoning || ''}</div>
                        ${item.evidence ? `<div class="section-evidence">"${item.evidence}"</div>` : ''}
                    </div>
                    <div class="section-right">
                        <span class="section-score">${item.score}/100</span>
                        <span class="badge ${badgeClass}">${badgeText}</span>
                    </div>`;
                feedbackListEl.appendChild(div);
            });
        }

        // Transcript
        transcriptTextEl.textContent = data.transcript || 'No transcript available.';
    }
});
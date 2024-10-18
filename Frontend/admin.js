document.addEventListener('DOMContentLoaded', function () {
    const pendingCandidates = JSON.parse(localStorage.getItem('pendingCandidates')) || [];
    const pendingCandidatesDiv = document.getElementById('pendingCandidates');
    const electionDateForm = document.getElementById('electionDateForm');
    const electionDateInput = document.getElementById('electionDate');
    const electionTimeInput = document.getElementById('electionTime');
    const electionDateDisplay = document.getElementById('electionDateDisplay');

    function renderPendingCandidates() {
        pendingCandidatesDiv.innerHTML = '';
        pendingCandidates.forEach((candidate, index) => {
            const candidateDiv = document.createElement('div');
            candidateDiv.className = 'candidate';
            candidateDiv.innerHTML = `
                <p>Name: ${candidate.name}</p>
                <p>Position: ${candidate.position}</p>
                <button onclick="approveCandidate(${index})">Approve</button>
                <button onclick="rejectCandidate(${index})">Reject</button>
            `;
            pendingCandidatesDiv.appendChild(candidateDiv);
        });
    }

    window.approveCandidate = function (index) {
        const approvedCandidates = JSON.parse(localStorage.getItem('approvedCandidates')) || [];
        approvedCandidates.push(pendingCandidates[index]);
        localStorage.setItem('approvedCandidates', JSON.stringify(approvedCandidates));
        pendingCandidates.splice(index, 1);
        localStorage.setItem('pendingCandidates', JSON.stringify(pendingCandidates));
        renderPendingCandidates();
    };

    window.rejectCandidate = function (index) {
        pendingCandidates.splice(index, 1);
        localStorage.setItem('pendingCandidates', JSON.stringify(pendingCandidates));
        renderPendingCandidates();
    };

    electionDateForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const electionDate = electionDateInput.value;
        const electionTime = electionTimeInput.value;
        const electionDateTime = `${electionDate} ${electionTime}`;
        localStorage.setItem('electionDateTime', electionDateTime);
        displayElectionDateTime();
    });

    function displayElectionDateTime() {
        const electionDateTime = localStorage.getItem('electionDateTime');
        if (electionDateTime) {
            electionDateDisplay.textContent = `Election Date and Time: ${electionDateTime}`;
        } else {
            electionDateDisplay.textContent = 'No election date and time set.';
        }
    }

    renderPendingCandidates();
    displayElectionDateTime();
});
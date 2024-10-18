document.getElementById('candidateForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const position = document.getElementById('position').value;
    const pendingCandidates = JSON.parse(localStorage.getItem('pendingCandidates')) || [];

    pendingCandidates.push({ name, position });
    localStorage.setItem('pendingCandidates', JSON.stringify(pendingCandidates));

    document.getElementById('applicationStatus').textContent = 'Application submitted successfully!';
    document.getElementById('candidateForm').reset();
});
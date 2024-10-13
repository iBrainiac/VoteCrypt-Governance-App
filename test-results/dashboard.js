document.addEventListener('DOMContentLoaded', function () {
    const countdownTimer = document.getElementById('countdownTimer');

    function updateCountdown() {
        const electionDateTime = localStorage.getItem('electionDateTime');
        if (!electionDateTime) {
            countdownTimer.textContent = 'No election date and time set.';
            return;
        }

        const electionDate = new Date(electionDateTime);
        const now = new Date();
        const timeDifference = electionDate - now;

        if (timeDifference <= 0) {
            countdownTimer.textContent = 'The election has started!';
            return;
        }

        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

        countdownTimer.textContent = `Election starts in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    setInterval(updateCountdown, 1000);

    document.getElementById('voteNowButton')?.addEventListener('click', function () {
        checkVoterStatus();
    });

    function checkVoterStatus() {
        const isRegistered = localStorage.getItem('voterRegistered');

        if (isRegistered) {
            location.href = 'voting.html';
        } else {
            document.getElementById('voterStatusError').textContent = 'Please register to vote first.';
        }
    }
});
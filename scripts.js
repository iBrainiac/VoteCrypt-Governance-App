// Load environment variables from .env file
// require('dotenv').config();

// const Web3 = require('web3');
// const web3 = new Web3(Web3.givenProvider || process.env.WEB3_PROVIDER_URL);

// const contractAddress = process.env.CONTRACT_ADDRESS;
// const contractABI = JSON.parse(process.env.CONTRACT_ABI);
// const contract = new web3.eth.Contract(contractABI, contractAddress);

// Simulate organization database lookup (for demo purposes)
function fetchOrganizationDetails(regNumber) {
    const orgDatabase = {
        '1001': { name: 'John Doe', department: 'Engineering', email: 'john.doe@example.com' },
        '1002': { name: 'Jane Smith', department: 'Business', email: 'jane.smith@example.com' },
        '1003': { name: 'Amasai Juma', department: 'Computing', email: 'amasai@gmail.com' }
    };

    return orgDatabase[regNumber] || null;
}

// Login Form Submission
document.getElementById('loginForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const regNumber = document.getElementById('regNumber').value;
    const userDetails = fetchOrganizationDetails(regNumber);

    if (userDetails) {
        localStorage.setItem('userDetails', JSON.stringify(userDetails));
        location.href = 'dashboard.html';
    } else {
        document.getElementById('loginError').textContent = 'Invalid Registration Number.';
    }
});

// Automatically fill registration form with user details
document.addEventListener('DOMContentLoaded', function () {
    const storedUserDetails = JSON.parse(localStorage.getItem('userDetails'));
    if (storedUserDetails) {
        document.getElementById('name').value = storedUserDetails.name;
        document.getElementById('email').value = storedUserDetails.email;
    }

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

// Registration Form Submission
document.getElementById('registrationForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();

    const wallet = document.getElementById('wallet').value;
    const biometric = document.querySelector('input[name="biometric"]:checked').value;

    // Simulate biometric validation and wallet address check
    if (!wallet) {
        document.getElementById('walletWarning').textContent = 'No valid wallet address. Please create one.';
        return;
    }

    if (!biometric) {
        document.getElementById('registrationError').textContent = 'Please choose and capture biometric authentication.';
        return;
    }

    // Retrieve stored user details
    const storedUserDetails = JSON.parse(localStorage.getItem('userDetails'));

    if (!storedUserDetails) {
        document.getElementById('registrationError').textContent = 'User details not found. Please log in first.';
        return;
    }

    // Store voter details (simulate database storage)
    const voterDetails = { ...storedUserDetails, wallet, biometric };
    localStorage.setItem('voterDetails', JSON.stringify(voterDetails));
    localStorage.setItem('voterRegistered', true);

    // Interact with smart contract to register voter
    // await registerVoterOnBlockchain(wallet);

    // Show success message and redirect to voting page
    document.getElementById('registrationSuccess').style.display = 'block';
    setTimeout(() => {
        location.href = 'voting.html'; // Redirect to voting page after a short delay
    }, 2000); // Adjust the delay as needed
});

// Biometric capturing logic
function captureBiometric() {
    const biometric = document.querySelector('input[name="biometric"]:checked').value;
    document.getElementById('biometricResult').textContent = `${biometric} captured successfully!`;
}

// Vote Confirmation logic
document.getElementById('votingForm')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    console.log('Submit button clicked'); // Debugging statement

    const candidateA = document.getElementById('candidateA').value;
    const candidateB = document.getElementById('candidateB').value;
    
    if (!candidateA || !candidateB) {
        document.getElementById('voteError').textContent = 'Please select candidates for both positions.';
        return;
    }

    // Retrieve stored user details and voter details
    const storedUserDetails = JSON.parse(localStorage.getItem('userDetails'));
    const storedVoterDetails = JSON.parse(localStorage.getItem('voterDetails'));

    // Verify user details before allowing to vote
    if (!storedUserDetails || !storedVoterDetails || storedUserDetails.email !== storedVoterDetails.email || storedUserDetails.name !== storedVoterDetails.name) {
        document.getElementById('voteError').textContent = 'User details do not match. Please log in with the correct account.';
        return;
    }

    // Prompt user to confirm their details
    const confirmDetails = confirm(`Please confirm your details:\nName: ${storedUserDetails.name}\nEmail: ${storedUserDetails.email}`);
    if (!confirmDetails) {
        document.getElementById('voteError').textContent = 'Vote cancelled. Please confirm your details.';
        return;
    }

    // Save vote details (simulated vote submission)
    localStorage.setItem('voteDetails', JSON.stringify({ candidateA, candidateB }));

    // Interact with smart contract to submit vote
    // await submitVoteOnBlockchain(storedVoterDetails.wallet, candidateA, candidateB);

    // Redirect to thank you page
    location.href = 'thank-you.html';
});

// Simulate redirect to wallet address creation page, logic for linking wallet address to user account
function redirectToWalletCreation() {
    window.open('https://www.example.com/create-wallet', '_blank');
}

// Clear form warnings when new input is entered
document.getElementById('wallet')?.addEventListener('input', function () {
    document.getElementById('walletWarning').textContent = '';
});
document.querySelectorAll('input[name="biometric"]')?.forEach(function (element) {
    element.addEventListener('change', function () {
        document.getElementById('registrationError').textContent = '';
    });
});
document.getElementById('candidateA')?.addEventListener('input', function () {
    document.getElementById('voteError').textContent = '';
});
document.getElementById('candidateB')?.addEventListener('input', function () {
    document.getElementById('voteError').textContent = '';
});

// Event listener for "Vote Now" button on the dashboard
document.getElementById('voteNowButton')?.addEventListener('click', function () {
    checkVoterStatus();
});

// Check voter registration status before allowing voting
function checkVoterStatus() {
    const isRegistered = localStorage.getItem('voterRegistered');

    if (isRegistered) {
        location.href = 'voting.html';
    } else {
        document.getElementById('voterStatusError').textContent = 'Please register to vote first.';
    }
}

// Web3.js setup and smart contract interaction
// const web3 = new Web3(Web3.givenProvider || process.env.WEB3_PROVIDER_URL);
// const contractAddress = process.env.CONTRACT_ADDRESS;
// const contractABI = JSON.parse(process.env.CONTRACT_ABI);
// const contract = new web3.eth.Contract(contractABI, contractAddress);

// async function registerVoterOnBlockchain(wallet) {
//     const accounts = await web3.eth.getAccounts();
//     await contract.methods.registerVoter(wallet).send({ from: accounts[0] });
// }

// async function submitVoteOnBlockchain(wallet, candidateA, candidateB) {
//     const accounts = await web3.eth.getAccounts();
//     await contract.methods.submitVote(wallet, candidateA, candidateB).send({ from: accounts[0] });
// }
document.getElementById('loginButton').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const response = await fetch('/.netlify/functions/authenticate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    document.getElementById('message').textContent = data.message;
});
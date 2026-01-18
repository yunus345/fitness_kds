document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Sayfanın yenilenmesini engelle

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Giriş başarılıysa Dashboard'a yönlendir
            window.location.href = '/dashboard.html';
        } else {
            // Hata varsa mesajı göster
            errorDiv.style.display = 'block';
            errorDiv.innerText = data.message;
        }
    } catch (err) {
        console.error("Hata:", err);
        errorDiv.innerText = "Sunucuya bağlanılamadı.";
    }
});
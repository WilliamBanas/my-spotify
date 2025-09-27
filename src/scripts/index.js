function getStoredToken() {
  const token = localStorage.getItem("spotify_token");
  const expiresAt = localStorage.getItem("spotify_token_expires");

  if (!token || !expiresAt || Date.now() > parseInt(expiresAt)) {
  return null;
  }
  window.location.href = "./profile.html";    
  return token;
}

getStoredToken();

// Form logic -----------------------------------------
const accessTokenForm = document.getElementById("accessTokenForm");

async function getAccessToken() {

  const client_id = document.querySelector('input[name="client_id"]').value;
  const client_secret = document.querySelector('input[name="client_secret"]').value;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id,
    client_secret
  });

  try {
    const res = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body.toString()
    });
    const data = await res.json();
    const expiresAt = Date.now() + data.expires_in * 1000;
    localStorage.setItem("spotify_token", data.access_token);
    localStorage.setItem("spotify_token_expires", expiresAt);
    window.location.href="./profile.html"
  } catch (error) {
    console.error(error)
  } 
}

accessTokenForm.addEventListener("submit", (event) => {
  event.preventDefault();
  getAccessToken();
})
// ----------------------------------------------------
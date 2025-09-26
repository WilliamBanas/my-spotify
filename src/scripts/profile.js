function getStoredToken() {
  const token = localStorage.getItem("spotify_token");
  const expiresAt = localStorage.getItem("spotify_token_expires");

  if (!token || !expiresAt || Date.now() > parseInt(expiresAt)) {
  window.location.href = "./index.html";    
  return null;
  }
  return token;
}

getStoredToken();
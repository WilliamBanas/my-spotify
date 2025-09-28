const clientId = "4c2a191ee8ff41d0a9775c708fe59c25"; 
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

if (!code) {
    redirectToAuthCodeFlow(clientId);
} else {
    const accessToken = await getAccessToken(clientId, code);
    const profile = await fetchProfile(accessToken);
    const allUserPlaylistsData = await fetchUserPlaylists(accessToken);
    const allUserPlaylists = allUserPlaylistsData.items;
    const personnalPlaylists = allUserPlaylists.filter(p => p.owner.display_name === profile.display_name);
    await populateUI(profile, allUserPlaylists, personnalPlaylists);
}

export async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://127.0.0.1:5173/callback");
    params.append("scope", "user-read-private user-read-email");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

export async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://127.0.0.1:5173/callback");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token } = await result.json();
    return access_token;
}

async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: { Authorization: `Bearer ${token}` }
    });

    return await result.json();
}

async function fetchUserPlaylists(token) {
  const result = await fetch("https://api.spotify.com/v1/me/playlists", {
    method: "GET", headers: { Authorization: `Bearer ${token}` }
  });

  return await result.json();
}

async function populateUI(profile, allUserPlaylists, personnalPlaylists) {
    document.getElementById("displayName").innerText = profile.display_name;
    
    if (profile.images[0]) {
        const profileImage = new Image(200, 200);
        profileImage.src = profile.images[0].url;
        document.getElementById("avatar").appendChild(profileImage);
    }
    
    if (profile.product === "premium") {
        document.getElementById("product").innerHTML = "Premium";
    } else {
        document.getElementById("product").innerHTML = "Free plan";
    }
    
    if (profile.followers.total > 1) {
        document.getElementById("followers").innerHTML = `${profile.followers.total} followers`;
    } else {
        document.getElementById("followers").innerHTML = `${profile.followers.total} follower`;
    }
    
    if (personnalPlaylists.length > 1) {
        document.getElementById("playlists").innerHTML = `${personnalPlaylists.length} public playlists`;
    } else {
        document.getElementById("playlists").innerHTML = `${personnalPlaylists.length} public playlist`;
    }
}
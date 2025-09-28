// index.js - Version sécurisée et corrigée
console.log("Script started!");

const clientId = "4c2a191ee8ff41d0a9775c708fe59c25";
const redirectUri = "https://spotify-profile-exu8wfr2x-williams-projects-7100c025.vercel.app/callback";

console.log("Variables defined:", { clientId, redirectUri });

const params = new URLSearchParams(window.location.search);
const code = params.get("code");
console.log("Authorization code:", code);

let profile = null;
let allUserPlaylists = [];
let personnalPlaylists = [];
let topArtists = [];
let topTracks = [];

// Fonction principale async
async function initApp() {
  if (!code) {
    console.log("No code, redirecting to auth...");
    return redirectToAuthCodeFlow(clientId);
  }

  try {
    console.log("Code found, getting access token...");
    const accessToken = await getAccessToken(clientId, code);

    if (!accessToken) {
      console.error("No access token received. Check redirectUri & Spotify app settings.");
      return;
    }
    console.log("Access token obtained ✓");

    // FETCH PROFILE
    profile = await fetchProfile(accessToken);
    if (!profile) console.warn("No profile data returned from Spotify API.");
    else console.log("Profile fetched:", profile);

    // FETCH PLAYLISTS
    const allUserPlaylistsData = await fetchUserPlaylists(accessToken);
    allUserPlaylists = Array.isArray(allUserPlaylistsData?.items) ? allUserPlaylistsData.items : [];
    console.log(`Found ${allUserPlaylists.length} playlists.`);

    // Personal playlists (sécurisé avec profile et tableau défini)
    personnalPlaylists = (profile && allUserPlaylists.length > 0)
      ? allUserPlaylists.filter(p => p?.owner?.display_name === profile.display_name)
      : [];
    console.log(`Found ${personnalPlaylists.length} personal playlists.`);

    // FETCH TOP ARTISTS
    const topArtistsData = await fetchUserTopArtists(accessToken);
    topArtists = Array.isArray(topArtistsData?.items) ? topArtistsData.items : [];
    console.log(`Found ${topArtists.length} top artists.`);

    // FETCH TOP TRACKS
    const topTracksData = await fetchUserTopTracks(accessToken);
    topTracks = Array.isArray(topTracksData?.items) ? topTracksData.items : [];
    console.log(`Found ${topTracks.length} top tracks.`);

    // POPULATE UI
    await populateUI(profile, allUserPlaylists, personnalPlaylists, topArtists, topTracks);

  } catch (error) {
    console.error("Error in main app flow:", error);
  }
}

// Démarrer l'app
initApp();

// ================= AUTH FLOW =================
export async function redirectToAuthCodeFlow(clientId) {
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);
  localStorage.setItem("verifier", verifier);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");
  params.append("redirect_uri", redirectUri);
  params.append("scope", "user-read-private user-read-email user-top-read playlist-read-private");
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);

  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ================= TOKEN =================
export async function getAccessToken(clientId, code) {
  const verifier = localStorage.getItem("verifier");
  if (!verifier) {
    console.error("No verifier found in localStorage.");
    return null;
  }

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", redirectUri);
  params.append("code_verifier", verifier);

  try {
    const result = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    if (!result.ok) {
      console.error("Token request failed with status", result.status);
      return null;
    }
    const tokenData = await result.json();
    return tokenData.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
}

// ================= FETCH HELPERS =================
async function fetchProfile(token) {
  try {
    const result = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) {
      console.error("Profile fetch failed:", result.status);
      return null;
    }
    return await result.json();
  } catch {
    return null;
  }
}

async function fetchUserPlaylists(token) {
  try {
    const result = await fetch("https://api.spotify.com/v1/me/playlists", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) return { items: [] };
    return await result.json();
  } catch {
    return { items: [] };
  }
}

async function fetchUserTopArtists(token) {
  try {
    const result = await fetch("https://api.spotify.com/v1/me/top/artists?time_range=short_term", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) return { items: [] };
    return await result.json();
  } catch {
    return { items: [] };
  }
}

async function fetchUserTopTracks(token) {
  try {
    const result = await fetch("https://api.spotify.com/v1/me/top/tracks?time_range=short_term", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) return { items: [] };
    return await result.json();
  } catch {
    return { items: [] };
  }
}

// ================= UI HELPERS =================
function getArtistsToDisplay() {
  const w = window.innerWidth;
  if (w < 768) return 2;
  if (w < 830) return 3;
  if (w < 1017) return 4;
  if (w < 1200) return 5;
  if (w < 1378) return 6;
  return 7;
}

function renderArtists(topArtists) {
  const artistsList = document.getElementById("artists__list");
  if (!artistsList) return;
  artistsList.innerHTML = "";
  const toShow = getArtistsToDisplay();
  (topArtists || []).slice(0, toShow).forEach(artist => {
    const li = document.createElement("li");
    const div = document.createElement("div");
    if (artist.images?.[0]) {
      const img = new Image();
      img.src = artist.images[0].url;
      const divAvatar = document.createElement("div");
      divAvatar.className = "divAvatar";
      divAvatar.appendChild(img);
      div.appendChild(divAvatar);
    }
    const divTitle = document.createElement("div");
    divTitle.className = "divTitle";
    const spanName = document.createElement("span");
    spanName.className = "divTitle__name";
    spanName.innerText = artist.name || "Unknown";
    const spanType = document.createElement("span");
    spanType.className = "divTitle__type";
    spanType.innerText = artist.type || "artist";
    divTitle.appendChild(spanName);
    divTitle.appendChild(spanType);
    div.appendChild(divTitle);
    li.appendChild(div);
    artistsList.appendChild(li);
  });
}

async function populateUI(profile, allUserPlaylists, personnalPlaylists, topArtists, topTracks) {
  if (!profile) return;

  const displayNameEl = document.getElementById("displayName");
  if (displayNameEl) displayNameEl.innerText = profile.display_name || "Unknown User";

  if (profile.images?.[0]) {
    const avatarEl = document.getElementById("avatar");
    if (avatarEl) {
      avatarEl.innerHTML = "";
      const img = new Image(150, 150);
      img.src = profile.images[0].url;
      avatarEl.appendChild(img);
    }
  }

  const productEl = document.getElementById("product");
  if (productEl) productEl.innerText = profile.product === "premium" ? "Premium" : "Free plan";

  const followersEl = document.getElementById("followers");
  if (followersEl) followersEl.innerText = profile.followers?.total > 1
    ? `${profile.followers.total} followers`
    : `${profile.followers?.total || 0} follower`;

  const playlistsEl = document.getElementById("playlists");
  if (playlistsEl) playlistsEl.innerText = (personnalPlaylists?.length || 0) > 1
    ? `${personnalPlaylists.length} public playlists`
    : `${personnalPlaylists?.length || 0} public playlist`;

  if ((topArtists || []).length) renderArtists(topArtists);

  const tracksList = document.getElementById("tracks__list");
  if (tracksList && (topTracks || []).length) {
    tracksList.innerHTML = "";
    (topTracks || []).forEach(track => {
      const li = document.createElement("li");
      if (track.album?.images?.[0]) {
        const img = new Image(100, 100);
        img.src = track.album.images[0].url;
        const span = document.createElement("span");
        span.appendChild(img);
        li.appendChild(span);
      }
      const title = document.createElement("p");
      title.innerText = track.name || "Unknown Track";
      li.appendChild(title);
      tracksList.appendChild(li);
    });
  }
}

// ================= EVENTS =================
window.addEventListener("resize", () => {
  if ((topArtists || []).length) renderArtists(topArtists);
});

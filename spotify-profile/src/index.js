// index.js - Version sécurisée
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
    if (!profile) {
      console.warn("No profile data returned from Spotify API.");
    } else {
      console.log("Profile fetched:", profile);
    }

    // FETCH PLAYLISTS
    const allUserPlaylistsData = await fetchUserPlaylists(accessToken);
    allUserPlaylists = allUserPlaylistsData?.items || [];
    console.log(`Found ${allUserPlaylists.length} playlists.`);

    // Personal playlists
    personnalPlaylists = profile
      ? allUserPlaylists.filter(p => p?.owner?.display_name === profile.display_name)
      : [];
    console.log(`Found ${personnalPlaylists.length} personal playlists.`);

    // FETCH TOP ARTISTS
    const topArtistsData = await fetchUserTopArtists(accessToken);
    topArtists = topArtistsData?.items || [];
    console.log(`Found ${topArtists.length} top artists.`);

    // FETCH TOP TRACKS
    const topTracksData = await fetchUserTopTracks(accessToken);
    topTracks = topTracksData?.items || [];
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
  console.log("Starting auth flow...");
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  localStorage.setItem("verifier", verifier);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");
  params.append("redirect_uri", redirectUri);
  params.append(
    "scope",
    "user-read-private user-read-email user-top-read playlist-read-private"
  );
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);

  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ================= TOKEN =================
export async function getAccessToken(clientId, code) {
  console.log("Getting access token...");
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

    console.log("Token response status:", result.status);
    if (!result.ok) {
      console.error("Token request failed with status", result.status);
      return null;
    }

    const tokenData = await result.json();
    console.log("Token data:", tokenData);
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
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

async function fetchUserPlaylists(token) {
  try {
    const result = await fetch("https://api.spotify.com/v1/me/playlists", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) {
      console.error("Playlists fetch failed:", result.status);
      return { items: [] };
    }
    return await result.json();
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return { items: [] };
  }
}

async function fetchUserTopArtists(token) {
  try {
    const result = await fetch("https://api.spotify.com/v1/me/top/artists?time_range=short_term", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) {
      console.error("Top artists fetch failed:", result.status);
      return { items: [] };
    }
    return await result.json();
  } catch (error) {
    console.error("Error fetching top artists:", error);
    return { items: [] };
  }
}

async function fetchUserTopTracks(token) {
  try {
    const result = await fetch("https://api.spotify.com/v1/me/top/tracks?time_range=short_term", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!result.ok) {
      console.error("Top tracks fetch failed:", result.status);
      return { items: [] };
    }
    return await result.json();
  } catch (error) {
    console.error("Error fetching top tracks:", error);
    return { items: [] };
  }
}

// ================= UI HELPERS =================
function getArtistsToDisplay() {
  const width = window.innerWidth;
  if (width < 768) return 2;
  if (width < 830) return 3;
  if (width < 1017) return 4;
  if (width < 1200) return 5;
  if (width < 1378) return 6;
  return 7;
}

function renderArtists(topArtists) {
  const artistsList = document.getElementById("artists__list");
  if (!artistsList) return;

  artistsList.innerHTML = "";
  const artistsToShow = getArtistsToDisplay();
  topArtists.slice(0, artistsToShow).forEach(artist => {
    const li = document.createElement("li");
    const divContainer = document.createElement("div");

    if (artist.images?.[0]) {
      const artistImage = new Image();
      artistImage.src = artist.images[0].url;
      const divAvatar = document.createElement("div");
      divAvatar.className = "divAvatar";
      divAvatar.appendChild(artistImage);
      divContainer.appendChild(divAvatar);
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
    divContainer.appendChild(divTitle);

    li.appendChild(divContainer);
    artistsList.appendChild(li);
  });
}

async function populateUI(profile, allUserPlaylists, personnalPlaylists, topArtists, topTracks) {
  console.log("Populating UI...");

  if (!profile) return;

  const displayNameEl = document.getElementById("displayName");
  if (displayNameEl) displayNameEl.innerText = profile.display_name || "Unknown User";

  if (profile.images?.[0]) {
    const avatarEl = document.getElementById("avatar");
    if (avatarEl) {
      const profileImage = new Image(150, 150);
      profileImage.src = profile.images[0].url;
      avatarEl.innerHTML = "";
      avatarEl.appendChild(profileImage);
    }
  }

  const productEl = document.getElementById("product");
  if (productEl) productEl.innerText = profile.product === "premium" ? "Premium" : "Free plan";

  const followersEl = document.getElementById("followers");
  if (followersEl) {
    const count = profile.followers?.total || 0;
    followersEl.innerText = count > 1 ? `${count} followers` : `${count} follower`;
  }

  const playlistsEl = document.getElementById("playlists");
  if (playlistsEl) {
    const count = personnalPlaylists?.length || 0;
    playlistsEl.innerText = count > 1 ? `${count} public playlists` : `${count} public playlist`;
  }

  if (topArtists.length > 0) renderArtists(topArtists);

  if (topTracks.length > 0) {
    const tracksList = document.getElementById("tracks__list");
    if (tracksList) {
      tracksList.innerHTML = "";
      topTracks.forEach(track => {
        const li = document.createElement("li");

        if (track.album?.images?.[0]) {
          const albumImage = new Image(100, 100);
          albumImage.src = track.album.images[0].url;
          const spanAvatar = document.createElement("span");
          spanAvatar.appendChild(albumImage);
          li.appendChild(spanAvatar);
        }

        const title = document.createElement("p");
        title.innerText = track.name || "Unknown Track";
        li.appendChild(title);

        tracksList.appendChild(li);
      });
    }
  }
}

// ================= EVENTS =================
window.addEventListener("resize", () => {
  if (topArtists.length > 0) renderArtists(topArtists);
});

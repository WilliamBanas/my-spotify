console.log("Variables defined:", import.meta.env.VITE_SPOTIFY_CLIENT_ID);
console.log("Variables defined:", import.meta.env.VITE_REDIRECT_URI);

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const redirectUri = import.meta.env.VITE_REDIRECT_URI;

const params = new URLSearchParams(window.location.search);
const code = params.get("code");

let tokenData = JSON.parse(localStorage.getItem("spotify_token")) || null;
let profile = JSON.parse(localStorage.getItem("spotify_profile")) || null;
let allUserPlaylists =
	JSON.parse(localStorage.getItem("allUserPlaylists")) || [];
let personnalPlaylists =
	JSON.parse(localStorage.getItem("personnalPlaylists")) || [];
let topArtists = JSON.parse(localStorage.getItem("topArtists")) || [];
let topTracks = JSON.parse(localStorage.getItem("topTracks")) || [];

function isTokenValid() {
	if (!tokenData) return false;
	const now = Date.now();
	return tokenData.expires_at && tokenData.expires_at > now;
}

function saveToken(token, expires_in) {
	tokenData = {
		access_token: token,
		expires_at: Date.now() + expires_in * 1000,
	};
	localStorage.setItem("spotify_token", JSON.stringify(tokenData));
}

async function initApp() {
	try {
		if (!isTokenValid() && !code) {
			console.log("Token missing or expired, redirecting to auth...");
			return redirectToAuthCodeFlow(clientId, redirectUri);
		}

		if (!isTokenValid() && code) {
			console.log("Code found, getting access token...");
			const newTokenData = await getAccessToken(clientId, code);
			if (!newTokenData?.access_token) {
				console.error("Failed to get access token.");
				return redirectToAuthCodeFlow(clientId);
			}
			saveToken(newTokenData.access_token, newTokenData.expires_in);
			console.log("Access token obtained ✓");
		}

		const accessToken = tokenData.access_token;

		if (!profile) {
			profile = await fetchProfile(accessToken);
			if (!profile) console.warn("No profile data returned.");
			else localStorage.setItem("spotify_profile", JSON.stringify(profile));
		}

		if (!allUserPlaylists.length) {
			const playlistsData = await fetchUserPlaylists(accessToken);
			allUserPlaylists = Array.isArray(playlistsData?.items)
				? playlistsData.items
				: [];
			localStorage.setItem(
				"allUserPlaylists",
				JSON.stringify(allUserPlaylists)
			);
		}

		personnalPlaylists =
			profile?.display_name && Array.isArray(allUserPlaylists)
				? allUserPlaylists.filter(
						(p) => p?.owner?.display_name === profile.display_name
				  )
				: [];
		localStorage.setItem(
			"personnalPlaylists",
			JSON.stringify(personnalPlaylists)
		);

		if (!topArtists.length) {
			const artistsData = await fetchUserTopArtists(accessToken);
			topArtists = Array.isArray(artistsData?.items) ? artistsData.items : [];
			localStorage.setItem("topArtists", JSON.stringify(topArtists));
		}

		if (!topTracks.length) {
			const tracksData = await fetchUserTopTracks(accessToken);
			topTracks = Array.isArray(tracksData?.items) ? tracksData.items : [];
			localStorage.setItem("topTracks", JSON.stringify(topTracks));
		}

		await populateUI(
			profile,
			allUserPlaylists,
			personnalPlaylists,
			topArtists,
			topTracks
		);
	} catch (error) {
		console.error("Error in main app flow:", error);
	}
}

initApp();

export async function redirectToAuthCodeFlow(clientId, redirectUri) {
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
	const possible =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	for (let i = 0; i < length; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}

async function generateCodeChallenge(codeVerifier) {
	const data = new TextEncoder().encode(codeVerifier);
	const digest = await window.crypto.subtle.digest("SHA-256", data);
	return btoa(String.fromCharCode(...new Uint8Array(digest)))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

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
		return await result.json();
	} catch (error) {
		console.error("Error getting access token:", error);
		return null;
	}
}

async function fetchProfile(token) {
	try {
		const res = await fetch("https://api.spotify.com/v1/me", {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!res.ok) return null;
		return await res.json();
	} catch {
		return null;
	}
}

async function fetchUserPlaylists(token) {
	try {
		const res = await fetch("https://api.spotify.com/v1/me/playlists", {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!res.ok) return { items: [] };
		return await res.json();
	} catch {
		return { items: [] };
	}
}

async function fetchUserTopArtists(token) {
	try {
		const res = await fetch(
			"https://api.spotify.com/v1/me/top/artists?time_range=short_term",
			{
				headers: { Authorization: `Bearer ${token}` },
			}
		);
		if (!res.ok) return { items: [] };
		return await res.json();
	} catch {
		return { items: [] };
	}
}

async function fetchUserTopTracks(token) {
	try {
		const res = await fetch(
			"https://api.spotify.com/v1/me/top/tracks?time_range=short_term",
			{
				headers: { Authorization: `Bearer ${token}` },
			}
		);
		if (!res.ok) return { items: [] };
		return await res.json();
	} catch {
		return { items: [] };
	}
}

function gridDisplay() {
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
	if (!artistsList || !Array.isArray(topArtists)) return;
	artistsList.innerHTML = "";
	topArtists.slice(0, gridDisplay()).forEach((artist) => {
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

function renderTracks(topTracks) {
	const tracksList = document.getElementById("tracks__list");
	if (!topTracks || !Array.isArray(topTracks)) return;
	tracksList.innerHTML = "";
	topTracks.slice(0, 10).forEach((track, index) => {
		const li = document.createElement("li");
		const spanIndex = document.createElement("span");
		spanIndex.innerHTML = index + 1;
		li.appendChild(spanIndex);
		const divMainInfos = document.createElement("div");
		divMainInfos.setAttribute("class", "mainInfos");
		li.appendChild(divMainInfos);
		if (track.album?.images?.[0]) {
			const img = new Image(100, 100);
			img.src = track.album.images[0].url;
			const spanAvatar = document.createElement("span");
			spanAvatar.appendChild(img);
			divMainInfos.appendChild(spanAvatar);
		}
		const spanTitleArtists = document.createElement("span");
		divMainInfos.appendChild(spanTitleArtists);
		const spanTitle = document.createElement("span");
		spanTitle.innerText = track.name || "Unknown Track";
		spanTitleArtists.appendChild(spanTitle);
		spanTitleArtists.setAttribute("class", "title");
		const spanArtists = document.createElement("span");
		track.artists.forEach((artist) => {
			const anchorArtist = document.createElement("a");
			anchorArtist.innerHTML = artist.name;
			spanArtists.appendChild(anchorArtist);
			spanTitleArtists.appendChild(spanArtists);
		});
		const spanAlbum = document.createElement("span");
		spanAlbum.setAttribute("class", "album");
		spanAlbum.innerHTML = track.album.name;
		li.appendChild(spanAlbum);
		const ms = track.duration_ms;
		const minutes = Math.floor(ms / 60000);
		const seconds = Math.floor((ms % 60000) / 1000);
		const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;
		const spanDuration = document.createElement("span");
		spanDuration.setAttribute("class", "duration");
		spanDuration.innerHTML = formatted;
		li.appendChild(spanDuration);
		tracksList.appendChild(li);
	});
}

function renderPlaylists(personnalPlaylists, profile) {
	const playlistsList = document.getElementById("playlists__list");
	if (!personnalPlaylists || !Array.isArray(personnalPlaylists)) return;
	playlistsList.innerHTML = "";
	personnalPlaylists
		.filter((playlist) => playlist.owner.display_name === profile.display_name)
		.slice(0, 6)
		.forEach((playlist) => {
			const li = document.createElement("li");
			const divWrapper = document.createElement("div");
			li.appendChild(divWrapper);
			if (playlist.images?.[0]) {
				const img = new Image(180, 180);
				img.src = playlist.images[0].url;
				const spanAvatar = document.createElement("span");
				spanAvatar.appendChild(img);
				divWrapper.appendChild(spanAvatar);
			}
			const divInfos = document.createElement("div");
			const spanTitle = document.createElement("span");
			spanTitle.innerHTML = playlist.name;
			divInfos.appendChild(spanTitle);
			const spanDisplayName = document.createElement("span");
			spanDisplayName.innerHTML = playlist.owner.display_name;
			divInfos.appendChild(spanDisplayName);
			divWrapper.appendChild(divInfos);
			playlistsList.appendChild(li);
		});
}

async function populateUI(
	profile,
	allUserPlaylists,
	personnalPlaylists,
	topArtists,
	topTracks
) {
	if (!profile) return;

	const displayNameEl = document.getElementById("displayName");
	if (displayNameEl)
		displayNameEl.innerText = profile.display_name || "Unknown User";

	if (profile.images?.[0]) {
		const avatarEl = document.getElementById("avatar");
		if (avatarEl) {
			avatarEl.innerHTML = "";
			const img = new Image(200, 200);
			img.src = profile.images[0].url;
			avatarEl.appendChild(img);
		}
	}

	const productEl = document.getElementById("product");
	if (productEl)
		productEl.innerText =
			profile.product === "premium" ? "Premium" : "Free plan";

	const followersEl = document.getElementById("followers");
	if (followersEl)
		followersEl.innerText =
			profile.followers?.total > 1
				? `${profile.followers.total} followers`
				: `${profile.followers?.total || 0} follower`;

	const playlistsEl = document.getElementById("playlists");
	if (playlistsEl)
		playlistsEl.innerText =
			(Array.isArray(personnalPlaylists) ? personnalPlaylists.length : 0) > 1
				? `${personnalPlaylists.length} public playlists`
				: `${personnalPlaylists?.length || 0} public playlist`;

	if (Array.isArray(topArtists) && topArtists.length) renderArtists(topArtists);

	if (Array.isArray(topTracks) && topTracks.length) renderTracks(topTracks);

	if (Array.isArray(personnalPlaylists) && personnalPlaylists.length)
		renderPlaylists(personnalPlaylists, profile);

	const gradients = [
		{ color: "linear-gradient(180deg, #5B4B8A 0%, #2D1B4E 100%)" },
		{ color: "linear-gradient(180deg, #3D5A80 0%, #1A2332 100%)" },
		{ color: "linear-gradient(180deg, #4A6B5C 0%, #1E2F26 100%)" },
		{ color: "linear-gradient(180deg, #6B3E5A 0%, #2E1A26 100%)" },
		{ color: "linear-gradient(180deg, #576574 0%, #242B33 100%)" },
		{ color: "linear-gradient(180deg, #3D6B6B 0%, #1A2E2E 100%)" },
		{ color: "linear-gradient(180deg, #6B5444 0%, #2E231C 100%)" },
		{ color: "linear-gradient(180deg, #4A5F7F 0%, #1F2937 100%)" },
	];

	const editBackgroundButton = document.getElementById("edit__button");
	const modal = document.getElementById("modal");

	editBackgroundButton.addEventListener("click", function (e) {
		e.stopPropagation();
		modal.classList.toggle("modal-showed");
	});

	modal.addEventListener("click", function (e) {
		e.stopPropagation();
	});

	const colorList = document.getElementById("colors__list");
	let savedGradients =
		JSON.parse(localStorage.getItem("selectedGradients")) || [];
	gradients.forEach((gradient) => {
		const li = document.createElement("li");
		const spanColor = document.createElement("span");

		const normalizeGradient = (grad) => grad.replace(/\s+/g, " ").trim();

    // si la condition est bonne retourne true
		const isSelected = savedGradients.some(
			(saved) => normalizeGradient(saved) === normalizeGradient(gradient.color)
		);

		if (isSelected) {
			spanColor.style.outline = "2px solid var(--text)";
		}

		spanColor.addEventListener("click", function (e) {
      let savedGradients = JSON.parse(localStorage.getItem("selectedGradients")) || [];
      // retourne l'index du premier élément qui correspond sinon retourne -1
			const index = savedGradients.findIndex(
      saved => normalizeGradient(saved) === normalizeGradient(gradient.color)
    );
    
    if (index === -1) {
      savedGradients.push(gradient.color);
      spanColor.style.outline = "1px solid var(--text)";
    } else {
      savedGradients.splice(index, 1);
      spanColor.style.outline = "none";
    }
    
    localStorage.setItem("selectedGradients", JSON.stringify(savedGradients));
    startBackgroundRotation();
		});
		spanColor.style.background = gradient.color;
		li.appendChild(spanColor);
		colorList.appendChild(li);
	});

	let currentIndex = 0;
	let intervalId = null;

	function startBackgroundRotation() {
    let savedGradients = JSON.parse(localStorage.getItem("selectedGradients")) || [];

		if (intervalId) clearInterval(intervalId);

    const background = document.getElementById("background");

    if (!savedGradients.length) {
        background.style.background = "none";
        currentIndex = 0;
        return;
    }

    if (currentIndex >= savedGradients.length) {
        currentIndex = 0;
    }

		background.style.background = savedGradients[currentIndex];
		
		// si il y a plus d'un item dans le tableau
		// on met un intervale de 5 sec
		// on passe a l'index suivant et si le modulo de current index + 1 est égal a 0
		// alors on revient au premier index du tableau
		if (savedGradients.length > 1) {
			intervalId = setInterval(() => {
				currentIndex = (currentIndex + 1) % savedGradients.length;
				background.style.background = savedGradients[currentIndex];
			}, 5000);
		}
	}

	startBackgroundRotation();
}

window.addEventListener("resize", () => {
	if (Array.isArray(topArtists) && topArtists.length) renderArtists(topArtists);
});

// https://accounts.spotify.com/authorize?client_id=4c2a191ee8ff41d0a9775c708fe59c25&response_type=code&redirect_uri=undefined&scope=user-read-private+user-read-email+user-top-read+playlist-read-private&code_challenge_method=S256&code_challenge=hdc_gOKdZv8KHOoB43rZ9vO9qcjxmnYzjNxLWgH742Q

// Version simplifiée pour déboguer
console.log("Script started!");

const clientId = "4c2a191ee8ff41d0a9775c708fe59c25";
const redirectUri = "https://spotify-profile-exu8wfr2x-williams-projects-7100c025.vercel.app/callback";

console.log("Variables defined:", { clientId, redirectUri });

const params = new URLSearchParams(window.location.search);
const code = params.get("code");
console.log("Authorization code:", code);

let profile, allUserPlaylists, personnalPlaylists, topArtists, topTracks;

if (!code) {
	console.log("No code, redirecting to auth...");
	redirectToAuthCodeFlow(clientId);
} else {
	console.log("Code found, getting access token...");
	try {
		const accessToken = await getAccessToken(clientId, code);
		console.log("Access token obtained:", accessToken ? "✓" : "✗");
		
		if (!accessToken) {
			console.error("No access token received");
			return;
		}
		
		profile = await fetchProfile(accessToken);
		console.log("Profile:", profile);
		
		const allUserPlaylistsData = await fetchUserPlaylists(accessToken);
		console.log("Playlists data:", allUserPlaylistsData);
		
		// Protection contre undefined
		allUserPlaylists = allUserPlaylistsData?.items || [];
		console.log("Playlists items:", allUserPlaylists);
		
		personnalPlaylists = allUserPlaylists.filter(
			(p) => p?.owner?.display_name === profile?.display_name
		);
		console.log("Personal playlists:", personnalPlaylists);
		
		const topArtistsData = await fetchUserTopArtists(accessToken);
		console.log("Top artists data:", topArtistsData);
		topArtists = topArtistsData?.items || [];
		
		const topTracksData = await fetchUserTopTracks(accessToken);
		console.log("Top tracks data:", topTracksData);
		topTracks = topTracksData?.items || [];

		await populateUI(
			profile,
			allUserPlaylists,
			personnalPlaylists,
			topArtists,
			topTracks
		);
	} catch (error) {
		console.error("Error in main flow:", error);
	}
}

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
	let possible =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

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

export async function getAccessToken(clientId, code) {
	console.log("Getting access token...");
	const verifier = localStorage.getItem("verifier");
	console.log("Verifier:", verifier ? "✓" : "✗");

	if (!verifier) {
		console.error("No verifier found in localStorage");
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
			console.error("Token request failed:", result.status);
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

async function fetchProfile(token) {
	try {
		const result = await fetch("https://api.spotify.com/v1/me", {
			method: "GET",
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
			method: "GET",
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
		const result = await fetch(
			`https://api.spotify.com/v1/me/top/artists?time_range=short_term`,
			{
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			}
		);

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
		const result = await fetch(
			`https://api.spotify.com/v1/me/top/tracks?time_range=short_term`,
			{
				method: "GET",
				headers: { Authorization: `Bearer ${token}` },
			}
		);

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
	if (!artistsList) {
		console.error("Artists list element not found");
		return;
	}
	
	artistsList.innerHTML = "";
	const artistsToShow = getArtistsToDisplay();
	topArtists.slice(0, artistsToShow).forEach((artist) => {
		const li = document.createElement("li");
		const divContainer = document.createElement("div");

		if (artist.images && artist.images[0]) {
			const artistImage = new Image();
			artistImage.src = artist.images[0].url;
			const divAvatar = document.createElement("div");
			divAvatar.setAttribute("class", "divAvatar");
			divAvatar.appendChild(artistImage);
			divContainer.appendChild(divAvatar);
		}

		const divTitle = document.createElement("div");
		divTitle.setAttribute("class", "divTitle");
		const spanName = document.createElement("span");
		spanName.setAttribute("class", "divTitle__name");
		spanName.innerHTML = artist.name || "Unknown";
		const spanType = document.createElement("span");
		spanType.setAttribute("class", "divTitle__type");
		spanType.innerHTML = artist.type || "artist";
		divTitle.appendChild(spanName);
		divTitle.appendChild(spanType);
		divContainer.appendChild(divTitle);

		li.appendChild(divContainer);
		artistsList.appendChild(li);
	});
}

async function populateUI(
	profile,
	allUserPlaylists,
	personnalPlaylists,
	topArtists,
	topTracks
) {
	console.log("Populating UI...");
	
	if (!profile) {
		console.error("No profile data");
		return;
	}

	const displayNameEl = document.getElementById("displayName");
	if (displayNameEl) {
		displayNameEl.innerText = profile.display_name || "Unknown User";
	}

	if (profile.images && profile.images[0]) {
		const avatarEl = document.getElementById("avatar");
		if (avatarEl) {
			const profileImage = new Image(150, 150);
			profileImage.src = profile.images[0].url;
			avatarEl.innerHTML = "";
			avatarEl.appendChild(profileImage);
		}
	}

	const productEl = document.getElementById("product");
	if (productEl) {
		productEl.innerHTML = profile.product === "premium" ? "Premium" : "Free plan";
	}

	const followersEl = document.getElementById("followers");
	if (followersEl) {
		const count = profile.followers?.total || 0;
		followersEl.innerHTML = count > 1 ? `${count} followers` : `${count} follower`;
	}

	const playlistsEl = document.getElementById("playlists");
	if (playlistsEl) {
		const count = personnalPlaylists?.length || 0;
		playlistsEl.innerHTML = count > 1 ? `${count} public playlists` : `${count} public playlist`;
	}

	if (topArtists && topArtists.length > 0) {
		renderArtists(topArtists);
	}

	if (topTracks && topTracks.length > 0) {
		const tracksList = document.getElementById("tracks__list");
		if (tracksList) {
			tracksList.innerHTML = "";

			topTracks.forEach((track) => {
				const li = document.createElement("li");

				if (track.album && track.album.images && track.album.images[0]) {
					const albumImage = new Image(100, 100);
					albumImage.src = track.album.images[0].url;
					const spanAvatar = document.createElement("span");
					spanAvatar.appendChild(albumImage);
					li.appendChild(spanAvatar);
				}

				const title = document.createElement("p");
				title.innerHTML = track.name || "Unknown Track";
				li.appendChild(title);

				tracksList.appendChild(li);
			});
		}
	}
}

window.addEventListener("resize", () => {
	if (topArtists && topArtists.length > 0) {
		renderArtists(topArtists);
	}
});
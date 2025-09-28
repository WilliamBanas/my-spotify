const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const redirectUri = import.meta.env.VITE_REDIRECT_URI;

console.log("Environment variables:");
console.log("clientId:", clientId);
console.log("redirectUri:", redirectUri);

const params = new URLSearchParams(window.location.search);
const code = params.get("code");
console.log("Authorization code:", code);

let profile, allUserPlaylists, personnalPlaylists, topArtists, topTracks;

if (!code) {
	redirectToAuthCodeFlow(clientId);
} else {
	const accessToken = await getAccessToken(clientId, code);
	console.log("Access token:", accessToken);
	
	profile = await fetchProfile(accessToken);
	console.log("Profile:", profile);
	
	const allUserPlaylistsData = await fetchUserPlaylists(accessToken);
	console.log("Playlists data:", allUserPlaylistsData);
	allUserPlaylists = allUserPlaylistsData?.items || [];
	personnalPlaylists = allUserPlaylists.filter(
		(p) => p?.owner?.display_name === profile?.display_name
	);
	
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
}

export async function redirectToAuthCodeFlow(clientId) {
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
	const verifier = localStorage.getItem("verifier");
	console.log("Verifier from localStorage:", verifier);

	const params = new URLSearchParams();
	params.append("client_id", clientId);
	params.append("grant_type", "authorization_code");
	params.append("code", code);
	params.append("redirect_uri", redirectUri);
	params.append("code_verifier", verifier);

	console.log("Token request params:", {
		client_id: clientId,
		redirect_uri: redirectUri,
		code: code,
		verifier: verifier
	});

	const result = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: params,
	});

	console.log("Token response status:", result.status);
	const tokenData = await result.json();
	console.log("Token response data:", tokenData);

	const { access_token } = tokenData;
	return access_token;
}

async function fetchProfile(token) {
	const result = await fetch("https://api.spotify.com/v1/me", {
		method: "GET",
		headers: { Authorization: `Bearer ${token}` },
	});

	return await result.json();
}

async function fetchUserPlaylists(token) {
	const result = await fetch("https://api.spotify.com/v1/me/playlists", {
		method: "GET",
		headers: { Authorization: `Bearer ${token}` },
	});

	return await result.json();
}

async function fetchUserTopArtists(token) {
	const result = await fetch(
		`https://api.spotify.com/v1/me/top/artists?time_range=short_term`,
		{
			method: "GET",
			headers: { Authorization: `Bearer ${token}` },
		}
	);

	console.log("Top artists result:", result);
	return await result.json();
}

async function fetchUserTopTracks(token) {
	const result = await fetch(
		`https://api.spotify.com/v1/me/top/tracks?time_range=short_term`,
		{
			method: "GET",
			headers: { Authorization: `Bearer ${token}` },
		}
	);

	console.log("Top tracks result:", result);
	return await result.json();
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
	artistsList.innerHTML = "";
	const artistsToShow = getArtistsToDisplay();
	topArtists.slice(0, artistsToShow).forEach((artist) => {
		const li = document.createElement("li");
		const divContainer = document.createElement("div");

		if (artist.images[0]) {
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
		spanName.innerHTML = artist.name;
		const spanType = document.createElement("span");
		spanType.setAttribute("class", "divTitle__type");
		spanType.innerHTML = artist.type;
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
	document.getElementById("displayName").innerText = profile.display_name;

	if (profile.images[0]) {
		const profileImage = new Image(150, 150);
		profileImage.src = profile.images[0].url;
		document.getElementById("avatar").appendChild(profileImage);
	}

	document.getElementById("product").innerHTML =
		profile.product === "premium" ? "Premium" : "Free plan";

	document.getElementById("followers").innerHTML =
		profile.followers.total > 1
			? `${profile.followers.total} followers`
			: `${profile.followers.total} follower`;

	document.getElementById("playlists").innerHTML =
		personnalPlaylists.length > 1
			? `${personnalPlaylists.length} public playlists`
			: `${personnalPlaylists.length} public playlist`;

	if (topArtists && topArtists.length > 0) {
		renderArtists(topArtists);
	}

	if (topTracks && topTracks.length > 0) {
		const tracksList = document.getElementById("tracks__list");
		tracksList.innerHTML = "";

		topTracks.forEach((track) => {
			const li = document.createElement("li");

			if (track.album.images[0]) {
				const albumImage = new Image(100, 100);
				albumImage.src = track.album.images[0].url;
				const spanAvatar = document.createElement("span");
				spanAvatar.appendChild(albumImage);
				li.appendChild(spanAvatar);
			}

			const title = document.createElement("p");
			title.innerHTML = track.name;
			li.appendChild(title);

			tracksList.appendChild(li);
		});
	}
}

window.addEventListener("resize", () => {
	if (topArtists && topArtists.length > 0) {
		renderArtists(topArtists);
	}
});
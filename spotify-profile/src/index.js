import { profile } from "./data";
import { playlists } from "./data";
import { artistsData } from "./data";
import { tracksData } from "./data";

function initApp() {

  const personnalPlaylists = playlists.items;
  const topArtists = artistsData.items;
  const topTracks = tracksData.items
  const allUserPlaylists = personnalPlaylists.length;

	populateUI(
		profile,
		allUserPlaylists,
		personnalPlaylists,
		topArtists,
		topTracks
	);

  renderArtists(topArtists);
  renderTracks(topTracks);
  renderPlaylists(personnalPlaylists);
}

initApp();

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
		{ color: "linear-gradient(180deg, #6B5B9A 0%, #3D2B5E 100%)" }, // Violet
		{ color: "linear-gradient(180deg, #4D6A90 0%, #2A3342 100%)" }, // Bleu foncé
		{ color: "linear-gradient(180deg, #4A8B5A 0%, #254D2E 100%)" }, // Vert forêt
		{ color: "linear-gradient(180deg, #C85A5A 0%, #6B2E2E 100%)" }, // Rouge brique
		{ color: "linear-gradient(180deg, #8B6A4D 0%, #3E3323 100%)" }, // Brun/Orange
		{ color: "linear-gradient(180deg, #4D7B7B 0%, #2A3E3E 100%)" }, // Turquoise foncé
		{ color: "linear-gradient(180deg, #D4A855 0%, #6B5428 100%)" }, // Jaune doré
		{ color: "linear-gradient(180deg, #5A8FAF 0%, #2A4757 100%)" }, // Bleu ciel foncé
		{ color: "linear-gradient(180deg, #B85A8B 0%, #5D2A43 100%)" }, // Rose/Mauve
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
			spanColor.style.outline = "1px solid var(--text)";
		}

		spanColor.addEventListener("click", function (e) {
			let savedGradients =
				JSON.parse(localStorage.getItem("selectedGradients")) || [];
			// retourne l'index du premier élément qui correspond sinon retourne -1
			const index = savedGradients.findIndex(
				(saved) =>
					normalizeGradient(saved) === normalizeGradient(gradient.color)
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
		let savedGradients =
			JSON.parse(localStorage.getItem("selectedGradients")) || [];

		if (intervalId) clearInterval(intervalId);

		const background = document.getElementById("background");

		if (!savedGradients.length) {
			background.style.background = "var(--secondary-background)";
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

import { profile } from "./data";
import { playlists } from "./data";
import { artistsData } from "./data";
import { tracksData } from "./data";
import { backgroundPhotosUi, getBackgroundPhotos } from "./scripts/backgroundPhotosUi";

const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

const personnalPlaylists = playlists.items;
const topArtists = artistsData.items;
const topTracks = tracksData.items;
const allUserPlaylists = personnalPlaylists.length;

let backgroundPhotos = JSON.parse(localStorage.getItem("savedPhotos")) || [];

let bgIntervalId = null;
let bgCurrentIndex = 0;

function startBackgroundRotation() {
	if (bgIntervalId) {
		clearInterval(bgIntervalId);
		bgIntervalId = null;
	}

	const background = document.getElementById("background");
	if (!background) return;

	const savedPhotos = JSON.parse(localStorage.getItem("selectedPhotos")) || [];
	const savedGradients =
		JSON.parse(localStorage.getItem("selectedGradients")) || [];

	if (savedPhotos.length > 0) {
		bgCurrentIndex = bgCurrentIndex % savedPhotos.length;
		background.style.backgroundImage = `url(${savedPhotos[bgCurrentIndex]})`;
		background.style.backgroundSize = "cover";
		background.style.backgroundPosition = "center";

		if (savedPhotos.length > 1) {
			bgIntervalId = setInterval(() => {
				bgCurrentIndex = (bgCurrentIndex + 1) % savedPhotos.length;
				background.style.backgroundImage = `url(${savedPhotos[bgCurrentIndex]})`;
			}, 5000);
		}
		return;
	}

	if (savedGradients.length > 0) {
		bgCurrentIndex = bgCurrentIndex % savedGradients.length;
		background.style.background = savedGradients[bgCurrentIndex];

		if (savedGradients.length > 1) {
			bgIntervalId = setInterval(() => {
				bgCurrentIndex = (bgCurrentIndex + 1) % savedGradients.length;
				background.style.background = savedGradients[bgCurrentIndex];
			}, 5000);
		}
		return;
	}

	// Fallback
	background.style.background = "var(--secondary-background)";
	background.style.backgroundImage = "";
}

// ---------------- INIT APP ----------------
async function initApp() {

  if (!backgroundPhotos || backgroundPhotos.length === 0) {
		const fetched = await getBackgroundPhotos(ACCESS_KEY);
		if (!fetched) console.warn("No photos returned.");
		else {
			backgroundPhotos = fetched;
			localStorage.setItem("savedPhotos", JSON.stringify(backgroundPhotos));
		}
	}

	await populateUI(
		profile,
		allUserPlaylists,
		personnalPlaylists,
		topArtists,
		topTracks
	);

	renderArtists(topArtists);
	renderTracks(topTracks);
	renderPlaylists(personnalPlaylists);

	// Charger photos Unsplash si besoin
	if (!backgroundPhotos || backgroundPhotos.length === 0) {
		const fetched = await getBackgroundPhotos(ACCESS_KEY);
		if (!fetched) console.warn("No photos returned.");
		else {
			backgroundPhotos = fetched;
			localStorage.setItem("savedPhotos", JSON.stringify(backgroundPhotos));
		}
	}
}

initApp();

// ---------------- RESPONSIVE GRID ----------------
function gridDisplay() {
	const w = window.innerWidth;
	if (w < 768) return 2;
	if (w < 830) return 3;
	if (w < 1017) return 4;
	if (w < 1200) return 5;
	if (w < 1378) return 6;
	return 7;
}

// ---------------- RENDER ARTISTS ----------------
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

// ---------------- RENDER TRACKS ----------------
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
		const artistNames = track.artists.map((artist) => artist.name).join(", ");
		spanArtists.innerHTML = artistNames;
		spanTitleArtists.appendChild(spanArtists);
		const spanAlbum = document.createElement("span");
		spanAlbum.setAttribute("class", "album");
		spanAlbum.innerHTML = track.album.name;
		li.appendChild(spanAlbum);

		if (window.innerWidth > 480) {
			const ms = track.duration_ms;
			const minutes = Math.floor(ms / 60000);
			const seconds = Math.floor((ms % 60000) / 1000);
			const formatted = `${minutes}:${seconds
				.toString()
				.padStart(2, "0")}`;
			const spanDuration = document.createElement("span");
			spanDuration.setAttribute("class", "duration");
			spanDuration.innerHTML = formatted;
			li.appendChild(spanDuration);
		}

		tracksList.appendChild(li);
	});
}

// ---------------- RENDER PLAYLISTS ----------------
function renderPlaylists(personnalPlaylists, profile) {
	const playlistsList = document.getElementById("playlists__list");
	if (!personnalPlaylists || !Array.isArray(personnalPlaylists)) return;
	playlistsList.innerHTML = "";
	personnalPlaylists.slice(0, 6).forEach((playlist) => {
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

// ---------------- UI PRINCIPALE ----------------
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

	// const productEl = document.getElementById("product");
	// if (productEl)
	// 	productEl.innerText =
	// 		profile.product === "premium" ? "Premium" : "Free plan";

	const followersEl = document.getElementById("followers");
	if (followersEl)
		followersEl.innerText =
			profile.followers?.total > 1
				? `${profile.followers.total} followers`
				: `${profile.followers?.total || 0} follower`;

	const playlistsEl = document.getElementById("playlists");
	if (playlistsEl)
		playlistsEl.innerText =
			(Array.isArray(personnalPlaylists)
				? personnalPlaylists.length
				: 0) > 1
				? `${personnalPlaylists.length} public playlists`
				: `${personnalPlaylists?.length || 0} public playlist`;

	if (Array.isArray(topArtists) && topArtists.length) renderArtists(topArtists);
	if (Array.isArray(topTracks) && topTracks.length) renderTracks(topTracks);
	if (Array.isArray(personnalPlaylists) && personnalPlaylists.length)
		renderPlaylists(personnalPlaylists, profile);

	// ----------- Couleurs disponibles -----------
	const gradients = [
		{ color: "linear-gradient(180deg, #6B5B9A 0%, #3D2B5E 100%)" },
		{ color: "linear-gradient(180deg, #4D6A90 0%, #2A3342 100%)" },
		{ color: "linear-gradient(180deg, #4A8B5A 0%, #254D2E 100%)" },
		{ color: "linear-gradient(180deg, #C85A5A 0%, #6B2E2E 100%)" },
		{ color: "linear-gradient(180deg, #8B6A4D 0%, #3E3323 100%)" },
		{ color: "linear-gradient(180deg, #4D7B7B 0%, #2A3E3E 100%)" },
		{ color: "linear-gradient(180deg, #D4A855 0%, #6B5428 100%)" },
		{ color: "linear-gradient(180deg, #5A8FAF 0%, #2A4757 100%)" },
		{ color: "linear-gradient(180deg, #B85A8B 0%, #5D2A43 100%)" },
	];

	const editBackgroundButton = document.getElementById("edit__button");
	const modal = document.getElementById("modal");

	editBackgroundButton.addEventListener("click", (e) => {
		e.stopPropagation();
		modal.classList.toggle("modal-showed");
	});

	modal.addEventListener("click", (e) => e.stopPropagation());

	// Création des options couleurs
	const colorList = document.createElement("ul");
	colorList.setAttribute("id", "colors__list");
	modal.appendChild(colorList);

	let savedGradients =
		JSON.parse(localStorage.getItem("selectedGradients")) || [];

	const normalizeGradient = (grad) => grad.replace(/\s+/g, " ").trim();

	gradients.forEach((gradient) => {
		const li = document.createElement("li");
		const spanColor = document.createElement("span");
		spanColor.style.width = "96px";
		spanColor.style.height = "54px";
		spanColor.style.display = "inline-block";
		spanColor.style.borderRadius = "8px";
		spanColor.style.cursor = "pointer";
		spanColor.style.background = gradient.color;

		const isSelected = savedGradients.some(
			(saved) => normalizeGradient(saved) === normalizeGradient(gradient.color)
		);
		if (isSelected) spanColor.style.outline = "1px solid var(--text)";

		spanColor.addEventListener("click", () => {
			if (localStorage.getItem("selectedPhotos")) {
				localStorage.removeItem("selectedPhotos");
			}
			let current = JSON.parse(localStorage.getItem("selectedGradients")) || [];
			const index = current.findIndex(
				(saved) => normalizeGradient(saved) === normalizeGradient(gradient.color)
			);

			if (index === -1) {
				current.push(gradient.color);
				spanColor.style.outline = "1px solid var(--text)";
			} else {
				current.splice(index, 1);
				spanColor.style.outline = "none";
			}

			localStorage.setItem("selectedGradients", JSON.stringify(current));
			startBackgroundRotation();
		});

		li.appendChild(spanColor);
		colorList.appendChild(li);
	});

	// Création de la liste photos
	await backgroundPhotosUi(backgroundPhotos, startBackgroundRotation);

	// Binding des boutons Colors et Photos APRÈS la création des deux listes
	const colorsButton = document.getElementById("colorsButton");
	const photosButton = document.getElementById("photosButton");

	// Initialiser le bouton Colors comme actif par défaut
	if (colorsButton) colorsButton.classList.add("active");

	if (colorsButton) {
		colorsButton.addEventListener("click", () => {
			const photoList = document.getElementById("photos__list");
			const colorList = document.getElementById("colors__list");
			if (photoList) photoList.style.display = "none";
			if (colorList) colorList.style.display = "grid";
			colorsButton.classList.add("active");
			if (photosButton) photosButton.classList.remove("active");
		});
	}

	if (photosButton) {
		photosButton.addEventListener("click", () => {
			const colorList = document.getElementById("colors__list");
			const photoList = document.getElementById("photos__list");
			if (colorList) colorList.style.display = "none";
			if (photoList) photoList.style.display = "grid";
			photosButton.classList.add("active");
			if (colorsButton) colorsButton.classList.remove("active");
		});
	}

	startBackgroundRotation();
}

// ---------------- RESIZE ----------------
window.addEventListener("resize", () => {
	if (Array.isArray(topArtists) && topArtists.length) renderArtists(topArtists);
	if (Array.isArray(topTracks) && topTracks.length) renderTracks(topTracks);
});
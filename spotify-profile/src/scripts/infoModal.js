import close from "../../assets/logo/icons8-effacer-96.png";

export const createInfoModal = () => {
	const infoModal = document.createElement("div");
	document.body.appendChild(infoModal);
	infoModal.setAttribute("class", "infoModal");
	infoModal.setAttribute("id", "infoModal");
	const infoModalContainer = document.createElement("div");
	infoModalContainer.setAttribute("class", "infoModal__container");
	const closeButton = new Image(25, 25);
	closeButton.src = close;
	closeButton.addEventListener("click", () => {
		document.body.style.overflow = "auto";
		infoModal.style.display = "none";
	});
	const title = document.createElement("h3");
	const text = document.createElement("p");
	infoModalContainer.appendChild(closeButton);
	infoModalContainer.appendChild(title);
	infoModalContainer.appendChild(text);
	infoModal.appendChild(infoModalContainer);

	return { infoModal, title, text };
};

export const getArtistInfos = async (artist) => {
	try {
		const { infoModal, title, text } = createInfoModal();

		infoModal.style.display = "block";
		document.body.style.overflow = "hidden";

		title.textContent = artist.name;
		text.textContent = "Chargement...";

		const genres = artist.genres
			? artist.genres
					.filter((g) => g)
					.slice(0, 3)
					.join(", ")
			: "genre inconnu";

		const res = await puter.ai.chat(
			`Donne moi une brève description de l'artiste ${artist.name} (genres musicaux: ${genres}) (ne formule pas ça comme si tu me parlais à moi mais comme si tu donnais simplement la description et rien d'autre.)`,
			{
				model: "gpt-5-nano",
			}
		);
		console.log(res);
		if (res) {
			text.textContent = res.message.content;
		} else {
			text.textContent = "Aucune information trouvée.";
		}
	} catch (error) {
		console.error(error);
		text.textContent = "Erreur lors du chargement des informations.";
	}
};

export const getTrackInfos = async (track) => {
	try {
		const { infoModal, title, text } = createInfoModal();

		infoModal.style.display = "block";
		document.body.style.overflow = "hidden";

		const artists = track.artists
			? track.artists
					.filter((artist) => artist?.name)
					.slice(0, 3)
					.map((artist) => artist.name)
					.join(", ")
			: "artiste inconnu";

    title.textContent = `${track.name} - ${artists}`;
		text.textContent = "Chargement...";

		const res = await puter.ai.chat(
			`Donne moi une brève description de la musique suivante: ${track.name} de ${artists}(ne formule pas ça comme si tu me parlais à moi mais comme si tu donnais simplement la description et rien d'autre.)`,
			{
				model: "gpt-5-nano",
			}
		);

		if (res) {
			text.textContent = res.message.content;
		} else {
			text.textContent = "Aucune information trouvée.";
		}
	} catch (error) {
		console.error(error);
		text.textContent = "Erreur lors du chargement des informations.";
	}
};

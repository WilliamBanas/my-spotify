export const getBackgroundPhotos = async (ACCESS_KEY) => {
	try {
		const res = await fetch(
			`https://api.unsplash.com/photos/random?orientation=landscape&count=9`,
			{
				method: "GET",
				headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
			}
		);
		if (!res.ok) return null;
		return await res.json();
	} catch (error) {
		return null;
	}
};

let backgroundPhotos = JSON.parse(localStorage.getItem("savedPhotos")) || [];

export const backgroundPhotosUi = async (backgroundPhotos, startBackgroundRotation) => {
	const modal = document.getElementById("modal");
	const photoList = document.createElement("ul");
	photoList.setAttribute("id", "photos__list");
	photoList.style.display = "none"; // IMPORTANT: Cacher par défaut
	modal.appendChild(photoList);

	let savedPhotos = JSON.parse(localStorage.getItem("selectedPhotos")) || [];

	backgroundPhotos.forEach((photo) => {
		const li = document.createElement("li");
		const spanPhoto = document.createElement("span");
		spanPhoto.style.width = "96px";
		spanPhoto.style.height = "54px";
		spanPhoto.style.display = "inline-block";
		spanPhoto.style.borderRadius = "8px";
		spanPhoto.style.cursor = "pointer";
		spanPhoto.style.backgroundImage = `url(${photo.urls.regular})`;
		spanPhoto.style.backgroundSize = "cover";
		spanPhoto.style.backgroundPosition = "center";

		const isSelected = savedPhotos.includes(photo.urls.regular);
		if (isSelected) spanPhoto.style.outline = "1px solid var(--text)";

		spanPhoto.addEventListener("click", () => {
			if (localStorage.getItem("selectedGradients")) {
				localStorage.removeItem("selectedGradients");
			}
			let currentPhotos =
				JSON.parse(localStorage.getItem("selectedPhotos")) || [];
			const index = currentPhotos.findIndex(
				(saved) => saved === photo.urls.regular
			);

			if (index === -1) {
				currentPhotos.push(photo.urls.regular);
				spanPhoto.style.outline = "1px solid var(--text)";
			} else {
				currentPhotos.splice(index, 1);
				spanPhoto.style.outline = "none";
			}

			localStorage.setItem("selectedPhotos", JSON.stringify(currentPhotos));
			startBackgroundRotation();
		});

		li.appendChild(spanPhoto);
		photoList.appendChild(li);
	});
};
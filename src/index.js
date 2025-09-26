const token = "TON_ACCESS_TOKEN_ICI"; 

async function getPlaylists() {
  const res = await fetch("https://api.spotify.com/v1/me/playlists", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await res.json();

  const list = document.getElementById("playlists");
  data.items.forEach(playlist => {
    const li = document.createElement("li");
    li.textContent = `${playlist.name} (${playlist.tracks.total} titres)`;
    list.appendChild(li);
  });
}

getPlaylists();
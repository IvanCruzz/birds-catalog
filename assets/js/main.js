// Main JS File
// =============================
// ELEMENTOS DA PÁGINA
// =============================

const birdsContainer = document.getElementById("birds-container");
const emptyMessage = document.getElementById("empty-message");
const searchInput = document.getElementById("search-bird");


// =============================
// CARREGAR PÁSSAROS
// =============================

async function loadBirds() {

    birdsContainer.innerHTML = "<p>Carregando pássaros...</p>";

    const { data, error } = await supabaseClient
        .from("passaros")
        .select("*")
        .order("created_at", { ascending: false });


    // =============================
    // ERRO
    // =============================

    if (error) {

        console.error(
            "Erro ao carregar pássaros:",
            error
        );

        birdsContainer.innerHTML = `
            <p>
                Não foi possível carregar os pássaros.
            </p>
        `;

        return;
    }


    // =============================
    // NENHUM PÁSSARO
    // =============================

    if (data.length === 0) {

        birdsContainer.innerHTML = "";

        emptyMessage.style.display = "block";

        return;
    }


    // Esconde a mensagem de lista vazia
    emptyMessage.style.display = "none";


    // =============================
    // CRIAR CARDS
    // =============================

    birdsContainer.innerHTML = "";

    data.forEach((bird) => {

        const birdCard = document.createElement("article");

        birdCard.classList.add("bird-card");

        birdCard.innerHTML = `
            
            <img
                src="${bird.imagem_url}"
                alt="Imagem de ${bird.nome}"
            >

            <div class="bird-card-info">

                <h2>
                    ${bird.nome}
                </h2>

                <p class="scientific-name">
                    ${bird.nome_cientifico}
                </p>

                <audio
                    controls
                    src="${bird.audio_url}"
                >
                </audio>

            </div>

        `;

        birdsContainer.appendChild(birdCard);

    });

}


// =============================
// INICIAR
// =============================

loadBirds();
// =============================
// PESQUISAR PÁSSAROS
// =============================

searchInput.addEventListener("input", () => {

    const search = searchInput.value.toLowerCase().trim();

    const cards = document.querySelectorAll(".bird-card");

    cards.forEach((card) => {

        const name = card
            .querySelector("h2")
            .textContent
            .toLowerCase();

        const scientificName = card
            .querySelector(".scientific-name")
            .textContent
            .toLowerCase();


        if (
            name.includes(search) ||
            scientificName.includes(search)
        ) {

            card.style.display = "block";

        } else {

            card.style.display = "none";

        }

    });

});
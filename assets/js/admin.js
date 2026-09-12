// Admin JS File

const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const loginScreen = document.getElementById("login-screen");
const adminPanel = document.getElementById("admin-panel");

loginForm.addEventListener("submit", async (event) => {
	event.preventDefault();
	
	const email = document.getElementById('email').value;
	const password = document.getElementById('password').value;
	
	loginMessage.textContent = "Entrando...";
	
	const {	data, error } = await supabaseClient.auth.signInWithPassword({
		email: email,
		password: password
	});
	
	if (error) {
		console.error(error);
		
		
		loginMessage.textContent = "Email ou senha incorretos...";
		return;
	}
	console.log("Usuário logado: ", data.user);
  document.body.classList.add("admin-mode");
	loginScreen.style.display = "none";
  adminPanel.style.display = "block";
  loadBirds();
	
	loginMessage.textContent = "Login realizado!";
});

const addBirdButton = document.getElementById("add-bird-btn");
const addBirdModal = document.getElementById("add-bird-modal");
const closeAddModal = document.getElementById("close-add-modal");
const birdImage = document.getElementById("bird-image");
const birdAudio = document.getElementById("bird-audio");

const imageFileLabel = document.getElementById("image-file-label");
const audioFileLabel = document.getElementById("audio-file-label");
birdImage.addEventListener("change", () => {

    if (birdImage.files.length > 0) {

        imageFileLabel.querySelector("span").textContent =
            birdImage.files[0].name;

    }

});
birdAudio.addEventListener("change", () => {

    if (birdAudio.files.length > 0) {

        audioFileLabel.querySelector("span").textContent =
            birdAudio.files[0].name;

    }

});

// Abrir modal
addBirdButton.addEventListener("click", () => {
    addBirdModal.style.display = "flex";
});


// Fechar pelo X
closeAddModal.addEventListener("click", () => {
    addBirdModal.style.display = "none";
});


// Fechar clicando fora
addBirdModal.addEventListener("click", (event) => {

    if (event.target === addBirdModal) {
        addBirdModal.style.display = "none";
    }

});

// Upload para o storage no supabase

async function uploadFile(file, bucket) {

    const fileName = `${Date.now()}-${file.name}`;

    const { error } = await supabaseClient.storage
        .from(bucket)
        .upload(fileName, file);

    if (error) {
        console.error("Erro no upload:", error);
        throw error;
    }

    const { data } = supabaseClient.storage
        .from(bucket)
        .getPublicUrl(fileName);

    return data.publicUrl;
}


// =============================
// CADASTRAR PÁSSARO
// =============================

const addBirdForm = document.getElementById("add-bird-form");

addBirdForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const nome = document.getElementById("bird-name").value;
    const nomeCientifico = document.getElementById("scientific-name").value;

    const imagem = document.getElementById("bird-image").files[0];
    const audio = document.getElementById("bird-audio").files[0];

    if (!imagem || !audio) {
        alert("Selecione a imagem e o áudio do pássaro.");
        return;
    }

    try {

        // Upload da imagem
        const imagemUrl = await uploadFile(imagem, "imagens");

        // Upload do áudio
        const audioUrl = await uploadFile(audio, "audios");


        // Salvar no banco
        const { error } = await supabaseClient
            .from("passaros")
            .insert({
                nome: nome,
                nome_cientifico: nomeCientifico,
                imagem_url: imagemUrl,
                audio_url: audioUrl
            });


        if (error) {
            console.error("Erro ao salvar pássaro:", error);
            alert("Erro ao cadastrar o pássaro.");
            return;
        }


        alert("Pássaro cadastrado com sucesso! 🐦");

        addBirdForm.reset();

        addBirdModal.style.display = "none";
        
    } catch (error) {

        console.error(error);

        alert("Ocorreu um erro ao enviar os arquivos.");

    }

});

// =============================
// LISTAR PÁSSAROS
// =============================

const birdsList = document.getElementById("birds-list");

async function loadBirds() {

    birdsList.innerHTML = "<p>Carregando pássaros...</p>";

    const { data, error } = await supabaseClient
        .from("passaros")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Erro ao carregar pássaros:", error);
        birdsList.innerHTML = "<p>Erro ao carregar os pássaros.</p>";
        return;
    }

    birdsList.innerHTML = "";

    if (data.length === 0) {
        birdsList.innerHTML = "<p>Nenhum pássaro cadastrado ainda.</p>";
        return;
    }

    data.forEach((bird) => {

        const birdCard = document.createElement("article");

        birdCard.classList.add("admin-bird-card");

        birdCard.innerHTML = `
            <img 
                src="${bird.imagem_url}" 
                alt="${bird.nome}"
            >

            <div class="bird-card-info">

                <h2>${bird.nome}</h2>

                <p>${bird.nome_cientifico}</p>

                <audio controls src="${bird.audio_url}"></audio>

                <div class="bird-actions">

                    <button 
                        class="edit-bird-btn"
                        data-id="${bird.id}"
                    >
                        Editar
                    </button>

                    <button 
                        class="delete-bird-btn"
                        data-id="${bird.id}"
                    >
                        Excluir
                    </button>

                </div>

            </div>
        `;

        birdsList.appendChild(birdCard);
    });
}

// =============================
// EDITAR PÁSSARO
// =============================

const editBirdModal = document.getElementById("edit-bird-modal");
const closeEditModal = document.getElementById("close-edit-modal");
const editBirdForm = document.getElementById("edit-bird-form");

const editBirdName = document.getElementById("edit-bird-name");
const editScientificName = document.getElementById("edit-scientific-name");

const editBirdImage = document.getElementById("edit-bird-image");
const editBirdAudio = document.getElementById("edit-bird-audio");

const editImageFileName = document.getElementById("edit-image-file-name");
const editAudioFileName = document.getElementById("edit-audio-file-name");


// Pássaro que está sendo editado
let editingBird = null;


// =============================
// ABRIR MODAL DE EDIÇÃO
// =============================

birdsList.addEventListener("click", (event) => {

    const editButton = event.target.closest(".edit-bird-btn");

    if (!editButton) {
        return;
    }

    const birdId = editButton.dataset.id;

    openEditModal(birdId);
});


// =============================
// PEGAR PÁSSARO E ABRIR MODAL
// =============================

async function openEditModal(birdId) {

    const { data, error } = await supabaseClient
        .from("passaros")
        .select("*")
        .eq("id", birdId)
        .single();

    if (error) {
        console.error("Erro ao buscar pássaro:", error);
        alert("Não foi possível carregar os dados do pássaro.");
        return;
    }

    editingBird = data;

    editBirdName.value = data.nome;
    editScientificName.value = data.nome_cientifico;

    editImageFileName.textContent = "Manter imagem atual";
    editAudioFileName.textContent = "Manter áudio atual";

    editBirdImage.value = "";
    editBirdAudio.value = "";

    editBirdModal.style.display = "flex";
}
closeEditModal.addEventListener("click", () => {
    editBirdModal.style.display = "none";
});
editBirdModal.addEventListener("click", (event) => {

    if (event.target === editBirdModal) {
        editBirdModal.style.display = "none";
    }

});
editBirdImage.addEventListener("change", () => {

    if (editBirdImage.files.length > 0) {

        editImageFileName.textContent =
            editBirdImage.files[0].name;

    } else {

        editImageFileName.textContent =
            "Manter imagem atual";

    }

});
editBirdAudio.addEventListener("change", () => {

    if (editBirdAudio.files.length > 0) {

        editAudioFileName.textContent =
            editBirdAudio.files[0].name;

    } else {

        editAudioFileName.textContent =
            "Manter áudio atual";

    }

});
editBirdForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    if (!editingBird) {
        return;
    }

    const nome = editBirdName.value;
    const nomeCientifico = editScientificName.value;

    const novaImagem = editBirdImage.files[0];
    const novoAudio = editBirdAudio.files[0];

    try {

        let imagemUrl = editingBird.imagem_url;
        let audioUrl = editingBird.audio_url;


        // =============================
        // NOVA IMAGEM
        // =============================

        if (novaImagem) {

            imagemUrl = await uploadFile(
                novaImagem,
                "imagens"
            );

        }


        // =============================
        // NOVO ÁUDIO
        // =============================

        if (novoAudio) {

            audioUrl = await uploadFile(
                novoAudio,
                "audios"
            );

        }


        // =============================
        // ATUALIZAR BANCO
        // =============================

        const { error } = await supabaseClient
            .from("passaros")
            .update({
                nome: nome,
                nome_cientifico: nomeCientifico,
                imagem_url: imagemUrl,
                audio_url: audioUrl
            })
            .eq("id", editingBird.id);


        if (error) {

            console.error(
                "Erro ao atualizar pássaro:",
                error
            );

            alert("Erro ao atualizar o pássaro.");

            return;
        }


        // =============================
        // FINALIZAR
        // =============================

        alert("Pássaro atualizado com sucesso! 🐦");

        editBirdForm.reset();

        editBirdModal.style.display = "none";

        editingBird = null;

        loadBirds();

    } catch (error) {

        console.error(error);

        alert("Ocorreu um erro ao atualizar o pássaro.");

    }

});

async function deleteBird(birdId) {

    // =============================
    // BUSCAR PÁSSARO
    // =============================

    const { data: bird, error: fetchError } = await supabaseClient
        .from("passaros")
        .select("*")
        .eq("id", birdId)
        .single();

    if (fetchError) {

        console.error(
            "Erro ao buscar pássaro:",
            fetchError
        );

        alert("Não foi possível encontrar o pássaro.");

        return;
    }


    // =============================
    // CONFIRMAÇÃO
    // =============================

    const confirmed = confirm(
        `Tem certeza que deseja excluir "${bird.nome}"?`
    );

    if (!confirmed) {
        return;
    }


    try {

        // =============================
        // PEGAR CAMINHO DOS ARQUIVOS
        // =============================

        const imagemPath = getStoragePath(
            bird.imagem_url,
            "imagens"
        );

        const audioPath = getStoragePath(
            bird.audio_url,
            "audios"
        );


        // =============================
        // EXCLUIR IMAGEM
        // =============================

        if (imagemPath) {

            const { error: imageError } =
                await supabaseClient.storage
                    .from("imagens")
                    .remove([imagemPath]);

            if (imageError) {
                console.error(
                    "Erro ao excluir imagem:",
                    imageError
                );
            }
        }


        // =============================
        // EXCLUIR ÁUDIO
        // =============================

        if (audioPath) {

            const { error: audioError } =
                await supabaseClient.storage
                    .from("audios")
                    .remove([audioPath]);

            if (audioError) {
                console.error(
                    "Erro ao excluir áudio:",
                    audioError
                );
            }
        }


        // =============================
        // EXCLUIR DO BANCO
        // =============================

        const { error: deleteError } =
            await supabaseClient
                .from("passaros")
                .delete()
                .eq("id", birdId);


        if (deleteError) {

            console.error(
                "Erro ao excluir pássaro:",
                deleteError
            );

            alert("Erro ao excluir o pássaro.");

            return;
        }


        // =============================
        // FINALIZAR
        // =============================

        alert("Pássaro excluído com sucesso! 🗑️");

        loadBirds();

    } catch (error) {

        console.error(error);

        alert("Ocorreu um erro ao excluir o pássaro.");

    }

}
// =============================
// PEGAR CAMINHO DO STORAGE
// =============================

function getStoragePath(url, bucket) {

    if (!url) {
        return null;
    }

    const marker = `/storage/v1/object/public/${bucket}/`;

    const index = url.indexOf(marker);

    if (index === -1) {
        return null;
    }

    return decodeURIComponent(
        url.substring(index + marker.length)
    );
}

// =============================
// EXCLUIR PÁSSARO
// =============================

birdsList.addEventListener("click", async (event) => {

    const deleteButton = event.target.closest(".delete-bird-btn");

    if (!deleteButton) {
        return;
    }

    const birdId = deleteButton.dataset.id;

    await deleteBird(birdId);

});
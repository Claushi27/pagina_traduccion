document.addEventListener('DOMContentLoaded', () => {
    const wordTitle = document.getElementById('word-title');
    const phoneticText = document.getElementById('phonetic-text');
    const playAudioButton = document.getElementById('play-audio-button');
    const audioPlayer = document.getElementById('audio-player');
    const examplesList = document.getElementById('examples-list');
    const nextWordLink = document.getElementById('next-word-link');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    
    const API_BASE_URL = 'https://api.dictionaryapi.dev/api/v2';
    
    const getWordFromUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('q');
    };

    const fetchWordData = async (word) => {
        loadingMessage.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        
        try {
            const response = await fetch(`${API_BASE_URL}/entries/en/${word}`);

            if (!response.ok) {
                if (response.status === 404) {
                    errorMessage.textContent = 'Word not found. Go back and try another word.';
                } else {
                    errorMessage.textContent = 'An error occurred. Please try again later.';
                }
                errorMessage.classList.remove('hidden');
                loadingMessage.classList.add('hidden');
                return;
            }

            const data = await response.json();
            const wordData = data[0];
            
            // Actualizar el título de la palabra y el título de la página
            wordTitle.textContent = wordData.word;
            document.getElementById('page-title').textContent = `${wordData.word} - Pronunciation`;
            
            let phonetic = '';
            let audioUrl = '';

            // ** Lógica mejorada: Buscar la primera pronunciación con audio en todo el array **
            if (wordData.phonetics && wordData.phonetics.length > 0) {
                const phoneticWithAudio = wordData.phonetics.find(p => p.audio && p.text);
                if (phoneticWithAudio) {
                    phonetic = phoneticWithAudio.text;
                    audioUrl = phoneticWithAudio.audio;
                }
            }
            
            phoneticText.textContent = phonetic;
            audioPlayer.src = audioUrl;

            // Manejar las oraciones de ejemplo
            examplesList.innerHTML = ''; // Limpiar ejemplos previos
            let foundExamples = false;

            // ** Lógica mejorada: Recorrer todas las definiciones para encontrar ejemplos **
            if (wordData.meanings && wordData.meanings.length > 0) {
                wordData.meanings.forEach(meaning => {
                    if (meaning.definitions && meaning.definitions.length > 0) {
                        meaning.definitions.forEach(definition => {
                            if (definition.example) {
                                const li = document.createElement('li');
                                li.textContent = definition.example;
                                examplesList.appendChild(li);
                                foundExamples = true;
                            }
                        });
                    }
                });
            }

            if (!foundExamples) {
                 examplesList.innerHTML = '<li>No example sentences found.</li>';
            }

            loadingMessage.classList.add('hidden');
            
        } catch (error) {
            console.error('Error fetching data:', error);
            errorMessage.textContent = 'An error occurred. Please try again later.';
            errorMessage.classList.remove('hidden');
            loadingMessage.classList.add('hidden');
        }
    };
    
    playAudioButton.addEventListener('click', () => {
        if (audioPlayer.src) {
            audioPlayer.play();
        } else {
            alert('No audio available for this word.');
        }
    });

    const nextWords = ['developer', 'project', 'application', 'future', 'hello', 'learn'];
    const randomWord = nextWords[Math.floor(Math.random() * nextWords.length)];
    nextWordLink.textContent = randomWord;
    nextWordLink.href = `word.html?q=${randomWord}`;

    const wordToSearch = getWordFromUrl();
    if (wordToSearch) {
        fetchWordData(wordToSearch);
    } else {
        errorMessage.textContent = 'No word specified.';
        errorMessage.classList.remove('hidden');
    }
});
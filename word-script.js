document.addEventListener('DOMContentLoaded', () => {
    const wordTitle = document.getElementById('word-title');
    const phoneticText = document.getElementById('phonetic-text');
    const playAudioButton = document.getElementById('play-audio-button');
    const audioPlayer = document.getElementById('audio-player');
    const examplesList = document.getElementById('examples-list');
    const nextWordLink = document.getElementById('next-word-link');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    
    // ** TUS CREDENCIALES DE LAS APIS **
    const RAPIDAPI_KEY = '5d11d16b54msh31db87e7756fbfcp1d877djsnd5a71545bba5';
    const WORDSAPI_BASE_URL = 'https://wordsapiv1.p.rapidapi.com/words';

    const GOOGLE_TTS_KEY = 'AIzaSyBVvNf2TO6bFPTGoUxggmHLkdimhbECPbs'; // Tu clave de Google
    const GOOGLE_TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

    let currentWord = ''; // Variable para almacenar la palabra actual

    const getWordFromUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('q');
    };

    // Nueva función para generar el audio con la API de Google
    const fetchGoogleAudio = async (text) => {
        const response = await fetch(`${GOOGLE_TTS_ENDPOINT}?key=${GOOGLE_TTS_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                input: { text: text },
                voice: { languageCode: 'en-US', name: 'en-US-Wavenet-D' },
                audioConfig: { audioEncoding: 'MP3' }
            })
        });

        const data = await response.json();
        const audioContent = data.audioContent;
        
        // Convertir el audio de base64 a un blob y luego a una URL de objeto
        const audioBlob = b64toBlob(audioContent, 'audio/mp3');
        const audioUrl = URL.createObjectURL(audioBlob);

        return audioUrl;
    };
    
    // Función para convertir Base64 a Blob
    const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
        const byteCharacters = atob(b64Data);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        return new Blob(byteArrays, { type: contentType });
    };

    const fetchWordData = async (word) => {
        loadingMessage.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        
        try {
            const response = await fetch(`${WORDSAPI_BASE_URL}/${word}`, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Host': 'wordsapiv1.p.rapidapi.com',
                    'X-RapidAPI-Key': RAPIDAPI_KEY
                }
            });

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
            currentWord = data.word; // Guardar la palabra actual
            
            wordTitle.textContent = currentWord;
            document.getElementById('page-title').textContent = `${currentWord} - Pronunciation`;
            
            let phonetic = '';
            if (data.pronunciation && data.pronunciation.all) {
                phonetic = data.pronunciation.all;
            }
            
            phoneticText.textContent = `/${phonetic}/`;
            playAudioButton.style.display = 'block'; // Mostrar el botón de audio

            examplesList.innerHTML = '';
            let foundExamples = false;
            
            if (data.results && data.results.length > 0) {
                data.results.forEach(result => {
                    if (result.examples && result.examples.length > 0) {
                        result.examples.forEach(example => {
                            const li = document.createElement('li');
                            li.textContent = example;
                            examplesList.appendChild(li);
                            foundExamples = true;
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
    
    playAudioButton.addEventListener('click', async () => {
        playAudioButton.disabled = true;
        try {
            const audioUrl = await fetchGoogleAudio(currentWord);
            audioPlayer.src = audioUrl;
            audioPlayer.play();
        } catch (error) {
            console.error('Error playing audio:', error);
        } finally {
            playAudioButton.disabled = false;
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
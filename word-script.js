document.addEventListener('DOMContentLoaded', () => {
    const wordTitle = document.getElementById('word-title');
    const phoneticText = document.getElementById('phonetic-text');
    const playAudioButton = document.getElementById('play-audio-button');
    const audioPlayer = document.getElementById('audio-player');
    const examplesList = document.getElementById('examples-list');
    const nextWordLink = document.getElementById('next-word-link');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    const recordButton = document.getElementById('record-button');
    const stopButton = document.getElementById('stop-button');
    const recordingStatus = document.getElementById('recording-status');
    const microphoneSection = document.querySelector('.microphone-section');

    const RAPIDAPI_KEY = '5d11d16b54msh31db87e7756fbfcp1d877djsnd5a71545bba5';
    const WORDSAPI_BASE_URL = 'https://wordsapiv1.p.rapidapi.com/words';
    const GOOGLE_TTS_KEY = 'AIzaSyBVvNf2TO6bFPTGoUxggmHLkdimhbECPbs';
    const GOOGLE_TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';
    
    // ** NUEVA CLAVE Y ENDPOINT PARA SPEECH-TO-TEXT **
    const GOOGLE_STT_KEY = 'AIzaSyDxVl63RoaIwTtO5UaLPYnMoqoj2K8XtL4';
    const GOOGLE_STT_ENDPOINT = 'https://speech.googleapis.com/v1/speech:recognize';

    let currentWord = '';
    let mediaRecorder;
    let audioChunks = [];

    const getWordFromUrl = () => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('q');
    };
    
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

    const fetchGoogleAudio = async (text) => {
        const response = await fetch(`${GOOGLE_TTS_ENDPOINT}?key=${GOOGLE_TTS_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: { text: text },
                voice: { languageCode: 'en-US', name: 'en-US-Wavenet-D' },
                audioConfig: { audioEncoding: 'MP3' }
            })
        });
        const data = await response.json();
        const audioContent = data.audioContent;
        const audioBlob = b64toBlob(audioContent, 'audio/mp3');
        return URL.createObjectURL(audioBlob);
    };

    // ** NUEVA FUNCIÓN PARA TRANSCRIPCIÓN DE VOZ **
    const transcribeAudio = async (audioBlob) => {
        try {
            const audioBuffer = await audioBlob.arrayBuffer();
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

            const response = await fetch(`${GOOGLE_STT_ENDPOINT}?key=${GOOGLE_STT_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    config: {
                        encoding: 'WEBM_OPUS',
                        sampleRateHertz: 48000,
                        languageCode: 'en-US',
                        enableAutomaticPunctuation: false,
                        model: 'default'
                    },
                    audio: {
                        content: base64Audio
                    }
                })
            });

            const data = await response.json();
            if (data.results && data.results.length > 0) {
                return data.results[0].alternatives[0].transcript;
            } else {
                return null;
            }

        } catch (err) {
            console.error('Error in transcription:', err);
            return null;
        }
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
            currentWord = data.word;
            
            wordTitle.textContent = currentWord;
            document.getElementById('page-title').textContent = `${currentWord} - Pronunciation`;
            
            let phonetic = '';
            if (data.pronunciation && data.pronunciation.all) {
                phonetic = data.pronunciation.all;
            }
            
            phoneticText.textContent = `/${phonetic}/`;
            playAudioButton.style.display = 'block';

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

    recordButton.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = (e) => {
                audioChunks.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm; codecs=opus' });
                audioChunks = [];
                recordingStatus.textContent = 'Processing...';

                // ** NUEVA LÓGICA: Enviar a la API de Voz a Texto **
                const transcribedText = await transcribeAudio(audioBlob);

                if (transcribedText) {
                    // Lógica de comparación de pronunciación
                    if (transcribedText.toLowerCase().trim() === currentWord.toLowerCase().trim()) {
                        recordingStatus.textContent = `Correct! You said: "${transcribedText}"`;
                        recordingStatus.style.color = '#2ecc71';
                    } else {
                        recordingStatus.textContent = `Incorrect. You said: "${transcribedText}". Try again.`;
                        recordingStatus.style.color = '#e74c3c';
                    }
                } else {
                    recordingStatus.textContent = 'Could not understand. Please try again.';
                    recordingStatus.style.color = '#e74c3c';
                }
                
                recordButton.classList.remove('hidden');
                stopButton.classList.add('hidden');
                stream.getTracks().forEach(track => track.stop()); // Detener el micrófono
            };

            mediaRecorder.start();
            recordingStatus.textContent = 'Recording...';
            recordingStatus.style.color = '#3498db';
            recordButton.classList.add('hidden');
            stopButton.classList.remove('hidden');

        } catch (err) {
            console.error('Error accessing microphone:', err);
            recordingStatus.textContent = 'Error accessing microphone. Please allow access.';
            recordingStatus.style.color = '#e74c3c';
        }
    });

    stopButton.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
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
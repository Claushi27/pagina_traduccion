document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('search-button');
    const wordInput = document.getElementById('word-input');
    const autocompleteResults = document.getElementById('autocomplete-results');
    
    // Lista de palabras de ejemplo para el autocompletado
    const wordList = [
        'hello', 'world', 'learn', 'developer', 'project', 'application', 
        'future', 'pronunciation', 'dictionary', 'computer', 'language', 
        'beautiful', 'amazing', 'javascript', 'programming'
    ];

    const handleSearch = (word) => {
        if (word) {
            window.location.href = `word.html?q=${word}`;
        }
    };
    
    // Función para mostrar las sugerencias de autocompletado
    const showSuggestions = (query) => {
        autocompleteResults.innerHTML = ''; // Limpiar sugerencias anteriores
        if (query.length < 2) return; // Mostrar sugerencias solo si hay al menos 2 letras
        
        const filteredWords = wordList.filter(word => 
            word.toLowerCase().startsWith(query.toLowerCase())
        );

        if (filteredWords.length > 0) {
            filteredWords.forEach(word => {
                const item = document.createElement('div');
                item.classList.add('autocomplete-item');
                item.textContent = word;
                item.addEventListener('click', () => {
                    wordInput.value = word;
                    autocompleteResults.innerHTML = '';
                    handleSearch(word);
                });
                autocompleteResults.appendChild(item);
            });
        }
    };

    // Evento de escucha para el input de búsqueda
    wordInput.addEventListener('input', (e) => {
        showSuggestions(e.target.value);
    });

    searchButton.addEventListener('click', () => {
        handleSearch(wordInput.value);
    });

    wordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch(wordInput.value);
        }
    });
});
const liricle = new Liricle();
const player = document.getElementById('player');
const lyricsDiv = document.getElementById('lyrics');
const errorDiv = document.getElementById('error');
let currentObjectURL = null;
let isLyricsLoaded = false;

document.getElementById('audioInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    isLyricsLoaded = false;
    
    if (currentObjectURL) {
        URL.revokeObjectURL(currentObjectURL);
        currentObjectURL = null;
    }
    
    if (!player.paused) {
        player.pause();
    }
    player.removeAttribute('src');
    player.load();
    lyricsDiv.innerHTML = '';
    
    // Create new object URL
    currentObjectURL = URL.createObjectURL(file);
    player.src = currentObjectURL;

    try {
        const filename = file.name.replace(/\.[^.]+$/, '');
        const [artist, ...trackParts] = filename.split(' - ');
        const track = trackParts.join(' - ');

        const response = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(filename)}`);

        if (!response.ok) throw new Error('Failed to fetch lyrics');

        const data = await response.json();
        const lyricData = data.find(item => item.syncedLyrics);

        if (!lyricData) throw new Error('No synchronized lyrics found');

        liricle.load({ text: lyricData.syncedLyrics });
    } catch (error) {
        errorDiv.textContent = error.message;
    }
});

liricle.on('load', (data) => {
    lyricsDiv.innerHTML = data.lines
        .map(line => `<div class="line" data-time="${line.time}">${line.text}</div>`)
        .join('');
    isLyricsLoaded = true; // Set flag when lyrics are loaded
});

liricle.on('sync', (line) => {
    const lines = lyricsDiv.querySelectorAll('.line');
    lines.forEach(l => l.classList.remove('current-line'));
    if (line) {
        const currentLine = [...lines].find(l => parseFloat(l.dataset.time) === line.time);
        if (currentLine) {
            currentLine.classList.add('current-line');
            currentLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
});

liricle.on('loaderror', (error) => {
    errorDiv.textContent = `Lyrics error: ${error.message}`;
    isLyricsLoaded = false; // Ensure flag is reset on error
});

player.addEventListener('timeupdate', () => {
    if (isLyricsLoaded) {  // Only sync when lyrics are ready
        liricle.sync(player.currentTime);
    }
});

window.applyOffset = () => {
    liricle.offset = parseInt(document.getElementById('offset').value, 10);
};
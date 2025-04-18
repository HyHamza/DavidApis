import axios from 'axios';

async function fetchWithRetry(fn, url, retries = 100, body = {}, headers = {}) {
    let attempts = 0;
    let lastError;
    while (attempts < retries) {
        try {
            return await fn(url, body, headers);
        } catch (e) {
            lastError = e;
            attempts++;
            console.error(`Attempt ${attempts} failed. Retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    throw new Error(`Failed after ${retries} attempts: ${lastError.message}`);
}

const SaveTube = {
    qualities: {
        audio: { 1: '32', 2: '64', 3: '128', 4: '192' },
        video: { 1: '144', 2: '240', 3: '360', 4: '480', 5: '720', 6: '1080', 7: '1440', 8: '2160' }
    },
    
    headers: {
        'accept': '*/*',
        'referer': 'https://ytshorts.savetube.me/',
        'origin': 'https://ytshorts.savetube.me/',
        'user-agent': 'Postify/1.0.0',
        'Content-Type': 'application/json'
    },
    
    cdn() {
        return Math.floor(Math.random() * 11) + 51;
    },
    
    checkQuality(type, qualityIndex) {
        if (!(qualityIndex in this.qualities[type])) {
            throw new Error(`❌ Invalid ${type} Failed with Status: ${Object.keys(this.qualities[type]).join(', ')}`);
        }
    },
    
    async fetchData(url, cdn, body = {}) {
        const headers = {
            ...this.headers,
            'authority': `cdn${cdn}.savetube.su`
        };

        const fetchFunction = async (url, body, headers) => {
            const response = await axios.post(url, body, { headers });
            return response.data;
        };

        return fetchWithRetry(fetchFunction, url, 100, body, headers);
    },
    
    dLink(cdnUrl, type, quality, videoKey) {
        return `https://${cdnUrl}/download`;
    },
    
    async dl(link, qualityIndex, typeIndex) {
        const type = typeIndex === 1 ? 'audio' : 'video';
        const quality = SaveTube.qualities[type][qualityIndex];
        if (!type) throw new Error('❌ Invalid Media Type');
        SaveTube.checkQuality(type, qualityIndex);
        const cdnNumber = SaveTube.cdn();
        const cdnUrl = `cdn${cdnNumber}.savetube.su`;
        
        const videoInfo = await SaveTube.fetchData(`https://${cdnUrl}/info`, cdnNumber, { url: link });
        const badi = {
            downloadType: type,
            quality: quality,
            key: videoInfo.data.key
        };

        const dlRes = await SaveTube.fetchData(SaveTube.dLink(cdnUrl, type, quality, videoInfo.data.key), cdnNumber, badi);

        return {
            link: dlRes.data.downloadUrl,
            duration: videoInfo.data.duration,
            durationLabel: videoInfo.data.durationLabel,
            fromCache: videoInfo.data.fromCache,
            id: videoInfo.data.id,
            key: videoInfo.data.key,
            thumbnail: videoInfo.data.thumbnail,
            thumbnail_formats: videoInfo.data.thumbnail_formats,
            title: videoInfo.data.title,
            titleSlug: videoInfo.data.titleSlug,
            videoUrl: videoInfo.data.url,
            quality,
            type
        };
    },

    async mp3(link) {
        return SaveTube.dl(link, 3, 1); // Default to 128 kbps audio
    },
    async mp4(link) {
        return SaveTube.dl(link, 5, 2); // Default to 720p video
    }
};

async function Mp3(url) {
    return SaveTube.mp3(url);
}

async function Mp4(url) {
    return SaveTube.mp4(url);
}

export { SaveTube, Mp3, Mp4 };

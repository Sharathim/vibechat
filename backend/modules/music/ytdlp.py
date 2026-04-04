import yt_dlp

YDL_OPTS_BASE = {
    'quiet': True,
    'no_warnings': True,
    'noplaylist': True,
}

def get_audio_stream_url(youtube_id):
    """Extracts the direct audio stream URL."""
    url = f"https://www.youtube.com/watch?v={youtube_id}"
    opts = {
        **YDL_OPTS_BASE,
        'format': 'bestaudio[ext=m4a]/bestaudio/best',
        'skip_download': True,
    }
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info:
                return None, "Could not extract audio info"

            duration = info.get('duration', 0)
            if duration and duration > 600:
                return None, "Song exceeds 10 minute limit"

            # Find the best audio-only format
            formats = info.get('formats', [])
            audio_formats = [
                f for f in formats
                if f.get('acodec') != 'none' and f.get('vcodec') == 'none'
            ]
            if audio_formats:
                return audio_formats[-1]['url'], None
            
            # Fallback to the best available format if no audio-only found
            if formats:
                return formats[-1]['url'], None

            return None, "No suitable audio stream found"

    except yt_dlp.utils.DownloadError as e:
        print(f"yt-dlp error: {e}")
        return None, "Could not fetch audio"
    except Exception as e:
        print(f"Unexpected error in get_audio_stream_url: {e}")
        return None, str(e)


def get_song_metadata(youtube_id):
    """Extracts detailed metadata for a song."""
    url = f"https://www.youtube.com/watch?v={youtube_id}"
    opts = {
        **YDL_OPTS_BASE,
        'skip_download': True,
    }
    try:
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info:
                return None

            duration = info.get('duration', 0)
            if duration and duration > 600:
                return None

            thumbnails = info.get('thumbnails', [])
            thumbnail_url = ''
            if thumbnails:
                # Prefer higher resolution thumbnails
                thumbnail_url = thumbnails[-1].get('url', '')

            return {
                'youtube_id': youtube_id,
                'title': info.get('title', 'Unknown'),
                'artist': info.get('uploader', 'Unknown'),
                'duration': duration,
                'thumbnail_url': thumbnail_url,
                'tags': info.get('tags', []),
                'like_count': info.get('like_count'),
            }

    except Exception as e:
        print(f"yt-dlp metadata error: {e}")
        return None
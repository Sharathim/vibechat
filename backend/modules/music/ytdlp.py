import yt_dlp
import os
import tempfile
from config import Config

YDL_OPTS_AUDIO = {
    'format': 'bestaudio[ext=m4a]/bestaudio/best',
    'quiet': True,
    'no_warnings': True,
    'extract_flat': False,
    'noplaylist': True,
}

def get_audio_url(youtube_id):
    url = f"https://www.youtube.com/watch?v={youtube_id}"
    opts = {
        **YDL_OPTS_AUDIO,
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

            audio_url = info.get('url')
            if not audio_url:
                # Try to get from formats
                formats = info.get('formats', [])
                audio_formats = [
                    f for f in formats
                    if f.get('acodec') != 'none'
                    and f.get('vcodec') == 'none'
                ]
                if audio_formats:
                    audio_url = audio_formats[-1]['url']
                else:
                    audio_url = formats[-1]['url'] if formats else None

            return audio_url, None

    except yt_dlp.utils.DownloadError as e:
        print(f"yt-dlp error: {e}")
        return None, "Could not fetch audio"
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None, str(e)


def get_song_info(youtube_id):
    url = f"https://www.youtube.com/watch?v={youtube_id}"
    opts = {
        **YDL_OPTS_AUDIO,
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
                thumbnail_url = thumbnails[-1].get('url', '')

            return {
                'youtube_id': youtube_id,
                'title': info.get('title', 'Unknown'),
                'artist': info.get('uploader', 'Unknown'),
                'duration': duration,
                'thumbnail_url': thumbnail_url,
                'audio_url': info.get('url', ''),
            }

    except Exception as e:
        print(f"yt-dlp info error: {e}")
        return None


def download_to_s3(youtube_id):
    import boto3
    from botocore.exceptions import ClientError

    url = f"https://www.youtube.com/watch?v={youtube_id}"

    with tempfile.TemporaryDirectory() as tmpdir:
        output_path = os.path.join(tmpdir, f"{youtube_id}.%(ext)s")
        opts = {
            **YDL_OPTS_AUDIO,
            'outtmpl': output_path,
            'skip_download': False,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        }

        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=True)
                if not info:
                    return None

            # Find downloaded file
            mp3_path = os.path.join(tmpdir, f"{youtube_id}.mp3")
            if not os.path.exists(mp3_path):
                return None

            # Upload to S3
            if not Config.AWS_ACCESS_KEY_ID:
                print("[DEV] S3 not configured - returning local path")
                return None

            s3 = boto3.client(
                's3',
                aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY,
                region_name=Config.AWS_REGION,
            )

            s3_key = f"audio/{youtube_id}.mp3"
            s3.upload_file(
                mp3_path,
                Config.AWS_BUCKET_NAME,
                s3_key,
                ExtraArgs={'ContentType': 'audio/mpeg'}
            )

            s3_url = f"https://{Config.AWS_BUCKET_NAME}.s3.{Config.AWS_REGION}.amazonaws.com/{s3_key}"
            return s3_url

        except Exception as e:
            print(f"Download/upload error: {e}")
            return None
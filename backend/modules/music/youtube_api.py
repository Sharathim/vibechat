import requests
import yt_dlp
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from config import Config

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEO_URL = "https://www.googleapis.com/youtube/v3/videos"

REQUEST_TIMEOUT = (5, 15)


def _create_session():
    retry = Retry(
        total=2,
        connect=2,
        read=2,
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
    )
    adapter = HTTPAdapter(max_retries=retry)
    session = requests.Session()
    session.mount('https://', adapter)
    session.mount('http://', adapter)
    return session


def _get_json(url, params):
    session = _create_session()
    response = session.get(url, params=params, timeout=REQUEST_TIMEOUT)
    response.raise_for_status()
    return response.json()


def _search_songs_with_ytdlp(query, max_results):
    opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,
        'skip_download': True,
    }

    search_query = f"ytsearch{max_results}:{query} official audio OR official video OR lyrics"
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(search_query, download=False)

    entries = (info or {}).get('entries', []) or []
    results = []

    for entry in entries:
        if not entry:
            continue

        video_id = entry.get('id')
        if not video_id:
            continue

        duration = int(entry.get('duration') or 0)
        if duration > 600:
            continue

        thumbnails = entry.get('thumbnails') or []
        thumbnail_url = ''
        if thumbnails:
            thumbnail_url = thumbnails[-1].get('url', '') or ''

        if thumbnail_url.startswith('http://'):
            thumbnail_url = thumbnail_url.replace('http://', 'https://', 1)

        results.append({
            'youtube_id': video_id,
            'title': entry.get('title') or 'Unknown title',
            'artist': entry.get('uploader') or entry.get('channel') or 'Unknown artist',
            'thumbnail_url': thumbnail_url,
            'duration': duration,
        })

    return results

def search_songs(query, max_results=10):
    if not Config.YOUTUBE_API_KEY:
        return [], "YouTube API key not configured"

    try:
        params = {
            'part': 'snippet',
            'q': f"{query} official audio OR official video OR lyrics",
            'type': 'video',
            'videoCategoryId': '10',
            'topicId': '/m/04rlf',
            'maxResults': max_results,
            'key': Config.YOUTUBE_API_KEY,
            'videoDuration': 'medium',
            'order': 'relevance',
        }

        data = _get_json(YOUTUBE_SEARCH_URL, params)

        if 'error' in data:
            print(f"YouTube API returned error, falling back to yt-dlp: {data['error'].get('message', 'unknown')}")
            fallback_results = _search_songs_with_ytdlp(query, max_results)
            if fallback_results:
                return fallback_results, None
            return [], data['error']['message']

        items = data.get('items', [])
        video_ids = [item['id']['videoId'] for item in items]

        # Get video details (duration etc.)
        details = get_video_details(video_ids)
        details_map = {d['id']: d for d in details}

        results = []
        for item in items:
            video_id = item['id']['videoId']
            snippet = item['snippet']
            detail = details_map.get(video_id, {})

            duration = detail.get('duration', 0)

            # Skip videos longer than 10 minutes
            if duration > 600:
                continue

            thumbnail = (
                snippet['thumbnails'].get('maxres', {}).get('url') or
                snippet['thumbnails'].get('high', {}).get('url') or
                snippet['thumbnails'].get('medium', {}).get('url') or
                snippet['thumbnails'].get('default', {}).get('url', '')
            )
            # Force HTTPS
            if thumbnail.startswith('http://'):
                thumbnail = thumbnail.replace('http://', 'https://', 1)

            results.append({
                'youtube_id': video_id,
                'title': snippet['title'],
                'artist': snippet['channelTitle'],
                'thumbnail_url': thumbnail,
                'tags': detail.get('tags', []),
                'youtube_like_count': int(detail.get('youtube_like_count', 0)),
                'duration': duration,
            })

        return results, None

    except Exception as e:
        print(f"YouTube API error: {e}")
        try:
            fallback_results = _search_songs_with_ytdlp(query, max_results)
            if fallback_results:
                return fallback_results, None
        except Exception as fallback_error:
            print(f"yt-dlp fallback error: {fallback_error}")

        return [], str(e)


def get_video_details(video_ids):
    if not video_ids:
        return []

    try:
        params = {
            'part': 'contentDetails,snippet,statistics',
            'id': ','.join(video_ids),
            'key': Config.YOUTUBE_API_KEY,
        }

        data = _get_json(YOUTUBE_VIDEO_URL, params)

        results = []
        for item in data.get('items', []):
            duration_str = item['contentDetails']['duration']
            duration = parse_duration(duration_str)
            results.append({
                'id': item['id'],
                'duration': duration,
                'title': item['snippet']['title'],
                'channel': item['snippet']['channelTitle'],
                'tags': item['snippet'].get('tags', []),
                'youtube_like_count': int(item.get('statistics', {}).get('likeCount', 0) or 0),
            })

        return results

    except Exception as e:
        print(f"YouTube details error: {e}")
        return []


def parse_duration(duration_str):
    import re
    pattern = r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?'
    match = re.match(pattern, duration_str)
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds
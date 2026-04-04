import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from config import Config
import re

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


def search_songs(query, max_results=10):
    if not Config.YOUTUBE_API_KEY:
        return [], "YouTube API key not configured"

    try:
        params = {
            'part': 'snippet',
            'q': query,
            'type': 'video',
            'videoCategoryId': '10',  # Music category
            'maxResults': max_results,
            'key': Config.YOUTUBE_API_KEY,
            'videoDuration': 'any',
            'order': 'relevance',
        }

        data = _get_json(YOUTUBE_SEARCH_URL, params)

        if 'error' in data:
            return [], data['error']['message']

        items = data.get('items', [])
        video_ids = [item['id']['videoId'] for item in items]

        details = get_video_details(video_ids)
        details_map = {d['id']: d for d in details}

        results = []
        for item in items:
            video_id = item['id']['videoId']
            snippet = item['snippet']
            detail = details_map.get(video_id, {})

            duration = detail.get('duration', 0)
            if duration > 600:  # Skip videos longer than 10 minutes
                continue

            thumbnail = (
                snippet['thumbnails'].get('high', {}).get('url') or
                snippet['thumbnails'].get('medium', {}).get('url') or
                ''
            )

            results.append({
                'youtube_id': video_id,
                'title': snippet['title'],
                'artist': snippet['channelTitle'],
                'thumbnail_url': thumbnail,
                'duration': duration,
                'youtube_like_count': detail.get('like_count'),
                'tags': detail.get('tags', []),
            })

        return results, None

    except Exception as e:
        print(f"YouTube API error: {e}")
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
                'like_count': int(item.get('statistics', {}).get('likeCount', 0)),
                'tags': item.get('snippet', {}).get('tags', []),
            })

        return results

    except Exception as e:
        print(f"YouTube details error: {e}")
        return []


def parse_duration(duration_str):
    pattern = r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?'
    match = re.match(pattern, duration_str)
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds
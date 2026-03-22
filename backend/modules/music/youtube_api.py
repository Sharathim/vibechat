import requests
from config import Config

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_VIDEO_URL = "https://www.googleapis.com/youtube/v3/videos"

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

        response = requests.get(YOUTUBE_SEARCH_URL, params=params)
        data = response.json()

        if 'error' in data:
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
                'duration': duration,
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
            'part': 'contentDetails,snippet',
            'id': ','.join(video_ids),
            'key': Config.YOUTUBE_API_KEY,
        }

        response = requests.get(YOUTUBE_VIDEO_URL, params=params)
        data = response.json()

        results = []
        for item in data.get('items', []):
            duration_str = item['contentDetails']['duration']
            duration = parse_duration(duration_str)
            results.append({
                'id': item['id'],
                'duration': duration,
                'title': item['snippet']['title'],
                'channel': item['snippet']['channelTitle'],
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
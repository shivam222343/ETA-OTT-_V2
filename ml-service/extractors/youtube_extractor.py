import yt_dlp
import os
# whisper is lazy-loaded
import json
import uuid
import shutil
import subprocess

def setup_ffmpeg():
    """Ensure FFmpeg is in PATH, especially on Windows with local binaries."""
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("⚠️ Global FFmpeg not found, attempting to use imageio-ffmpeg binary...")
        try:
            import imageio_ffmpeg
            ffmpeg_bin = imageio_ffmpeg.get_ffmpeg_exe()
            ffmpeg_dir = os.path.dirname(ffmpeg_bin)
            
            # Create a proper "ffmpeg.exe" if it's named differently
            target_ffmpeg = os.path.join(ffmpeg_dir, "ffmpeg.exe")
            if not os.path.exists(target_ffmpeg):
                shutil.copy2(ffmpeg_bin, target_ffmpeg)
            
            if ffmpeg_dir not in os.environ["PATH"]:
                os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ["PATH"]
            return True
        except Exception as e:
            print(f"FFmpeg setup failed: {str(e)}")
            return False

def setup_js_runtime():
    """Ensure a JavaScript runtime (Deno/Node) is in PATH for yt-dlp signature deciphering."""
    # Add portable Deno (installed during Render native build phase) to PATH
    home_deno_dir = os.path.expanduser("~/.deno/bin")
    if os.path.exists(home_deno_dir) and home_deno_dir not in os.environ["PATH"]:
        os.environ["PATH"] = home_deno_dir + os.pathsep + os.environ["PATH"]
        print(f"✅ Added Deno JS runtime path to environment: {home_deno_dir}")
        return True
    return False

def extract_youtube(video_url):
    """
    Extracts audio from a YouTube video and transcribes it using Whisper.
    Thread-safe implementation for parallel extractions.
    """
    # Create a unique job directory to allow parallel processing
    job_id = str(uuid.uuid4())[:8]
    base_temp = os.path.abspath("temp_youtube")
    job_dir = os.path.join(base_temp, job_id)
    os.makedirs(job_dir, exist_ok=True)
    
    # Ensure FFmpeg and a JS runtime are available
    setup_ffmpeg()
    setup_js_runtime()
    
    # 1. Handle Cookies (Securely)
    # Priority: Env Var (Secret) > Render Secret File > Local File
    cookies_path = None
    temp_cookie_file = os.path.join(job_dir, "cookies.txt")
    
    env_cookies = os.getenv('YOUTUBE_COOKIES_CONTENT')
    render_secret_file = "/etc/secrets/youtube_cookies.txt"
    local_cookie_file = os.path.abspath("youtube_cookies.txt")
    
    if env_cookies:
        # If cookies are in env, write them to a temp file for this job
        # Handle cases where literal \\n is pasted in env var
        if "\\n" in env_cookies:
            env_cookies = env_cookies.replace("\\n", "\n")
        with open(temp_cookie_file, "w") as f:
            f.write(env_cookies)
        cookies_path = temp_cookie_file
    elif os.path.exists(render_secret_file):
        # Render secrets are read-only, yt-dlp needs a writable file to update cookies
        # Use open/read/write to avoid copying read-only permissions
        with open(render_secret_file, 'r') as f_in:
            with open(temp_cookie_file, 'w') as f_out:
                f_out.write(f_in.read())
        cookies_path = temp_cookie_file
    elif os.path.exists(local_cookie_file):
        cookies_path = local_cookie_file

    # yt-dlp options - output to specific job directory
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': os.path.join(job_dir, '%(id)s.%(ext)s'),
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
        'cookiefile': cookies_path,
        'writesubtitles': True,
        'writeautomaticsub': True,
        'subtitleslangs': ['en.*'],
        'skip_download': False,
        'ignoreerrors': False,  # Let it throw actual errors so we can catch and diagnose them
    }

    def extract_video_id(url):
        import re
        pattern = r'(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})'
        match = re.search(pattern, url)
        return match.group(1) if match else "youtube"

    def download_via_cobalt(video_url, job_dir):
        """
        Fallback method using public Cobalt API instances to get direct audio link,
        bypassing yt-dlp/YouTube bot detection blocks on Render.
        """
        import requests
        cobalt_instances = [
            "https://api.cobalt.tools",
            "https://cobalt.api.ryzetech.live",
            "https://co.wuk.sh"
        ]
        
        for instance in cobalt_instances:
            try:
                print(f"🔄 Attempting fallback extraction via Cobalt ({instance})...")
                payload = {
                    "url": video_url,
                    "isAudioOnly": True,
                    "audioFormat": "mp3",
                    "aFormat": "mp3"
                }
                headers = {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
                response = requests.post(instance, json=payload, headers=headers, timeout=15)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") in ["stream", "redirect"] and data.get("url"):
                        stream_url = data.get("url")
                        print(f"✅ Cobalt returned stream URL: {stream_url[:50]}...")
                        
                        audio_path = os.path.join(job_dir, "cobalt_audio.mp3")
                        audio_response = requests.get(stream_url, stream=True, timeout=90)
                        if audio_response.status_code == 200:
                            with open(audio_path, 'wb') as f:
                                for chunk in audio_response.iter_content(chunk_size=8192):
                                    f.write(chunk)
                            file_size = os.path.getsize(audio_path)
                            print(f"📥 Downloaded audio via Cobalt: {file_size / 1024 / 1024:.2f} MB")
                            
                            filename = data.get("filename", "YouTube Video")
                            title = filename.rsplit('.', 1)[0] if '.' in filename else filename
                            
                            return audio_path, title
            except Exception as e:
                print(f"⚠️ Cobalt instance {instance} failed: {e}")
                
        return None, None

    audio_path = None
    metadata = {}
    subs_text = None
    extracted_from = "whisper_model"

    try:
        # Inner try-except for the download step
        try:
            # 1. Attempt to extract metadata and download audio via yt-dlp first
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                print(f"📥 Downloading YouTube metadata/audio for job {job_id} via yt-dlp...")
                info = ydl.extract_info(video_url, download=True)
                if info is None:
                    raise Exception("YouTube extraction completely failed. The cookies might be invalid/expired, or YouTube is strictly blocking the server IP.")
                video_id = info['id']
                audio_path = os.path.join(job_dir, f"{video_id}.mp3")
                
                # Check for subtitles first
                subtitles = info.get('requested_subtitles')
                if subtitles:
                    print(f"📄 Found available subtitles for {video_id}, attempting to use them...")
                    # Find the downloaded subtitle file
                    # yt-dlp downloads them with .vtt or .srt extension
                    for file in os.listdir(job_dir):
                        if (file.endswith('.vtt') or file.endswith('.srt')) and video_id in file:
                            sub_file_path = os.path.join(job_dir, file)
                            try:
                                with open(sub_file_path, 'r', encoding='utf-8') as f:
                                    # Simple VTT/SRT parsing or just cleaning up
                                    content = f.read()
                                    # Extremely crude way to get just text (better than nothing)
                                    import re
                                    # Remove timestamps and metadata
                                    content = re.sub(r'\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}', '', content)
                                    content = re.sub(r'<[^>]*>', '', content)
                                    content = re.sub(r'WEBVTT|Kind:.*|Language:.*', '', content)
                                    # Remove line numbers (for SRT)
                                    content = re.sub(r'^\d+$', '', content, flags=re.MULTILINE)
                                    # Clean up extra whitespace
                                    lines = [line.strip() for line in content.split('\n') if line.strip()]
                                    subs_text = ' '.join(lines)
                                    if len(subs_text) > 50: # Ensure we actually got something
                                        print(f"✅ Successfully extracted {len(subs_text)} chars from YouTube subtitles.")
                                        extracted_from = "youtube_subtitles"
                                        break
                            except Exception as sub_e:
                                print(f"⚠️ Subtitle parsing failed: {sub_e}")

                metadata = {
                    "title": info.get('title'),
                    "description": info.get('description'),
                    "duration": info.get('duration'),
                    "uploader": info.get('uploader'),
                    "view_count": info.get('view_count'),
                    "thumbnail": info.get('thumbnail'),
                    "youtube_id": info.get('id')
                }
        except Exception as ytdl_err:
            print(f"⚠️ yt-dlp extraction failed: {ytdl_err}. Trying Cobalt fallback...")
            
            # 2. Try Cobalt API fallback if yt-dlp is blocked
            fallback_audio, cobalt_title = download_via_cobalt(video_url, job_dir)
            if fallback_audio:
                audio_path = fallback_audio
                video_id = extract_video_id(video_url)
                metadata = {
                    "title": cobalt_title or "YouTube Video (Cobalt Fallback)",
                    "description": "Extracted via Cobalt API fallback bypass.",
                    "duration": 0,  # Whisper transcription will define the text
                    "uploader": "Unknown",
                    "view_count": 0,
                    "thumbnail": f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
                    "youtube_id": video_id
                }
                extracted_from = "whisper_model"
            else:
                # If even Cobalt failed, raise the original yt-dlp error
                raise ytdl_err

        # 3. Return early if subtitles were successfully retrieved via yt-dlp
        if subs_text:
            return {
                "success": True,
                "metadata": metadata,
                "text": subs_text,
                "segments": [{"text": subs_text, "start": 0, "end": metadata.get("duration", 0)}],
                "language": "en",
                "summary": subs_text[:500] + "..." if len(subs_text) > 500 else subs_text,
                "thumbnail_url": metadata.get("thumbnail"),
                "thumbnail_public_id": "youtube",
                "extracted_from": extracted_from
            }

        # 4. Transcribe with Whisper (Fallback)
        from model_loader import get_whisper_model, get_whisper_lock
        whisper_model = get_whisper_model()
        whisper_lock = get_whisper_lock()
        
        # Verify audio file integrity before transcription
        if not os.path.exists(audio_path):
            # Check for alternative extensions
            fallback_files = [f for f in os.listdir(job_dir) if f.startswith(video_id) and f.endswith(('.mp3', '.m4a', '.wav', '.webm'))]
            if fallback_files:
                audio_path = os.path.join(job_dir, fallback_files[0])
            else:
                raise FileNotFoundError(f"Audio file missing before transcription!")
            
        file_size = os.path.getsize(audio_path)
        print(f"🎙️ Transcribing {job_id}: {metadata['title']} (Size: {file_size / 1024 / 1024:.2f} MB)")
        
        if file_size < 100:
            raise ValueError(f"Audio file is too small or empty ({file_size} bytes).")

        # Synchronize access to whisper model
        with whisper_lock:
            result = whisper_model.transcribe(audio_path, fp16=False)

        return {
            "success": True,
            "metadata": metadata,
            "text": result["text"],
            "segments": result["segments"],
            "language": result.get("language", "en"),
            "summary": result["text"][:500] + "..." if len(result["text"]) > 500 else result["text"],
            "thumbnail_url": metadata.get("thumbnail"),
            "thumbnail_public_id": "youtube",
            "extracted_from": "whisper_model"
        }

    except Exception as e:
        error_msg = str(e)
        print(f"❌ YouTube extraction error ({job_id}): {error_msg}")
        
        # Add helpful tip for Render/Bot detection issues
        if "Sign in to confirm you’re not a bot" in error_msg or "403" in error_msg:
            error_msg = (
                "YouTube bot detection blocked the request. "
                "TIP: Since this is running on Render, YouTube has flagged the server IP. "
                "To fix: Export your YouTube cookies using a 'Get cookies.txt' browser extension, "
                "save it as 'youtube_cookies.txt' in the ml-service folder, and redeploy. "
                f"| Raw Error: {error_msg}"
            )
            
        return {
            "success": False,
            "error": error_msg
        }
    finally:
        # Aggressive cleanup of only this job's directory
        try:
            if os.path.exists(job_dir):
                shutil.rmtree(job_dir, ignore_errors=True)
        except Exception as cleanup_err:
            print(f"⚠️ Cleanup failed for {job_id}: {cleanup_err}")

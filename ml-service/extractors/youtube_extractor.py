import yt_dlp
import os
import whisper
import json
import asyncio

async def extract_youtube(video_url):
    """
    Extracts audio from a YouTube video and transcribes it using Whisper.
    Also extracts metadata like title, description, and duration.
    """
    temp_dir = "temp_youtube"
    os.makedirs(temp_dir, exist_ok=True)
    
    # yt-dlp options
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': f'{temp_dir}/%(id)s.%(ext)s',
        'quiet': True,
        'no_warnings': True,
    }

    try:
        # 0. Set up FFmpeg from imageio-ffmpeg if global ffmpeg is missing
        import subprocess
        try:
            subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("⚠️ Global FFmpeg not found, attempting to use imageio-ffmpeg binary...")
            try:
                import imageio_ffmpeg
                ffmpeg_bin = imageio_ffmpeg.get_ffmpeg_exe()
                ffmpeg_dir = os.path.dirname(ffmpeg_bin)
                
                # Whisper/yt-dlp looks for "ffmpeg"
                import shutil
                target_ffmpeg = os.path.join(ffmpeg_dir, "ffmpeg.exe")
                if not os.path.exists(target_ffmpeg):
                    shutil.copy2(ffmpeg_bin, target_ffmpeg)
                
                if ffmpeg_dir not in os.environ["PATH"]:
                    os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ["PATH"]
            except Exception as e:
                print(f"FFmpeg setup failed: {str(e)}")

        # 1. Extract metadata and download audio
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            audio_path = os.path.join(temp_dir, f"{info['id']}.mp3")
            
            metadata = {
                "title": info.get('title'),
                "description": info.get('description'),
                "duration": info.get('duration'),
                "uploader": info.get('uploader'),
                "view_count": info.get('view_count'),
                "thumbnail": info.get('thumbnail'),
                "youtube_id": info.get('id')
            }

        # 2. Transcribe with Whisper
        print(f"🎙️ Starting Whisper transcription for YouTube video: {metadata['title']}")
        # Using a smaller model for faster processing if needed, but 'base' is usually fine
        model = whisper.load_model("base")
        result = model.transcribe(audio_path)

        return {
            "success": True,
            "metadata": metadata,
            "text": result["text"],
            "segments": result["segments"],
            "language": result.get("language", "en"),
            "summary": result["text"][:500] + "..." if len(result["text"]) > 500 else result["text"],
            "thumbnail_url": metadata.get("thumbnail"),
            "thumbnail_public_id": "youtube" # YouTube doesn't have a cloudinary public ID
        }

    except Exception as e:
        print(f"Error in extract_youtube: {str(e)}")
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        # Cleanup
        if os.path.exists(temp_dir):
            import shutil
            shutil.rmtree(temp_dir)

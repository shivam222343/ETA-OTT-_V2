import whisper
import os
import requests
import cloudinary
import cloudinary.api
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET'),
    secure=True
)

# model = whisper.load_model("base")

def download_video(url, dest_path):
    """Download video with proper authentication"""
    try:
        from urllib.parse import urlparse, unquote
        
        # For Cloudinary URLs, use authenticated download
        if 'cloudinary.com' in url:
            parsed_url = urlparse(url)
            path_parts = parsed_url.path.split('/')
            
            try:
                # Format: /cloud_name/video/upload/v12345/public_id
                upload_idx = path_parts.index('upload')
                res_type = path_parts[upload_idx - 1]
                
                after_upload = path_parts[upload_idx + 1:]
                
                if after_upload[0].startswith('v') and any(char.isdigit() for char in after_upload[0]):
                    public_id_parts = after_upload[1:]
                else:
                    public_id_parts = after_upload
                
                # Join and unquote
                public_id_with_ext = unquote('/'.join(public_id_parts))
                public_id = public_id_with_ext
                
                # For videos, we usually strip the extension from public_id for signing
                if res_type != 'raw':
                    public_id = public_id_with_ext.rsplit('.', 1)[0]
                
                print(f"🔍 Extracted for signing: res_type={res_type}, public_id={public_id}")
                
                # Use private_download_url
                authenticated_url = cloudinary.utils.private_download_url(
                    public_id,
                    resource_type=res_type,
                    type='upload',
                    format=public_id_with_ext.split('.')[-1] if '.' in public_id_with_ext else None
                )
                
                print(f"📥 Downloading ({res_type}) from authenticated URL...")
                response = requests.get(authenticated_url, stream=True, timeout=120)
                
                if response.status_code != 200:
                    print(f"⚠️ Authenticated URL failed ({response.status_code}), trying basic signed URL...")
                    alt_url, _ = cloudinary.utils.cloudinary_url(
                        public_id,
                        resource_type=res_type,
                        sign_url=True,
                        secure=True
                    )
                    response = requests.get(alt_url, stream=True, timeout=120)
            except (ValueError, IndexError) as e:
                print(f"⚠️ URL parsing error: {e}, using direct fallback")
                response = requests.get(url, stream=True, timeout=120)
        else:
            response = requests.get(url, stream=True, timeout=120)
        
        if response.status_code != 200:
            raise Exception(f"Failed to download video: {response.status_code}")
            
        with open(dest_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=65536):
                if chunk:
                    f.write(chunk)
    except Exception as e:
        print(f"Video download error: {str(e)}")
        raise e

async def extract_video(file_url):
    temp_video = "temp_video.mp4"
    
    try:
        # 0. Set up FFmpeg from imageio-ffmpeg if global ffmpeg is missing
        import subprocess
        import os
        import shutil
        try:
            subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("⚠️ Global FFmpeg not found, attempting to use imageio-ffmpeg binary...")
            try:
                import imageio_ffmpeg
                ffmpeg_bin = imageio_ffmpeg.get_ffmpeg_exe()
                ffmpeg_dir = os.path.dirname(ffmpeg_bin)
                
                # Whisper looks for "ffmpeg". If the binary is named "ffmpeg-win64..." 
                # we need to ensure "ffmpeg.exe" exists in that directory.
                target_ffmpeg = os.path.join(ffmpeg_dir, "ffmpeg.exe")
                if not os.path.exists(target_ffmpeg):
                    print(f"🔗 Creating ffmpeg.exe alias for: {ffmpeg_bin}")
                    shutil.copy2(ffmpeg_bin, target_ffmpeg)
                
                # Add the directory containing ffmpeg to the PATH
                if ffmpeg_dir not in os.environ["PATH"]:
                    os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ["PATH"]
                print(f"✅ FFmpeg setup complete in: {ffmpeg_dir}")
            except Exception as e:
                raise Exception(f"FFmpeg setup failed: {str(e)}. Please install FFmpeg manually.")

        # 1. Download video
        download_video(file_url, temp_video)
        
        # Transcribe directly with Whisper
        model = whisper.load_model("base")
        
        # Direct transcription
        print(f"🎙️ Starting Whisper transcription for: {temp_video}")
        result = model.transcribe(temp_video)

        # Generate thumbnail from video
        thumbnail_url = None
        thumbnail_public_id = None
        try:
            print("🖼️ Generating thumbnail for video...")
            # Extract frame at 1 second mark or middle of video
            thumb_path = "temp_thumb.jpg"
            subprocess.run([
                "ffmpeg", "-i", temp_video,
                "-ss", "00:00:01.000",
                "-vframes", "1",
                "-q:v", "2",
                thumb_path, "-y"
            ], capture_output=True, check=True)

            # Upload to Cloudinary
            import cloudinary.uploader
            upload_result = cloudinary.uploader.upload(
                thumb_path,
                folder="eta-thumbnails",
                resource_type="image"
            )
            thumbnail_url = upload_result.get("secure_url")
            thumbnail_public_id = upload_result.get("public_id")
            print(f"✅ Video Thumbnail uploaded: {thumbnail_url}")

            if os.path.exists(thumb_path):
                os.remove(thumb_path)
        except Exception as thumb_err:
            print(f"⚠️ Video Thumbnail generation failed: {str(thumb_err)}")
        
        return {
            "text": result["text"],
            "segments": result["segments"],
            "duration": result.get("duration", 0),
            "language": result.get("language", "en"),
            "summary": result["text"][:500] + "..." if len(result["text"]) > 500 else result["text"],
            "thumbnail_url": thumbnail_url,
            "thumbnail_public_id": thumbnail_public_id
        }
        
    except Exception as e:
        print(f"Error in extract_video: {str(e)}")
        raise e
    finally:
        # Cleanup
        if os.path.exists(temp_video):
            os.remove(temp_video)

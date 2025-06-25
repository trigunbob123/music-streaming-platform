import os
import subprocess
from django.conf import settings

class HLSService:
    @staticmethod
    def convert_to_hls(audio_file_path, output_dir):
        """將音頻文件轉換為 HLS 格式"""
        try:
            cmd = [
                'ffmpeg',
                '-i', audio_file_path,
                '-c:a', 'aac',
                '-b:a', '128k',
                '-hls_time', '10',
                '-hls_list_size', '0',
                '-f', 'hls',
                os.path.join(output_dir, 'playlist.m3u8')
            ]
            subprocess.run(cmd, check=True)
            return True
        except subprocess.CalledProcessError:
            return False
#!/bin/bash

echo "	Generating video thumbnails"

for video_path in $(find -name "*.mp4")
do
	video_folder="${video_path%/*}"
	video_name="${video_path##*/}"
	thumb_folder="${video_folder}/thumbs"
	thumb_path="${thumb_folder}/${video_name}.jpeg"
	echo "Video ${video_path}"
    echo "Thumb ${thumb_path}"
	if [ ! -d "$thumb_folder" ]; then
		echo "Creating thumb folder $thumb"
		mkdir "$thumb_folder"
	fi
	if [ -f "$thumb_path" ]; then
		echo "$thumb_path exists."
	else
		echo "Calling ffmpeg."
		ffmpeg -i "${video_path}" -ss "00:00:00.001" -vf 'scale=320:320:force_original_aspect_ratio=decrease' -y -vframes 1 "${thumb_path}"

		# Metadata
		# ffmpeg -i "${video_path}" -f ffmetadata "${thumb_path/%.jpeg/.txt}"
		# ffmpeg -i "${video_path}" -c copy -map_metadata 0 -map_metadata:s:v 0:s:v -map_metadata:s:a 0:s:a -f ffmetadata "${thumb_path/%.jpeg/.txt}"
	fi
	echo ""
done

echo "	Done"

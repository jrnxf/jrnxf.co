#!/bin/sh
# Records one clip (default: all) from its .tape and writes its poster frame, both into public/work/.
# Run from the repo root. Needs vhs and ffmpeg on PATH, plus the program the tape shows.
set -e
for name in ${@:-thokr fsrx}; do
  vhs "demos/$name.tape"
  # shrink to a small web loop: 640 wide, crf tuned for well under 1 MB, no audio, fast start
  ffmpeg -y -loglevel error -i "public/work/$name.mp4" -vf "scale=640:-2" -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p -an -movflags +faststart "public/work/$name.small.mp4"
  mv "public/work/$name.small.mp4" "public/work/$name.mp4"
  ffmpeg -y -loglevel error -ss 4 -i "public/work/$name.mp4" -frames:v 1 -vf scale=640:-2 "public/work/$name.jpg"
done

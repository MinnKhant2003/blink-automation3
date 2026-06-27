import ffmpeg from 'fluent-ffmpeg';

const cmd = ffmpeg()
  .input('video.mp4')
  .inputOptions(['-stream_loop', '-1'])
  .input('audio.mp3')
  .inputOptions(['-foo', 'bar'])
  .outputOptions(['-shortest']);

console.log(cmd._getArguments());

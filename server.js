const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// multer for file uploads
const upload = multer({ dest: 'uploads/' });
let outputDir = 'output_chunks';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}


// Copy file function
function copyFile(source, destination) {
  return new Promise((resolve, reject) => {
    fs.copyFile(source, destination, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve('File copied successfully');
      }
    });
  });
}

app.post('/split-video', upload.single('video'), (req, res) => {
  const inputVideoPath = req.file.path;
  const inputVideoName = req.body.name;

  const videoOutputDir = path.join(outputDir, `${inputVideoName}`);
  if (!fs.existsSync(videoOutputDir)) {
    fs.mkdirSync(videoOutputDir);
  }

  const playerSourcePath = path.join(__dirname, 'play_video.html');
  const playerDestinationPath = path.join(__dirname, `${videoOutputDir}`, 'play_video.html');

  const splitVideo = (inputPath, outputDir) => {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-c copy',     //Copy codec (no re-encoding)
          '-map 0',  // Map all streams from input to output
          '-f segment',   // Use segment format for splitting
          '-segment_time 1', // Set each chunk's duration to 1 second
          '-reset_timestamps 1', // Reset timestamps for each segment
          '-force_key_frames expr:gte(t,n_forced*1)',  // Ensure keyframe at each second
          '-reset_timestamps 1',  // Reset timestamps for each segment
        ])
        .output(path.join(outputDir, 'chunk_%01d.mp4')) // Output file pattern
        .on('end', () => {
          console.log('Splitting complete!');
          resolve();
        })
        .on('error', (err) => {
          console.error('Error:', err.message);
          reject(err);
        })
        .run();
    });
  };

  splitVideo(inputVideoPath, videoOutputDir)
    .then(() => {
      res.send({
        message: 'Video splited successfully!',
        chunksPath: path.join(__dirname, videoOutputDir),
      });
    })
    .catch((err) => {
      res.status(500).send({ error: 'Failed to split video', details: err.message });
    })
    .finally(async () => {
      // Copy video player html in video dir
      copyFile(playerSourcePath, playerDestinationPath).then((data) => {
        console.log("File copied successfully")
      }).catch(err => console.log(err))

      // Cleanup the uploaded video file after processing
      fs.unlink(inputVideoPath, (err) => {
        if (err) console.error('Error deleting uploaded file:', err.message);
      });
    });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

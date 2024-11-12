
const fs = require('fs');
const path  = require('path')

const chunkDir =  'output_chunks/asish';

const brokenChunkDir = "broken_chunks";

// Ensure the destination directory exists, if not, create it
fs.mkdir(brokenChunkDir, { recursive: true }, (err) => {
    if (err) {
      console.error('Error creating destination directory:', err);
      return;
    }
  
    // Read the files in the source directory
    fs.readdir(chunkDir, (err, files) => {
      if (err) {
        console.error('Error reading source directory:', err);
        return;
      }
  
      // Filter for .mp4 files (video chunks)
      const chunkFiles = files.filter(file => path.extname(file) === '.mp4');
  
      // Loop through each chunk file and copy it to the broken chunk directory
      chunkFiles.forEach(file => {
        const oldPath = path.join(chunkDir, file);
        const newPath = path.join(brokenChunkDir, file);
  
        // Copy the file to the broken chunk directory
        fs.copyFile(oldPath, newPath, (err) => {
          if (err) {
            console.error(`Error copying file ${file}:`, err);
          } else {
            console.log(`Successfully copied ${file} to broken_chunks`);
          }
        });
      });
    });
  });
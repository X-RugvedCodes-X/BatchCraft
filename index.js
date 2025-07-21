const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const natural = require("natural");
const readline = require("readline");

const videoDir = "."; 
const batchFile = "batches.txt";

function askUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => rl.question(question, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function getVideoDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

async function groupVideos(maxHours) {
  const MAX_BATCH_DURATION = maxHours * 60 * 60; // Convert to seconds

  const files = fs.readdirSync(videoDir).filter(file => file.endsWith(".mp4"));

  // Sorting Logic is here 
  files.sort(natural.compare);

  let videoData = [];

  for (const file of files) {
    try {
      let duration = await getVideoDuration(path.join(videoDir, file));
      videoData.push({ name: file, duration });
    } catch (error) {
      console.error(`Error reading ${file}:`, error);
    }
  }

  let totalDuration = videoData.reduce((sum, vid) => sum + vid.duration, 0);
  let batches = [];
  let currentBatch = [];
  let currentBatchDuration = 0;

  for (let video of videoData) {
    if (currentBatchDuration + video.duration > MAX_BATCH_DURATION) {
      batches.push({ videos: currentBatch, total: currentBatchDuration });
      currentBatch = [];
      currentBatchDuration = 0;
    }
    currentBatch.push(video);
    currentBatchDuration += video.duration;
  }

  if (currentBatch.length) {
    batches.push({ videos: currentBatch, total: currentBatchDuration });
  }

  let output = `Total Video Duration: ${formatTime(totalDuration)}\n\n`;
  batches.forEach((batch, i) => {
    output += `Batch ${i + 1} (Total: ${formatTime(batch.total)}):\n`;
    batch.videos.forEach(v => {
      output += `  - ${v.name} (${formatTime(v.duration)})\n`;
    });
    output += "\n";
  });

  fs.writeFileSync(batchFile, output);
  console.log("Batches saved to", batchFile);
}

function formatTime(seconds) {
  let h = Math.floor(seconds / 3600);
  let m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

async function run() {
  const input = await askUser("Enter max hours per batch (e.g., 2): ");
  const hours = parseFloat(input);

  if (isNaN(hours) || hours <= 0) {
    console.error("Invalid input. Please enter a positive number.");
    return;
  }
  // Verification Message
  console.log(`\n✅ Creating batches with max ${hours} hour(s) each...\n`);
  await groupVideos(hours);
}

run();

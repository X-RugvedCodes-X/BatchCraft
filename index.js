const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const readline = require("readline");
const naturalCompare = require("natural-compare-lite");

const videoDir = ".";
const batchFile = "batches.txt";

function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(res => rl.question(question, ans => {
    rl.close();
    res(ans);
  }));
}

function getVideoDuration(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);
      resolve(data.format.duration || 0);
    });
  });
}

function formatTime(seconds) {
  let h = Math.floor(seconds / 3600);
  let m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

async function groupVideos(maxHours, overflowMinutes) {
  const MAX = maxHours * 3600;
  const OVERFLOW = overflowMinutes * 60;

  const VIDEO_EXT = [".mp4", ".mkv", ".mov", ".avi", ".wmv", ".flv"];

  let files = fs.readdirSync(videoDir).filter(f =>
    VIDEO_EXT.includes(path.extname(f).toLowerCase())
  );

  files.sort(naturalCompare);

  let videoList = [];
  let totalAllVideos = 0;

  for (const file of files) {
    try {
      const duration = await getVideoDuration(path.join(videoDir, file));
      videoList.push({ name: file, duration });
      totalAllVideos += duration;
    } catch (err) {
      console.error("Error reading:", file, err);
    }
  }

  let batches = [];
  let currentBatch = [];
  let currentTime = 0;

  for (let v of videoList) {
    if (v.duration > MAX) {
      if (currentBatch.length) {
        batches.push({ videos: currentBatch, total: currentTime });
        currentBatch = [];
        currentTime = 0;
      }
      batches.push({ videos: [v], total: v.duration });
      continue;
    }

    if (currentTime + v.duration <= MAX + OVERFLOW) {
      currentBatch.push(v);
      currentTime += v.duration;
    } else {
      batches.push({ videos: currentBatch, total: currentTime });
      currentBatch = [v];
      currentTime = v.duration;
    }
  }

  if (currentBatch.length) {
    batches.push({ videos: currentBatch, total: currentTime });
  }

  let output = "";

  batches.forEach((batch, i) => {
    output += `Batch ${i + 1} (Total: ${formatTime(batch.total)}):\n`;
    batch.videos.forEach(v =>
      output += `  - ${v.name} (${formatTime(v.duration)})\n`
    );
    output += "\n";
  });

  output += "=============================\n";
  output += "FINAL SUMMARY\n";
  output += "=============================\n";
  output += `Total Batches: ${batches.length}\n`;
  output += `Total Combined Duration: ${formatTime(totalAllVideos)}\n`;

  fs.writeFileSync(batchFile, output);

  console.log("\nBatches saved to", batchFile);
  console.log("Total duration:", formatTime(totalAllVideos));
}

async function run() {
  const h = parseFloat(await ask("Max hours per batch (e.g., 2): "));
  const extra = parseFloat(await ask("Overflow minutes allowed (e.g., 20): "));

  if (isNaN(h) || h <= 0 || isNaN(extra) || extra < 0) {
    console.log("Invalid input.");
    return;
  }

  console.log(`\nCreating batches with ~${h}h + ${extra}m overflow...\n`);
  await groupVideos(h, extra);
}

run();
